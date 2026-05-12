/**
 * Cliente para el credit application API de Habi Capital (prod).
 *
 * Endpoints:
 *   POST  /credit-applications/   crear app (auth: M2M bearer)
 *   POST  /tyc/confirm            confirmar T&C (auth: M2M bearer)
 *   GET   /credit-applications/{id}
 *
 * Variables de entorno requeridas:
 *   HC_M2M_CLIENT_ID
 *   HC_M2M_CLIENT_SECRET
 *   HC_API_BASE         (opcional, default https://api.habicapital.com)
 *   HC_COGNITO_URL      (opcional, default prod)
 */

const DEFAULT_API_BASE = 'https://api.habicapital.com';
const DEFAULT_COGNITO_URL =
  'https://habicapital-core-backend-admin-prod.auth.us-east-2.amazoncognito.com/oauth2/token';

const LEGAL_DOCS = [
  {
    slug: 'politica-tratamiento-datos',
    document_hash:
      '6a63017c12a035b52339d23fbcc11087bb45076a6b753397b99593ffaec95272',
    title: 'Política de Tratamiento de Datos Personales',
    version: 'v1.0',
    language: 'es',
    content_url: '/legal-documents/politica-tratamiento-datos.pdf',
    published_at: '2025-07-02T10:00:00Z',
  },
  {
    slug: 'politica-datos-sensibles',
    document_hash:
      '94af631020ac966e804ad74621a54034ad92bb78bd33a667dba834a75e076362',
    title: 'Consentimiento de Tratamiento de Datos Sensibles',
    version: 'v1.0',
    language: 'es',
    content_url: '/legal-documents/politica-datos-sensibles.pdf',
    published_at: '2025-07-02T10:00:00Z',
  },
];

const TERMINAL_STATES = new Set([
  'approved',
  'rejected',
  'cancelled',
  'invalid',
  'error',
]);

export interface CreatedApp {
  appId: string | null;
  pivotId: string | null;
  notes: string;
}

export interface HuellaDigital {
  device?: string;
  browser?: string;
  language?: string;
  platform?: string;
  timezone?: string;
  user_agent?: string;
  screen_resolution?: string;
}

export interface ScoreOutcome {
  aplica: 'si' | 'no' | 'error' | 'pending';
  state: string;
  score?: number | null;
  nivel_riesgo?: string | null;
  metadata: Record<string, unknown>;
}

function envOr(key: string, fallback: string): string {
  const v = process.env[key];
  return v && v.length > 0 ? v : fallback;
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function cleanDocument(doc: string): string {
  return doc.replace(/[^\d]/g, '');
}

function fmtMoney(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  if (Number.isNaN(n)) return String(val);
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

async function getProdToken(): Promise<string> {
  const clientId = process.env.HC_M2M_CLIENT_ID;
  const clientSecret = process.env.HC_M2M_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('HC_M2M_CLIENT_ID / HC_M2M_CLIENT_SECRET no configurados');
  }
  const url = envOr('HC_COGNITO_URL', DEFAULT_COGNITO_URL);
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'api/habicapital/admin.read api/habicapital/admin.write',
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cognito ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('Cognito sin access_token');
  return data.access_token;
}

export async function createCreditApp(opts: {
  fullName: string;
  phone: string;
  document: string;
  token?: string;
}): Promise<CreatedApp> {
  const apiBase = envOr('HC_API_BASE', DEFAULT_API_BASE);
  const token = opts.token ?? (await getProdToken());
  const { firstName, lastName } = splitName(opts.fullName);
  const doc = cleanDocument(opts.document);

  const res = await fetch(`${apiBase}/credit-applications/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user: {
        first_name: firstName,
        last_name: lastName,
        phone_number: opts.phone,
        phone_number_prefix: '+57',
        document_type: 'CC',
        document_number: doc,
      },
      source: 'buyer_offer',
    }),
    signal: AbortSignal.timeout(25000),
    cache: 'no-store',
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (res.status === 201) {
    const aus = (body.application_users as Array<{ id?: string }> | undefined) ?? [];
    return {
      appId: (body.id as string) ?? null,
      pivotId: aus[0]?.id ?? null,
      notes: 'prod · app nueva',
    };
  }

  if (res.status === 409) {
    const err = String(body.error ?? body.detail ?? JSON.stringify(body));
    const match = err.match(/\(ID: ([a-f0-9-]{36})\)/);
    const appId = match?.[1] ?? null;
    let pivotId: string | null = null;
    if (appId) {
      try {
        const app = await getCreditApp(appId, token);
        const aus =
          (app.application_users as Array<{ id?: string }> | undefined) ?? [];
        pivotId = aus[0]?.id ?? null;
      } catch {
        // pivot will stay null; caller can skip TyC
      }
    }
    return { appId, pivotId, notes: 'prod · app existente' };
  }

  return {
    appId: null,
    pivotId: null,
    notes: `create error ${res.status}: ${JSON.stringify(body).slice(0, 200)}`,
  };
}

export async function confirmCreditAppTyc(opts: {
  pivotId: string;
  fullName: string;
  document: string;
  huella: HuellaDigital;
  ip: string;
  token?: string;
}): Promise<{ ok: boolean; notes: string }> {
  const apiBase = envOr('HC_API_BASE', DEFAULT_API_BASE);
  const token = opts.token ?? (await getProdToken());
  const { firstName, lastName } = splitName(opts.fullName);
  const doc = cleanDocument(opts.document);

  const res = await fetch(`${apiBase}/tyc/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Forwarded-For': opts.ip || '0.0.0.0',
    },
    body: JSON.stringify({
      tyc_type: 'pre-aprobacion',
      pivot_id: opts.pivotId,
      first_name: firstName,
      last_name: lastName,
      document_type: 'CC',
      document_number: doc,
      huella_digital: opts.huella,
      legal_documents: LEGAL_DOCS,
    }),
    signal: AbortSignal.timeout(25000),
    cache: 'no-store',
  });

  if (res.status === 200 || res.status === 201) {
    return { ok: true, notes: 'TyC confirmado' };
  }
  const text = await res.text().catch(() => '');
  return { ok: false, notes: `TyC ${res.status}: ${text.slice(0, 200)}` };
}

export async function getCreditApp(
  appId: string,
  token?: string,
): Promise<Record<string, unknown>> {
  const apiBase = envOr('HC_API_BASE', DEFAULT_API_BASE);
  const tk = token ?? (await getProdToken());
  const res = await fetch(`${apiBase}/credit-applications/${appId}`, {
    headers: { Authorization: `Bearer ${tk}` },
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GET app ${res.status}`);
  const body = (await res.json()) as Record<string, unknown>;
  return (body.data as Record<string, unknown>) ?? body;
}

export async function pollUntilTerminal(opts: {
  appId: string;
  maxMs?: number;
  intervalMs?: number;
  token?: string;
}): Promise<Record<string, unknown> | null> {
  const maxMs = opts.maxMs ?? 4 * 60 * 1000; // 4 min default
  const interval = opts.intervalMs ?? 12000;
  const token = opts.token ?? (await getProdToken());
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const app = await getCreditApp(opts.appId, token);
      const state = String(app.current_state ?? '');
      const last = (app.last_execution as Record<string, unknown> | null) ?? null;
      if (TERMINAL_STATES.has(state) || (last && last.status)) {
        return app;
      }
    } catch {
      // transient — keep polling
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  // Última lectura best-effort
  try {
    return await getCreditApp(opts.appId, token);
  } catch {
    return null;
  }
}

export function parseScoreOutcome(
  app: Record<string, unknown> | null,
  cedula: string,
  extraNotes = '',
): ScoreOutcome {
  if (!app) {
    return {
      aplica: 'pending',
      state: 'unknown',
      metadata: { cedula, Estado: 'unknown', Notas: extraNotes },
    };
  }
  const state = String(app.current_state ?? 'sin datos');
  const last = (app.last_execution as Record<string, unknown> | null) ?? null;
  const detail = (last?.detail as Record<string, unknown> | null) ?? null;
  const solicitantes =
    (detail?.solicitantes as Array<Record<string, unknown>> | undefined) ?? [];
  const s = solicitantes[0] ?? {};

  let aplica: 'si' | 'no' | 'error' | 'pending' = 'pending';
  if (state === 'approved') aplica = 'si';
  else if (state === 'error') aplica = 'error';
  else if (TERMINAL_STATES.has(state)) aplica = 'no';
  else aplica = 'pending'; // income_validation_pending, in_progress, etc.

  let score: number | null = null;
  const scoreRaw = s.score;
  if (scoreRaw !== undefined && scoreRaw !== null) {
    const n = typeof scoreRaw === 'number' ? scoreRaw : parseInt(String(scoreRaw), 10);
    if (!Number.isNaN(n)) score = n;
  }

  // Si el engine quedó en pending (típicamente income_validation_pending) pero
  // tenemos score, decide por score. Umbral del producto = 720.
  if (aplica === 'pending' && score !== null) {
    aplica = score >= 720 ? 'si' : 'no';
  }
  const nivel =
    (s.nivel_riesgo as string | undefined) ??
    (detail?.nivel_riesgo as string | undefined) ??
    null;

  const aportantes = (s.aportantes as Array<Record<string, unknown>> | undefined) ?? [];

  const metadata: Record<string, unknown> = {
    cedula,
    Estado: state,
    Aplica: aplica === 'si' ? 'Sí' : aplica === 'no' ? 'No' : aplica === 'error' ? 'Error' : 'Pendiente',
    Score: score,
    'Nivel Riesgo': nivel,
    'Ingresos Mensuales': fmtMoney(s.ingreso),
    'Fuente Ingresos':
      (aportantes[0]?.razon_social_aportante as string | undefined) ??
      (s.ocupacion as string | undefined) ??
      '',
    'Deudas Vigentes': fmtMoney(s.deudas),
    'Disponible Mensual': fmtMoney(s.disponible),
    'Máx. Crédito': fmtMoney(detail?.max_valor_credito_calculado),
    'Cuota Máxima': fmtMoney(detail?.cuota_inmueble_max),
    'Vigencia Aprobación': String(
      detail?.vigencia_aprobacion ?? last?.valid_until ?? '',
    ).slice(0, 19),
    Notas: extraNotes,
    'Score Mín 720':
      score !== null ? (score >= 720 ? 'Sí' : 'No') : '',
    Razón:
      score !== null && score >= 720
        ? `Score ${score} ≥ 720`
        : score !== null
          ? `Score ${score} < 720`
          : `Estado=${state}`,
  };

  if (last?.message) metadata['Mensaje engine'] = last.message;

  return { aplica, state, score, nivel_riesgo: nivel, metadata };
}

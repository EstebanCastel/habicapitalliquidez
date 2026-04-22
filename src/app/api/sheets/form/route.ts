import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getDocumentHashes } from '@/lib/document-hashes';
import type { ClientFingerprint } from '@/lib/fingerprint';

export const dynamic = 'force-dynamic';

function getAuth() {
  const credsRaw = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (!credsRaw) throw new Error('GOOGLE_SHEETS_CREDENTIALS not set');

  let creds: Record<string, string>;
  try {
    creds = JSON.parse(credsRaw);
  } catch {
    creds = JSON.parse(credsRaw.replace(/^['"]|['"]$/g, ''));
  }

  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// Columnas en Hoja 1 — orden definido por el usuario.
// Para hojas nuevas se escribe este orden completo. Para hojas existentes,
// se preservan los headers actuales y se anexan al final las que falten.
const COLUMNS = [
  'timestamp',
  'url',
  'uuid',
  'nombre_completo',
  'telefono',
  'cedula',
  'grupo',
  'producto',
  'tasa',
  'plazo_meses',
  'hash_politica_tratamiento_datos',
  'hash_politica_datos_sensibles',
  'huella_digital',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      document,
      phone,
      group,
      product,
      rate,
      termMonths,
      dealUuid,
      url,
      acceptedTerms,
      fingerprint,
    } = body as {
      fullName?: string;
      document?: string;
      phone?: string;
      group?: string;
      product?: string;
      rate?: number | string;
      termMonths?: number | string;
      dealUuid?: string;
      url?: string;
      acceptedTerms?: boolean;
      fingerprint?: Partial<ClientFingerprint>;
    };

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (acceptedTerms !== true) {
      return NextResponse.json(
        { error: 'Debes aceptar los Términos y Condiciones y la Política de Privacidad.' },
        { status: 400 },
      );
    }

    const sheetId = process.env.GOOGLE_SHEETS_ID;
    if (!sheetId) {
      console.error('[Sheets] GOOGLE_SHEETS_ID not configured');
      return NextResponse.json({ success: false, error: 'Sheets not configured' }, { status: 503 });
    }

    let auth;
    try {
      auth = getAuth();
    } catch (e) {
      console.error('[Sheets] Auth error:', e);
      return NextResponse.json({ success: false, error: 'Sheets auth failed' }, { status: 503 });
    }

    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '';
    const requestTime = new Date().toISOString();

    const huella = {
      device: fingerprint?.device || '',
      browser: fingerprint?.browser || '',
      language: fingerprint?.language || '',
      platform: fingerprint?.platform || '',
      timezone: fingerprint?.timezone || '',
      timestamp: fingerprint?.timestamp || '',
      ip_address: ipAddress,
      user_agent: fingerprint?.user_agent || request.headers.get('user-agent') || '',
      request_time: requestTime,
      screen_resolution: fingerprint?.screen_resolution || '',
    };

    let hashes;
    try {
      hashes = await getDocumentHashes();
    } catch (e) {
      console.error('[Sheets] Error calculando hashes de documentos legales:', e);
      return NextResponse.json(
        { success: false, error: 'No se pudieron procesar los documentos legales.' },
        { status: 500 },
      );
    }

    const sheets = google.sheets({ version: 'v4', auth });

    const metaRes = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetTitle = metaRes.data.sheets?.[0]?.properties?.title || 'Hoja 1';

    let existingHeaders: string[] = [];
    try {
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetTitle}!1:1`,
      });
      existingHeaders = (headerRes.data.values?.[0] as string[]) || [];
    } catch {
      // Hoja vacía
    }

    let finalHeaders: string[];
    if (existingHeaders.length === 0) {
      finalHeaders = COLUMNS;
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${sheetTitle}!1:1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [finalHeaders] },
      });
    } else {
      const missing = COLUMNS.filter((c) => !existingHeaders.includes(c));
      if (missing.length > 0) {
        finalHeaders = [...existingHeaders, ...missing];
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${sheetTitle}!1:1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [finalHeaders] },
        });
      } else {
        finalHeaders = existingHeaders;
      }
    }

    const rowData: Record<string, string> = {
      timestamp: requestTime,
      url: url || '',
      uuid: dealUuid || '',
      nombre_completo: fullName || '',
      telefono: phone || '',
      cedula: document || '',
      grupo: group || '',
      producto: product || '',
      tasa: rate !== undefined && rate !== null ? String(rate) : '',
      plazo_meses: termMonths !== undefined && termMonths !== null ? String(termMonths) : '',
      hash_politica_tratamiento_datos: hashes.politica_tratamiento_datos.hash,
      hash_politica_datos_sensibles: hashes.politica_datos_sensibles.hash,
      huella_digital: JSON.stringify(huella),
    };

    const row = finalHeaders.map((h) => rowData[h] ?? '');

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetTitle}!A:A`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    console.log(
      `[Form Fakedoor] Guardado: ${fullName} | uuid=${dealUuid} | grupo=${group} | url=${url} | ip=${ipAddress}`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Sheets] Error escribiendo formulario:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * Orquestador: crea credit application, confirma T&C, espera el engine y
 * escribe `Aplica` + `Metadata` en la fila del Sheet correspondiente.
 *
 * Diseñado para ser invocado en background (after()) desde el route de
 * /api/sheets/form, justo después de que la fila del lead se haya appendeado.
 */
import { google } from 'googleapis';

import {
  createCreditApp,
  confirmCreditAppTyc,
  pollUntilTerminal,
  parseScoreOutcome,
  type HuellaDigital,
} from './credit-app';

const APLICA_COL = 'Aplica';
const META_COL = 'Metadata';

function getSheetsAuth() {
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

function colIndexToA1(idx0: number): string {
  let n = idx0 + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Garantiza que las columnas Aplica + Metadata estén en la primera fila. */
async function ensureColumns(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  sheetTitle: string,
): Promise<{ headers: string[]; aplicaIdx: number; metaIdx: number }> {
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetTitle}!1:1`,
  });
  const headers = (headerRes.data.values?.[0] as string[]) ?? [];
  const missing: string[] = [];
  if (!headers.includes(APLICA_COL)) missing.push(APLICA_COL);
  if (!headers.includes(META_COL)) missing.push(META_COL);
  const newHeaders = [...headers, ...missing];
  if (missing.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetTitle}!1:1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newHeaders] },
    });
  }
  return {
    headers: newHeaders,
    aplicaIdx: newHeaders.indexOf(APLICA_COL),
    metaIdx: newHeaders.indexOf(META_COL),
  };
}

/** Encuentra la fila (1-based, incluye header en fila 1) cuyo `cedula` matchea. */
async function findRowByCedula(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  sheetTitle: string,
  cedulaCol: number,
  cedula: string,
): Promise<number | null> {
  const colLetter = colIndexToA1(cedulaCol);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetTitle}!${colLetter}:${colLetter}`,
  });
  const values = (res.data.values as string[][] | undefined) ?? [];
  for (let i = 1; i < values.length; i++) {
    if ((values[i][0] ?? '').trim() === cedula.trim()) {
      return i + 1;
    }
  }
  return null;
}

export interface ScoreLeadInput {
  fullName: string;
  phone: string;
  document: string;        // cédula (puede tener puntos para matchear el Sheet)
  documentApi?: string;    // cédula solo digits para el API (opcional)
  huella: HuellaDigital;
  ip: string;
  sheetId: string;
}

export async function scoreLeadAndWrite(input: ScoreLeadInput): Promise<void> {
  const docApi = (input.documentApi ?? input.document).replace(/[^\d]/g, '');
  const docSheet = input.document.trim();

  console.log(`[scoreLead] start cc=${docApi} (sheet=${docSheet}) name=${input.fullName}`);

  // FASE 1: create + TyC
  let appId: string | null = null;
  let pivotId: string | null = null;
  let notas = '';
  try {
    const created = await createCreditApp({
      fullName: input.fullName,
      phone: input.phone,
      document: docApi,
    });
    appId = created.appId;
    pivotId = created.pivotId;
    notas = created.notes;
    console.log(`[scoreLead] cc=${docApi} app_id=${appId} pivot=${pivotId} ${notas}`);
  } catch (e) {
    console.error(`[scoreLead] cc=${docApi} create error:`, e);
    notas = `create error: ${String(e).slice(0, 200)}`;
  }

  if (appId && pivotId) {
    try {
      const tyc = await confirmCreditAppTyc({
        pivotId,
        fullName: input.fullName,
        document: docApi,
        huella: input.huella,
        ip: input.ip,
      });
      notas += ` | ${tyc.notes}`;
      console.log(`[scoreLead] cc=${docApi} ${tyc.notes}`);
    } catch (e) {
      console.error(`[scoreLead] cc=${docApi} tyc error:`, e);
      notas += ` | TyC error: ${String(e).slice(0, 100)}`;
    }
  }

  // FASE 2: poll engine
  let app: Record<string, unknown> | null = null;
  if (appId) {
    try {
      app = await pollUntilTerminal({ appId, maxMs: 4 * 60 * 1000 });
    } catch (e) {
      console.error(`[scoreLead] cc=${docApi} poll error:`, e);
      notas += ` | poll error: ${String(e).slice(0, 100)}`;
    }
  }

  const outcome = parseScoreOutcome(app, docSheet, notas);
  console.log(
    `[scoreLead] cc=${docApi} → aplica=${outcome.aplica} state=${outcome.state} score=${outcome.score}`,
  );

  // FASE 3: write back al Sheet
  try {
    const auth = getSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId: input.sheetId });
    const sheetTitle = meta.data.sheets?.[0]?.properties?.title || 'Hoja 1';

    const cols = await ensureColumns(sheets, input.sheetId, sheetTitle);
    const cedulaIdx = cols.headers.indexOf('cedula');
    if (cedulaIdx < 0) {
      console.error('[scoreLead] No hay columna cedula en el sheet');
      return;
    }

    const rowNum = await findRowByCedula(
      sheets,
      input.sheetId,
      sheetTitle,
      cedulaIdx,
      docSheet,
    );
    if (!rowNum) {
      console.error(`[scoreLead] No matched row for cedula=${docSheet}`);
      return;
    }

    const aplicaCell = `${sheetTitle}!${colIndexToA1(cols.aplicaIdx)}${rowNum}`;
    const metaCell = `${sheetTitle}!${colIndexToA1(cols.metaIdx)}${rowNum}`;

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: input.sheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: [
          { range: aplicaCell, values: [[outcome.aplica]] },
          { range: metaCell, values: [[JSON.stringify(outcome.metadata)]] },
        ],
      },
    });
    console.log(`[scoreLead] cc=${docApi} ✓ Sheet actualizado row=${rowNum}`);
  } catch (e) {
    console.error(`[scoreLead] cc=${docApi} sheet write error:`, e);
  }
}

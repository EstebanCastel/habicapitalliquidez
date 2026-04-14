import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

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

// Columnas en Hoja 1 — orden definido por el usuario
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
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, document, phone, group, product, rate, termMonths, dealUuid, url } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    const sheets = google.sheets({ version: 'v4', auth });

    // Obtener nombre de la primera hoja
    const metaRes = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetTitle = metaRes.data.sheets?.[0]?.properties?.title || 'Hoja 1';

    // Leer headers existentes
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

    // Escribir headers si la hoja está vacía
    if (existingHeaders.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${sheetTitle}!1:1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [COLUMNS] },
      });
    }

    const row = [
      new Date().toISOString(),
      url || '',
      dealUuid || '',
      fullName || '',
      phone || '',
      document || '',
      group || '',
      product || '',
      rate?.toString() || '',
      termMonths?.toString() || '',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetTitle}!A:A`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    console.log(`[Form Fakedoor] Guardado: ${fullName} | uuid=${dealUuid} | grupo=${group} | url=${url}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Sheets] Error escribiendo formulario:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

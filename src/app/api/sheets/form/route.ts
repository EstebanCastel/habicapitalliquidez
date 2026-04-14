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

// Writes form submissions to Sheet 1 (Hoja 1) of the spreadsheet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, document, phone, group, product, rate, termMonths, dealUuid } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sheetId = process.env.GOOGLE_SHEETS_ID;
    if (!sheetId) {
      console.warn('GOOGLE_SHEETS_ID not configured');
      return NextResponse.json({ success: true, sheets: false });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Use sheet index 0 (Hoja 1 - the blank first sheet)
    // We use a named range approach: get sheet name from spreadsheet metadata
    const metaRes = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetTitle = metaRes.data.sheets?.[0]?.properties?.title || 'Hoja 1';

    // Read existing headers from row 1
    let existingHeaders: string[] = [];
    try {
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetTitle}!1:1`,
      });
      existingHeaders = (headerRes.data.values?.[0] as string[]) || [];
    } catch {
      // Empty sheet
    }

    const COLUMNS = [
      'timestamp',
      'nombre_completo',
      'cedula',
      'telefono',
      'grupo',
      'producto',
      'tasa',
      'plazo_meses',
      'deal_uuid',
    ];

    // Write headers if sheet is empty
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
      fullName || '',
      document || '',
      phone || '',
      group || '',
      product || '',
      rate?.toString() || '',
      termMonths?.toString() || '',
      dealUuid || '',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetTitle}!A:A`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    console.log(`[Form Fakedoor] Saved: ${fullName} | group=${group}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing form to Google Sheets:', error);
    // Don't block the user
    return NextResponse.json({ success: true, sheets: false });
  }
}

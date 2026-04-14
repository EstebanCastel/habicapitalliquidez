import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, document, phone, group, product, rate, termMonths, dealUuid } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!apiKey) {
      // Fail silently if no token – form still completes
      return NextResponse.json({ success: true, hubspot: false });
    }

    // Upsert contact in HubSpot
    const contactRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          firstname: fullName.split(' ')[0] || fullName,
          lastname: fullName.split(' ').slice(1).join(' ') || '',
          phone,
          ...(document ? { id_number: document } : {}),
          fakedoor_group: group,
          fakedoor_product: product,
          fakedoor_rate: rate?.toString(),
          fakedoor_term_months: termMonths?.toString(),
          ...(dealUuid ? { associated_deal_uuid: dealUuid } : {}),
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    const contactData = contactRes.ok ? await contactRes.json() : null;

    console.log(`[Lead Fakedoor] ${fullName} | group=${group} | contactId=${contactData?.id || 'error'}`);

    return NextResponse.json({ success: true, hubspot: true, contactId: contactData?.id });
  } catch (error) {
    console.error('Error saving lead to HubSpot:', error);
    // Don't block the user – return success anyway
    return NextResponse.json({ success: true, hubspot: false });
  }
}

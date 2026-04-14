import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function searchDealByUuid(dealUuid: string, apiKey: string) {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'deal_uuid',
          operator: 'EQ',
          value: dealUuid,
        }],
      }],
      properties: ['deal_uuid', 'ab_test_landing'],
      limit: 1,
    }),
    signal: AbortSignal.timeout(10000),
    cache: 'no-store',
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!data.results?.length) return null;

  return {
    id: data.results[0].id,
    properties: data.results[0].properties || {},
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dealUuid = searchParams.get('deal_uuid');

  if (!dealUuid) {
    return NextResponse.json({ error: 'deal_uuid is required' }, { status: 400 });
  }

  const apiKey = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
  }

  const deal = await searchDealByUuid(dealUuid, apiKey);
  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  return NextResponse.json({
    nid: deal.id,
    ab_test_landing: deal.properties.ab_test_landing || null,
  });
}

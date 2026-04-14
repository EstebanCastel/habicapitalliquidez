import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const VALID_GROUPS = ['AH', 'BH', 'CH', 'DH'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deal_uuid, group } = body;

    if (!deal_uuid || !group) {
      return NextResponse.json({ error: 'Missing deal_uuid or group' }, { status: 400 });
    }

    if (!VALID_GROUPS.includes(group)) {
      return NextResponse.json(
        { error: `Invalid group. Must be one of: ${VALID_GROUPS.join(', ')}` },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Search deal by UUID
    const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
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
            value: deal_uuid,
          }],
        }],
        properties: ['deal_uuid'],
        limit: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!searchRes.ok) {
      return NextResponse.json({ error: 'Failed to find deal' }, { status: 502 });
    }

    const searchData = await searchRes.json();
    if (!searchData.results?.length) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const dealId = searchData.results[0].id;

    // PATCH ab_test_landing property
    const patchRes = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { ab_test_landing: group },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error(`HubSpot PATCH error: ${patchRes.status}`, errText);
      return NextResponse.json({ error: 'Failed to update deal' }, { status: patchRes.status });
    }

    console.log(`[A/B Test Fakedoor] deal_uuid=${deal_uuid} assigned to group ${group}`);

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error in abc-group endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

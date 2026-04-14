import { NextRequest, NextResponse } from 'next/server';

const UUID_REGEX = /^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(UUID_REGEX);

  if (match) {
    const uuid = match[1];
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('deal_uuid', uuid);
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};

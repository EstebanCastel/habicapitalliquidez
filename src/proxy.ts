import { NextRequest, NextResponse } from 'next/server';

const UUID_REGEX = /^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

// Rutas de prueba: /123, /test, etc. → saltan HubSpot y asignan grupo aleatorio
const TEST_PATHS = ['/123', '/test', '/preview'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // UUID real → reescribir con deal_uuid
  const match = pathname.match(UUID_REGEX);
  if (match) {
    const uuid = match[1];
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('deal_uuid', uuid);
    return NextResponse.rewrite(url);
  }

  // Rutas de prueba → pasar deal_uuid de prueba + force_group para saltar HubSpot
  if (TEST_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('deal_uuid', pathname.slice(1)); // "123", "test", etc.
    url.searchParams.set('force_group', 'AH');            // grupo de prueba por defecto
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};

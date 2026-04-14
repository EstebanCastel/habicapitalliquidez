import { NextRequest, NextResponse } from 'next/server';

const UUID_REGEX = /^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cualquier ruta con un segmento (UUID real o slug de prueba) → reescribir a /
  // El cliente lee el pathname directamente con usePathname(), así que solo
  // necesitamos asegurarnos de que la página / se sirva para cualquier slug
  const singleSegment = /^\/([^/]+)$/.test(pathname);
  if (singleSegment) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};

import { NextRequest, NextResponse } from 'next/server';

const UUID_REGEX = /^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

// Rutas propias de la app que NO deben ser reescritas
const APP_ROUTES = new Set(['/solicitud', '/gracias', '/test', '/preview']);

// Extensiones de archivos estáticos que NO deben ser reescritas
const STATIC_EXT = /\.(png|ico|jpg|jpeg|svg|webp|gif|css|js|json|txt|xml|woff|woff2|ttf|pdf)$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar rutas de la app, archivos estáticos y rutas de sistema
  if (APP_ROUTES.has(pathname) || STATIC_EXT.test(pathname)) {
    return NextResponse.next();
  }

  // Cualquier otro segmento único → reescribir a / (UUID real o slug de deal)
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

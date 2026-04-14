/**
 * Ruta dinámica /[slug] — captura UUIDs y rutas de prueba directamente.
 * Funciona como fallback si el middleware no reescribe la URL (ej. en algunos
 * entornos de Vercel). La página principal lee el UUID desde el pathname
 * usando usePathname(), así que simplemente renderizamos el mismo Home.
 */
export { default } from '@/app/page';

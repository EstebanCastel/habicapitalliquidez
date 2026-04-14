import type { Metadata } from 'next';
import './globals.css';
import { SegmentAnalytics } from '@/components/SegmentAnalytics';

export const metadata: Metadata = {
  title: 'HabiCapital – Crédito para tu vivienda',
  description: 'Conoce las alternativas de crédito disponibles para ti en HabiCapital.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SegmentAnalytics writeKey={process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || ''} />
        {children}
      </body>
    </html>
  );
}

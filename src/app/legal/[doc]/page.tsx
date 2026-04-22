import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './legal.module.css';

const DOCS: Record<string, { title: string; file: string }> = {
  terminos: {
    title: 'Términos y Condiciones — Política de Tratamiento de Datos',
    file: '/politica-tratamiento-datos.pdf',
  },
  privacidad: {
    title: 'Política de Privacidad — Tratamiento de Datos Sensibles',
    file: '/politica-datos-sensibles.pdf',
  },
};

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export default async function LegalDocPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  const meta = DOCS[doc];
  if (!meta) notFound();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink} aria-label="HabiCapital">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/habicapital-logo.png" alt="HabiCapital" className={styles.logoImg} />
          </Link>
          <a
            href={meta.file}
            download
            className={styles.downloadBtn}
            aria-label="Descargar documento"
          >
            Descargar PDF
          </a>
        </div>
      </header>

      <div className={styles.titleBar}>
        <div className={styles.titleInner}>
          <p className={styles.eyebrow}>Documento legal</p>
          <h1 className={styles.title}>{meta.title}</h1>
        </div>
      </div>

      <div className={styles.viewer}>
        <iframe
          src={`${meta.file}#view=FitH`}
          title={meta.title}
          className={styles.frame}
        />
        <p className={styles.fallback}>
          ¿No puedes ver el documento?{' '}
          <a href={meta.file} target="_blank" rel="noopener noreferrer">
            Ábrelo en una nueva pestaña
          </a>
          .
        </p>
      </div>
    </div>
  );
}

import { LeadForm } from '@/components/LeadForm';
import styles from './solicitud.module.css';

export default function SolicitudPage() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="/" className={styles.logo}>
            <span className={styles.logoHabi}>Habi</span>
            <span className={styles.logoCapital}>Capital</span>
          </a>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.grid}>
          {/* Left */}
          <div className={styles.left}>
            <p className={`${styles.eyebrow} animate-slide-up`}>Solicitud de crédito</p>
            <h1 className={`${styles.title} animate-slide-up-d1`}>
              Cuéntanos<br />sobre ti
            </h1>
            <p className={`${styles.subtitle} animate-slide-up-d2`}>
              Completa tus datos para que un asesor de HabiCapital pueda contactarte y guiarte en el proceso.
            </p>

            <div className={`${styles.trustPills} animate-slide-up-d3`}>
              <div className={styles.pill}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Datos protegidos
              </div>
              <div className={styles.pill}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Respuesta rápida
              </div>
            </div>
          </div>

          {/* Right - form */}
          <div className={`${styles.right} animate-card-reveal`}>
            <LeadForm />
          </div>
        </div>
      </div>
    </div>
  );
}

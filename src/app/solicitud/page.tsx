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
              <div className={styles.pill}>🔒 Datos protegidos</div>
              <div className={styles.pill}>⚡ Respuesta rápida</div>
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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackPage } from '@/components/SegmentAnalytics';
import type { Assignment } from '@/lib/assignment';
import styles from './gracias.module.css';

export default function GraciasPage() {
  const [firstName, setFirstName] = useState('');
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    const lead = localStorage.getItem('fakedoor.lead');
    if (lead) {
      const parsed = JSON.parse(lead);
      const name = parsed.fullName?.split(' ')[0] || '';
      setFirstName(name);
    }

    const stored = localStorage.getItem('fakedoor.assignment');
    if (stored) setAssignment(JSON.parse(stored));

    trackPage('page_view_fakedoor', { page: 'gracias' });
  }, []);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoHabi}>Habi</span>
            <span className={styles.logoCapital}>Capital</span>
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        <div className={`${styles.card} animate-card-reveal`}>
          {/* Icon */}
          <div className={styles.iconWrapper}>
            <svg className={styles.icon} fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="24" cy="24" r="22" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 24.5l5.5 5.5 10.5-11" />
            </svg>
          </div>

          {/* Text */}
          <p className={`${styles.eyebrow} animate-slide-up`}>Solicitud recibida</p>
          <h1 className={`${styles.title} animate-slide-up-d1`}>
            {firstName ? `¡Gracias, ${firstName}!` : '¡Gracias!'}
          </h1>
          <p className={`${styles.subtitle} animate-slide-up-d2`}>
            Recibimos tu solicitud correctamente. Un asesor de HabiCapital te contactará lo más pronto posible para guiarte en el proceso de tu crédito.
          </p>

          {assignment && (
            <div className={`${styles.productSummary} animate-slide-up-d3`}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Producto</span>
                <span className={styles.summaryValue}>{assignment.productLabel}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Tasa desde</span>
                <span className={styles.summaryValue}>{assignment.rateLabel} E.A.</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Plazo</span>
                <span className={styles.summaryValue}>{assignment.termLabel}</span>
              </div>
            </div>
          )}

          <div className={`${styles.infoCards} animate-scale-in`}>
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>📞</span>
              <div>
                <p className={styles.infoTitle}>Te llamaremos pronto</p>
                <p className={styles.infoDesc}>Un asesor experto se comunicará contigo en las próximas horas.</p>
              </div>
            </div>
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>🏠</span>
              <div>
                <p className={styles.infoTitle}>100% digital</p>
                <p className={styles.infoDesc}>Todo el proceso desde la comodidad de tu casa, sin filas ni papeleos.</p>
              </div>
            </div>
          </div>

          <Link href="/" className={styles.backLink}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

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
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/habicapital-logo.png" alt="HabiCapital" className={styles.logoImg} />
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
              <span className={styles.infoIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.08 1.18 2 2 0 012.08 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.11 7.91a16 16 0 006.97 6.97l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </span>
              <div>
                <p className={styles.infoTitle}>Te llamaremos pronto</p>
                <p className={styles.infoDesc}>Un asesor experto se comunicará contigo en las próximas horas.</p>
              </div>
            </div>
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </span>
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

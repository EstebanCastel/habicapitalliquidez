'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { trackEvent, trackPage } from '@/components/SegmentAnalytics';
import { collectClientFingerprint } from '@/lib/fingerprint';
import { PENDING_CONSENT } from '@/lib/pending-consent';
import { buildAssignment } from '@/lib/assignment';
import styles from './consentimiento.module.css';

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default function ConsentimientoPage({ params }: PageProps) {
  const { uuid } = use(params);

  const lead = useMemo(() => PENDING_CONSENT[uuid] || null, [uuid]);
  const assignment = useMemo(
    () => (lead ? buildAssignment(lead.group, uuid) : null),
    [lead, uuid],
  );

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (lead) {
      trackPage('page_view_fakedoor', {
        page: 'consentimiento_diferido',
        deal_uuid: uuid,
        group: lead.group,
      });
    }
  }, [lead, uuid]);

  if (!lead || !assignment) {
    return (
      <div className={styles.invalidPage}>
        <div className={styles.invalidCard}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/habicapital-logo.png" alt="HabiCapital" className={styles.invalidLogo} />
          <h1 className={styles.invalidTitle}>Enlace no válido</h1>
          <p className={styles.invalidText}>
            Este enlace de consentimiento no existe o ya expiró. Por favor contacta a tu asesor de HabiCapital.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/habicapital-logo.png" alt="HabiCapital" className={styles.logoImg} />
          </div>
        </header>
        <div className={styles.successWrap}>
          <div className={`${styles.successCard} animate-card-reveal`}>
            <div className={styles.successIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="24" cy="24" r="22" strokeOpacity="0.18" strokeWidth="3" />
                <path d="M16 24.5l5.5 5.5 10.5-11" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className={styles.successTitle}>¡Gracias, {lead.fullName.split(' ')[0]}!</h1>
            <p className={styles.successText}>
              Confirmamos tu autorización de Términos y Condiciones y Política de Privacidad.
              Tu asesor de HabiCapital se pondrá en contacto contigo para los siguientes pasos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function handleConfirm() {
    if (!lead || !assignment) return;
    if (!acceptedTerms) {
      setError('Debes aceptar los Términos y Condiciones y la Política de Privacidad para continuar.');
      return;
    }
    setError('');
    setLoading(true);

    trackEvent('click_button_fakedoor', {
      button: 'submit_consent_retro',
      group: lead.group,
      product: lead.product,
      deal_uuid: uuid,
    });

    const fingerprint = collectClientFingerprint();

    const payload = {
      fullName: lead.fullName,
      document: lead.document,
      phone: lead.phone,
      group: lead.group,
      product: lead.product,
      rate: lead.rate,
      termMonths: lead.termMonths,
      dealUuid: uuid,
      url: typeof window !== 'undefined' ? window.location.href : '',
      acceptedTerms: true,
      fingerprint,
      consentMeta: {
        source: 'pending_consent_retro',
        originalTimestamp: lead.originalTimestamp,
        originalUrl: lead.originalUrl,
      },
    };

    try {
      const res = await fetch('/api/sheets/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError('No pudimos registrar tu autorización en este momento. Intenta de nuevo en unos minutos.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/habicapital-logo.png" alt="HabiCapital" className={styles.logoImg} />
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.left}>
            <p className={`${styles.eyebrow} animate-slide-up`}>Confirmación de autorización</p>
            <h1 className={`${styles.title} animate-slide-up-d1`}>
              Hola, {lead.fullName.split(' ')[0]}
            </h1>
            <p className={`${styles.subtitle} animate-slide-up-d2`}>
              Estos son los datos que registramos en tu solicitud anterior. Solo necesitamos
              que confirmes la aceptación de nuestros Términos y Condiciones y la Política de
              Privacidad para que podamos avanzar.
            </p>
          </div>

          <div className={`${styles.right} animate-card-reveal`}>
            <div className={styles.card}>
              <div className={styles.productBadge}>
                <span className={styles.productBadgeLabel}>{assignment.productLabel}</span>
                <span className={styles.productBadgeRate}>
                  {assignment.rateLabel} E.A. · {assignment.termLabel}
                </span>
              </div>

              <div className={styles.previewBlock}>
                <p className={styles.previewTitle}>Tus datos</p>
                <div className={styles.previewGrid}>
                  <PreviewField label="Nombre completo" value={lead.fullName} />
                  <PreviewField label="Cédula" value={lead.document} />
                  <PreviewField label="Celular" value={lead.phone} />
                </div>
                <p className={styles.previewHint}>
                  ¿Hay algún dato incorrecto? Avísale a tu asesor antes de confirmar.
                </p>
              </div>

              <label className={styles.consentRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span className={styles.consentText}>
                  Al autorizar, aceptas nuestros{' '}
                  <a
                    href="/legal/terminos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.consentLink}
                  >
                    Términos y Condiciones
                  </a>{' '}
                  y{' '}
                  <a
                    href="/legal/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.consentLink}
                  >
                    Política de Privacidad
                  </a>
                  .
                </span>
              </label>

              {error && <div className={styles.errorBox}>{error}</div>}

              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className={styles.submitBtn}
                >
                  {loading ? 'Confirmando...' : 'Confirmar y autorizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.previewItem}>
      <span className={styles.previewLabel}>{label}</span>
      <span className={styles.previewValue}>{value}</span>
    </div>
  );
}

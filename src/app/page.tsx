'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { buildAssignment, parseHubSpotGroup, randomGroup, type Assignment } from '@/lib/assignment';
import { trackEvent, trackPage } from '@/components/SegmentAnalytics';
import styles from './page.module.css';

function InvalidAccess() {
  return (
    <div className={styles.invalidPage}>
      <div className={styles.invalidCard}>
        <div className={styles.invalidIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/habicapital-logo.png" alt="HabiCapital" className={styles.invalidLogo} />
        <h1 className={styles.invalidTitle}>Acceso no válido</h1>
        <p className={styles.invalidText}>
          Para acceder a tu propuesta personalizada, necesitas el enlace único que tu asesor de HabiCapital te envió.
        </p>
        <p className={styles.invalidHint}>
          Si ya tienes un enlace, por favor ábrelo directamente para ver tu oferta de crédito.
        </p>
      </div>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const dealUuid = searchParams.get('deal_uuid');
  const channelParam = searchParams.get('channel');

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [hubspotFailed, setHubspotFailed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const logWhatsApp = useCallback(async () => {
    if (channelParam !== 'whatsapp') return;
    const fullUrl = window.location.href;
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => { params[key] = value; });
    fetch('/api/sheets/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullUrl, params }),
    }).catch((err) => console.error('[Sheets log] Error:', err));
  }, [channelParam, searchParams]);

  useEffect(() => {
    // No UUID → block immediately, no loading
    if (!dealUuid) {
      setLoading(false);
      return;
    }

    async function init() {
      await logWhatsApp();

      let group = null;

      try {
        const res = await fetch(`/api/hubspot?deal_uuid=${dealUuid}`);
        if (res.ok) {
          const data = await res.json();
          group = parseHubSpotGroup(data.abc_test_landing);
        } else if (res.status === 404) {
          // Deal not found in HubSpot → block access
          setHubspotFailed(true);
          setLoading(false);
          return;
        } else {
          // Unexpected server error → block access
          setHubspotFailed(true);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('[HubSpot] Error:', err);
        setHubspotFailed(true);
        setLoading(false);
        return;
      }

      // No group assigned yet → assign randomly and write back to HubSpot
      if (!group) {
        group = randomGroup();
        fetch('/api/hubspot/abc-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deal_uuid: dealUuid, group }),
        }).catch((err) => console.error('[ABC group] Error:', err));
      }

      const a = buildAssignment(group, dealUuid);
      setAssignment(a);
      localStorage.setItem('fakedoor.assignment', JSON.stringify(a));
      setLoading(false);

      trackPage('page_view_fakedoor', {
        group,
        deal_uuid: dealUuid,
        channel: channelParam,
        product: a.product,
      });
    }

    init();
  }, [dealUuid, channelParam, logWhatsApp]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  // No UUID or HubSpot failed → show invalid access screen
  if (!dealUuid || hubspotFailed) {
    return <InvalidAccess />;
  }

  if (!assignment) return null;

  const isGH = assignment.product === 'garantia_hipotecaria';

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.headerInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/habicapital-logo.png" alt="HabiCapital" className={styles.logoImg} />
        </div>
      </header>

      {/* Hero */}
      <div className={styles.heroWrapper}>
        <div className={styles.heroBg}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=85&auto=format&fit=crop"
            alt=""
            className={`${styles.heroImg} animate-fade-in`}
          />
          <div className={styles.heroOverlay} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <p className={`${styles.heroEyebrow} animate-slide-up`}>
              {isGH ? 'Crédito hipotecario' : 'Crédito de consumo'}
            </p>
            <h1 className={`${styles.heroTitle} animate-slide-up-d1`}>
              Tu crédito de vivienda<br />más fácil y seguro
            </h1>
            <p className={`${styles.heroSubtitle} animate-slide-up-d2`}>
              {assignment.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Offer Card */}
      <div className={styles.cardSection}>
        <div className={styles.cardWrapper}>
          <div className={`${styles.card} animate-card-reveal`}>
            <div className={styles.cardLeft}>
              <p className={styles.cardTag}>Alternativa recomendada</p>
              <h2 className={styles.cardTitle}>{assignment.productLabel}</h2>
              <p className={styles.cardDesc}>
                {isGH
                  ? 'Financiación respaldada por tu inmueble, con plazos amplios y cuotas cómodas.'
                  : 'Crédito flexible sin hipoteca, ideal para cualquier necesidad.'}
              </p>

              <div className={styles.cardMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Tasa E.A.</span>
                  <span className={styles.metaValue}>{assignment.rateLabel}</span>
                </div>
                <div className={styles.metaDivider} />
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Plazo</span>
                  <span className={styles.metaValue}>{assignment.termLabel}</span>
                </div>
              </div>
            </div>

            <div className={styles.cardRight}>
              <div className={styles.rateBox}>
                <p className={styles.rateBoxLabel}>Tasa desde</p>
                <div className={styles.rateBoxValue}>
                  <span className={styles.rateNumber}>{assignment.rate}</span>
                  <span className={styles.ratePct}>%</span>
                </div>
                <p className={styles.rateBoxSub}>E.A.</p>
              </div>

              <Link
                href="/solicitud"
                className={styles.applyBtn}
                onClick={() => {
                  trackEvent('click_button_fakedoor', {
                    button: 'aplicar',
                    group: assignment.group,
                    product: assignment.product,
                    rate: assignment.rate,
                    deal_uuid: assignment.dealUuid,
                  });
                }}
              >
                Aplicar ahora
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust indicators */}
      <div className={styles.trustSection}>
        <div className={styles.trustGrid}>
          <div className={`${styles.trustItem} animate-scale-in`}>
            <div className={styles.trustIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className={styles.trustTitle}>100% digital y seguro</p>
            <p className={styles.trustDesc}>
              Tus datos se protegen con los más altos estándares de seguridad bancaria.
            </p>
          </div>
          <div className={`${styles.trustItem} animate-scale-in-d1`}>
            <div className={styles.trustIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className={styles.trustTitle}>Respuesta en minutos</p>
            <p className={styles.trustDesc}>
              Sin filas ni papeleos. Aprobación en línea con desembolso en 10 días.
            </p>
          </div>
          <div className={`${styles.trustItem} animate-scale-in-d2`}>
            <div className={styles.trustIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <p className={styles.trustTitle}>Tasa aprobada, tasa desembolsada</p>
            <p className={styles.trustDesc}>
              Transparencia total: la tasa que aprobamos es la que recibes.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2024 HabiCapital. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#9709c6', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

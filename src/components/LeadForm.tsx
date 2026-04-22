'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/components/SegmentAnalytics';
import type { Assignment } from '@/lib/assignment';
import { collectClientFingerprint } from '@/lib/fingerprint';
import styles from './LeadForm.module.css';

interface FormState {
  fullName: string;
  document: string;
  phone: string;
  acceptedTerms: boolean;
}

const initialState: FormState = {
  fullName: '',
  document: '',
  phone: '',
  acceptedTerms: false,
};

export function LeadForm() {
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('fakedoor.assignment');
    if (stored) setAssignment(JSON.parse(stored));
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((cur) => ({ ...cur, [key]: value }));
  }

  function validate() {
    if (!form.fullName.trim()) return 'Por favor ingresa tu nombre completo.';
    if (!form.document.trim()) return 'Por favor ingresa tu número de cédula.';
    if (form.phone.replace(/\D/g, '').length < 10) return 'Ingresa un número de celular válido (mínimo 10 dígitos).';
    if (!form.acceptedTerms) return 'Debes aceptar los Términos y Condiciones y la Política de Privacidad para continuar.';
    return '';
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const err = validate();
    setError(err);
    if (err) return;

    setLoading(true);

    trackEvent('click_button_fakedoor', {
      button: 'submit_form',
      group: assignment?.group,
      product: assignment?.product,
      deal_uuid: assignment?.dealUuid,
    });

    const fingerprint = collectClientFingerprint();

    const payload = {
      fullName: form.fullName,
      document: form.document,
      phone: form.phone,
      group: assignment?.group,
      product: assignment?.product,
      rate: assignment?.rate,
      termMonths: assignment?.termMonths,
      dealUuid: assignment?.dealUuid,
      url: typeof window !== 'undefined' ? window.location.href : '',
      acceptedTerms: form.acceptedTerms,
      fingerprint,
    };

    try {
      localStorage.setItem('fakedoor.lead', JSON.stringify(payload));

      await fetch('/api/sheets/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Optionally save to HubSpot contact
      await fetch('/api/hubspot/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      router.push('/gracias');
    } catch {
      setError('No pudimos registrar tus datos en este momento. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {assignment && (
        <div className={styles.productBadge}>
          <span className={styles.productBadgeLabel}>{assignment.productLabel}</span>
          <span className={styles.productBadgeRate}>{assignment.rateLabel} E.A. · {assignment.termLabel}</span>
        </div>
      )}

      <div className={styles.fields}>
        <label className={styles.label}>
          <span className={styles.labelText}>Nombre completo</span>
          <input
            className={styles.input}
            placeholder="Ej: Juan Pablo Montoya"
            value={form.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            autoComplete="name"
          />
        </label>

        <label className={styles.label}>
          <span className={styles.labelText}>Número de cédula</span>
          <input
            className={styles.input}
            placeholder="1.000.000.000"
            value={form.document}
            onChange={(e) => updateField('document', e.target.value)}
            inputMode="numeric"
          />
        </label>

        <label className={styles.label} style={{ gridColumn: '1 / -1' }}>
          <span className={styles.labelText}>Número de celular</span>
          <input
            className={styles.input}
            placeholder="+57 300 000 0000"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
        </label>
      </div>

      <label className={styles.consentRow}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={form.acceptedTerms}
          onChange={(e) => updateField('acceptedTerms', e.target.checked)}
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

      <p className={styles.disclaimer}>
        Al continuar autorizas a HabiCapital a contactarte y a consultar tu información ante las centrales de riesgo, conforme a nuestra política de tratamiento de datos personales.
      </p>

      <div className={styles.actions}>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Enviando...' : 'Quiero que me contacten'}
        </button>
      </div>
    </form>
  );
}

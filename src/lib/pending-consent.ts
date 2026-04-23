import type { TestGroup } from './assignment';

export interface PendingConsentLead {
  fullName: string;
  document: string;
  phone: string;
  group: TestGroup;
  product: 'libre_inversion';
  rate: number;
  termMonths: number;
  originalTimestamp: string;
  originalUrl: string;
}

/**
 * Leads que se registraron antes de la captura de T&C / huella digital.
 * Cuando uno de estos UUIDs entra a la app, se le redirige a la pantalla
 * de consentimiento diferido en lugar de la landing.
 */
export const PENDING_CONSENT: Record<string, PendingConsentLead> = {
  '0d9baf2c-547d-46e1-b3f4-40e316f64e0e': {
    fullName: 'Juan Daniel Jaimes Casas',
    document: '1001113710',
    phone: '3188424175',
    group: 'AH',
    product: 'libre_inversion',
    rate: 20,
    termMonths: 84,
    originalTimestamp: '2026-04-22T17:35:43.994Z',
    originalUrl:
      'https://habicapitalliquidez.vercel.app/solicitud?deal_uuid=0d9baf2c-547d-46e1-b3f4-40e316f64e0e',
  },
  '2ab73286-81c2-41d4-aa79-0fc8b4134540': {
    fullName: 'Melissa Paola Navarro Robles',
    document: '1002031309',
    phone: '3007091113',
    group: 'AH',
    product: 'libre_inversion',
    rate: 20,
    termMonths: 84,
    originalTimestamp: '2026-04-22T18:06:33.975Z',
    originalUrl:
      'https://habicapitalliquidez.vercel.app/solicitud?deal_uuid=2ab73286-81c2-41d4-aa79-0fc8b4134540',
  },
  '8337cf64-7351-4e77-a359-aad430ca18b8': {
    fullName: 'Yeferson Velásquez',
    document: '1003837581',
    phone: '573247504493',
    group: 'BH',
    product: 'libre_inversion',
    rate: 20,
    termMonths: 120,
    originalTimestamp: '2026-04-22T21:36:07.062Z',
    originalUrl:
      'https://habicapitalliquidez.vercel.app/solicitud?deal_uuid=8337cf64-7351-4e77-a359-aad430ca18b8',
  },
  '2e871489-3ec3-4db8-98b8-8b065a71bea6': {
    fullName: 'Alain García Roldán',
    document: '2709095002',
    phone: '525529184153',
    group: 'AH',
    product: 'libre_inversion',
    rate: 20,
    termMonths: 84,
    originalTimestamp: '2026-04-22T23:42:50.757Z',
    originalUrl:
      'https://habicapitalliquidez.vercel.app/solicitud?deal_uuid=2e871489-3ec3-4db8-98b8-8b065a71bea6',
  },
};

export function isPendingConsent(uuid: string | null | undefined): uuid is string {
  return !!uuid && uuid in PENDING_CONSENT;
}

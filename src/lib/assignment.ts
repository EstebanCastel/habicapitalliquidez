export type TestGroup = 'AH' | 'BH' | 'CH' | 'DH';

export interface Assignment {
  group: TestGroup;
  product: 'libre_inversion' | 'garantia_hipotecaria';
  rate: number;
  rateLabel: string;
  termMonths: number;
  termLabel: string;
  productLabel: string;
  tagline: string;
  dealUuid: string | null;
}

const GROUPS: TestGroup[] = ['AH', 'BH', 'CH', 'DH'];

export function randomGroup(): TestGroup {
  return GROUPS[Math.floor(Math.random() * GROUPS.length)];
}

export function buildAssignment(group: TestGroup, dealUuid: string | null): Assignment {
  if (group === 'AH') {
    return {
      group,
      product: 'libre_inversion',
      rate: 24,
      rateLabel: '24%',
      termMonths: 60,
      termLabel: 'hasta 60 meses',
      productLabel: 'Crédito de Libre Inversión',
      tagline: 'Usa el dinero como quieras, con cuotas cómodas hasta 5 años.',
      dealUuid,
    };
  }

  const rates: Record<'BH' | 'CH' | 'DH', number> = { BH: 18, CH: 20, DH: 22 };
  const rate = rates[group as 'BH' | 'CH' | 'DH'];

  return {
    group,
    product: 'garantia_hipotecaria',
    rate,
    rateLabel: `${rate}%`,
    termMonths: 120,
    termLabel: 'hasta 120 meses',
    productLabel: 'Crédito con Garantía Hipotecaria',
    tagline: 'Respaldado por tu inmueble. Mayor monto, menor cuota mensual y hasta 10 años de plazo.',
    dealUuid,
  };
}

export function parseHubSpotGroup(value: string | null | undefined): TestGroup | null {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  if (v === 'AH' || v === 'BH' || v === 'CH' || v === 'DH') return v as TestGroup;
  return null;
}

export type TestGroup = 'A' | 'AH' | 'BH' | 'CH';

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

const GROUPS: TestGroup[] = ['A', 'AH', 'BH', 'CH'];

export function randomGroup(): TestGroup {
  return GROUPS[Math.floor(Math.random() * GROUPS.length)];
}

export function buildAssignment(group: TestGroup, dealUuid: string | null): Assignment {
  if (group === 'A') {
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

  const rates: Record<'AH' | 'BH' | 'CH', number> = { AH: 18, BH: 20, CH: 22 };
  const rate = rates[group as 'AH' | 'BH' | 'CH'];

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
  if (v === 'A' || v === 'AH' || v === 'BH' || v === 'CH') return v as TestGroup;
  return null;
}

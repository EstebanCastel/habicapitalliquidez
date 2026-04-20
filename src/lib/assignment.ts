export type TestGroup = 'AH' | 'BH';

export interface Assignment {
  group: TestGroup;
  product: 'libre_inversion';
  rate: number;
  rateLabel: string;
  termMonths: number;
  termLabel: string;
  productLabel: string;
  tagline: string;
  dealUuid: string | null;
}

const GROUPS: TestGroup[] = ['AH', 'BH'];

export function randomGroup(): TestGroup {
  return GROUPS[Math.floor(Math.random() * GROUPS.length)];
}

export function buildAssignment(group: TestGroup, dealUuid: string | null): Assignment {
  const termMonths = group === 'AH' ? 84 : 120;
  const termYears = termMonths / 12;

  return {
    group,
    product: 'libre_inversion',
    rate: 20,
    rateLabel: '20%',
    termMonths,
    termLabel: `hasta ${termMonths} meses`,
    productLabel: 'Crédito de Libre Inversión',
    tagline: `Usa el dinero como quieras, con cuotas cómodas hasta ${termYears} años.`,
    dealUuid,
  };
}

export function parseHubSpotGroup(value: string | null | undefined): TestGroup | null {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  if (v === 'AH' || v === 'BH') return v as TestGroup;
  return null;
}

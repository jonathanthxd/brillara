export type Metal = "gold" | "silver";

export interface PublicSettings {
  commissionRate: number;
  goldPriceOverride: number | null;
  silverPriceOverride: number | null;
  businessHours: string;
  coverageArea: string;
  phoneContact: string;
}

export const DEFAULT_SETTINGS: PublicSettings = {
  commissionRate: 0.85,
  goldPriceOverride: null,
  silverPriceOverride: null,
  businessHours: "Lunes a Sábado: 9:00 AM - 6:00 PM",
  coverageArea: "Los Ángeles, Hollywood, Beverly Hills, Santa Monica, Pasadena, Glendale, Burbank",
  phoneContact: "(323) 555-0199",
};

const REFERENCE_PRICES: Record<Metal, number> = {
  gold: 78.5,
  silver: 0.95,
};

export const KARATS = [
  { value: 24, purity: 0.999, label: "24K" },
  { value: 22, purity: 0.916, label: "22K" },
  { value: 18, purity: 0.75, label: "18K" },
  { value: 14, purity: 0.585, label: "14K" },
  { value: 10, purity: 0.417, label: "10K" },
] as const;

export const UNITS = [
  { value: "g", label: "Gramos (g)", factor: 1 },
  { value: "oz", label: "Onzas (oz)", factor: 31.1035 },
  { value: "dwt", label: "Pennyweight (dwt)", factor: 1.5552 },
] as const;

export function pricePerGram(metal: Metal, settings: PublicSettings): number {
  const override = metal === "gold" ? settings.goldPriceOverride : settings.silverPriceOverride;
  return (override ?? REFERENCE_PRICES[metal]) * settings.commissionRate;
}

export function calculateEstimate(
  metal: Metal,
  weight: number,
  unit: string,
  karat: number,
  settings: PublicSettings,
): number {
  const unitFactor = UNITS.find((item) => item.value === unit)?.factor ?? 1;
  const purity = KARATS.find((item) => item.value === karat)?.purity ?? 0.999;
  return weight * unitFactor * purity * pricePerGram(metal, settings);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

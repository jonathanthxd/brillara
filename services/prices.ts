import { getConfig } from "./config";

export type Metal = "gold" | "silver";

export interface MetalPrice {
  metal: Metal;
  pricePerGramUSD: number;
  updatedAt: string;
}

// Precios base de mercado (simulados)
const BASE_PRICES: Record<Metal, number> = {
  gold: 78.5,
  silver: 0.95,
};

export function getMetalPrice(metal: Metal): MetalPrice {
  const config = getConfig();
  const override = metal === "gold" ? config.goldPriceOverride : config.silverPriceOverride;
  const base = override ?? BASE_PRICES[metal];
  
  return {
    metal,
    pricePerGramUSD: base * config.commissionRate,
    updatedAt: new Date().toISOString(),
  };
}

export function getAllPrices(): MetalPrice[] {
  return (["gold", "silver"] as Metal[]).map(getMetalPrice);
}

export const KARATS = [
  { value: 24, purity: 0.999, label: "24K" },
  { value: 22, purity: 0.916, label: "22K" },
  { value: 18, purity: 0.750, label: "18K" },
  { value: 14, purity: 0.585, label: "14K" },
  { value: 10, purity: 0.417, label: "10K" },
] as const;

export const UNITS = [
  { value: "g", label: "Gramos (g)", factor: 1 },
  { value: "oz", label: "Onzas (oz)", factor: 31.1035 },
  { value: "dwt", label: "Pennyweight (dwt)", factor: 1.5552 },
] as const;

export function calculateEstimate(
  metal: Metal,
  weight: number,
  unit: string,
  karat: number
): number {
  const unitFactor = UNITS.find((u) => u.value === unit)?.factor ?? 1;
  const purity = KARATS.find((k) => k.value === karat)?.purity ?? 0.999;
  const price = getMetalPrice(metal).pricePerGramUSD;
  
  const weightInGrams = weight * unitFactor;
  const pureGrams = weightInGrams * purity;
  
  return pureGrams * price;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

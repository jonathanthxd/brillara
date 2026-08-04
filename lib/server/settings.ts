import "server-only";

import { DEFAULT_SETTINGS, PublicSettings } from "@/lib/pricing";

export function parseSettings(value: unknown): PublicSettings {
  if (!value || typeof value !== "object") return DEFAULT_SETTINGS;

  const input = value as Record<string, unknown>;
  const commissionRate = typeof input.commissionRate === "number" && input.commissionRate >= 0 && input.commissionRate <= 1
    ? input.commissionRate
    : DEFAULT_SETTINGS.commissionRate;

  const price = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  const text = (value: unknown, fallback: string, max: number) =>
    typeof value === "string" && value.trim() && value.trim().length <= max ? value.trim() : fallback;

  return {
    commissionRate,
    goldPriceOverride: price(input.goldPriceOverride),
    silverPriceOverride: price(input.silverPriceOverride),
    businessHours: text(input.businessHours, DEFAULT_SETTINGS.businessHours, 200),
    coverageArea: text(input.coverageArea, DEFAULT_SETTINGS.coverageArea, 500),
    phoneContact: text(input.phoneContact, DEFAULT_SETTINGS.phoneContact, 100),
  };
}

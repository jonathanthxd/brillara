export interface BrillaraConfig {
  commissionRate: number; // 0.85 = 85%
  goldPriceOverride: number | null; // null = usar API/simulado
  silverPriceOverride: number | null;
  businessHours: string;
  coverageArea: string;
  phoneContact: string;
}

const KEY = "brillara_config";

const DEFAULTS: BrillaraConfig = {
  commissionRate: 0.85,
  goldPriceOverride: null,
  silverPriceOverride: null,
  businessHours: "Lunes a Sábado: 9:00 AM - 6:00 PM",
  coverageArea: "Los Ángeles, Hollywood, Beverly Hills, Santa Monica, Pasadena, Glendale, Burbank",
  phoneContact: "(323) 555-0199",
};

export function getConfig(): BrillaraConfig {
  if (typeof window === "undefined") return DEFAULTS;
  const raw = localStorage.getItem(KEY);
  return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
}

export function saveConfig(config: Partial<BrillaraConfig>): BrillaraConfig {
  const current = getConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

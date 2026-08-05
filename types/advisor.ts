export interface Advisor {
  id: string;
  code: string;
  referralCode: string;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DatabaseAdvisor {
  id: string | number;
  code: string;
  referral_code?: string | null;
  name: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export function toAdvisor(record: DatabaseAdvisor): Advisor {
  return {
    id: String(record.id),
    code: record.code,
    referralCode: record.referral_code ?? record.code,
    name: record.name,
    createdAt: record.created_at ?? null,
    updatedAt: record.updated_at ?? null,
  };
}

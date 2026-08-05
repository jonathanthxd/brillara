import "server-only";

import { getSupabaseAdmin } from "./supabase";
import {
  getReferralSession,
  ReferralSession,
} from "./session";

export type ReferralSource = "path" | "query" | "hash";

interface ReferralAdvisorRecord {
  id: string | number;
  code: string;
  name: string;
  referral_code: string;
}

interface ReferralAttributionRecord {
  id: string;
  advisor_id: string;
  advisor_code: string;
  advisor_name: string;
}

export interface ReferralCaptureResult {
  referral: ReferralSession | null;
  captured: boolean;
  retainedExisting: boolean;
}

/** The public code accepts the same safe characters as an advisor login code. */
export function normalizeReferralCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim();
  return /^[A-Za-z0-9_-]{3,32}$/.test(code) ? code : null;
}

function safeLandingPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  return value.slice(0, 500);
}

function toReferralSession(record: ReferralAttributionRecord): ReferralSession {
  return {
    attributionId: String(record.id),
    advisorId: String(record.advisor_id),
    advisorCode: record.advisor_code,
    advisorName: record.advisor_name,
  };
}

/**
 * First verified referral wins for the duration of the signed cookie. This
 * prevents a later link from taking credit from the person who generated the
 * original lead.
 */
export async function captureReferral(
  codeValue: unknown,
  landingPath: unknown,
  source: ReferralSource,
): Promise<ReferralCaptureResult> {
  const code = normalizeReferralCode(codeValue);
  if (!code) return { referral: null, captured: false, retainedExisting: false };

  const existing = await getReferralSession();
  if (existing) {
    if (existing.advisorCode === code) {
      const { error } = await getSupabaseAdmin()
        .from("referral_attributions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", existing.attributionId);

      if (error) console.error("Unable to refresh referral attribution", error);
    }

    return { referral: existing, captured: false, retainedExisting: true };
  }

  const supabase = getSupabaseAdmin();
  const { data: advisor, error: advisorError } = await supabase
    .from("advisors")
    .select("id, code, name, referral_code")
    .eq("referral_code", code)
    .maybeSingle();

  if (advisorError) throw advisorError;
  if (!advisor) return { referral: null, captured: false, retainedExisting: false };

  const record = advisor as ReferralAdvisorRecord;
  const { data: attribution, error: attributionError } = await supabase
    .from("referral_attributions")
    .insert({
      advisor_id: String(record.id),
      advisor_code: record.referral_code,
      advisor_name: record.name,
      landing_path: safeLandingPath(landingPath),
      source,
    })
    .select("id, advisor_id, advisor_code, advisor_name")
    .single();

  if (attributionError || !attribution) throw attributionError ?? new Error("Referral attribution was not created.");

  return {
    referral: toReferralSession(attribution as ReferralAttributionRecord),
    captured: true,
    retainedExisting: false,
  };
}

/** Referral tracking must never prevent a real client from registering. */
export async function markReferralRegistration(referral: ReferralSession, name: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("referral_attributions")
    .update({ registered_name: name, registered_at: new Date().toISOString() })
    .eq("id", referral.attributionId);

  if (error) console.error("Unable to record referral registration", error);
}

export interface TicketReferral extends ReferralSession {
  activeAdvisorId: string | null;
}

/**
 * Keep historical referral data even if an advisor was removed. We only assign
 * the operational ticket to an advisor account that still exists.
 */
export async function getReferralForTicket(): Promise<TicketReferral | null> {
  const referral = await getReferralSession();
  if (!referral) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("advisors")
    .select("id")
    .eq("id", referral.advisorId)
    .maybeSingle();

  if (error) {
    console.error("Unable to verify referred advisor", error);
    return { ...referral, activeAdvisorId: null };
  }

  return { ...referral, activeAdvisorId: data ? String((data as { id: string | number }).id) : null };
}

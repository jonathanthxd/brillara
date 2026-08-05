import "server-only";

import { ApiError } from "./api";
import { getAdvisorSession, AdvisorSession } from "./session";
import { getSupabaseAdmin } from "./supabase";

interface AdvisorRecord {
  id: string | number;
  code: string;
  name: string;
  session_version: number;
}

/**
 * Advisor cookies are signed, but an admin can delete an advisor at any time.
 * Confirming the account still exists on every protected request closes that
 * session immediately instead of allowing a stale cookie to keep claiming work.
 */
export async function getActiveAdvisorSession(): Promise<AdvisorSession | null> {
  const session = await getAdvisorSession();
  if (!session) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("advisors")
    .select("id, code, name, session_version")
    .eq("id", session.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const advisor = data as AdvisorRecord;
  if (!Number.isInteger(advisor.session_version) || advisor.session_version !== session.sessionVersion) {
    return null;
  }

  return { id: String(advisor.id), code: advisor.code, name: advisor.name, sessionVersion: advisor.session_version };
}

export async function requireActiveAdvisorSession(): Promise<AdvisorSession> {
  const advisor = await getActiveAdvisorSession();
  if (!advisor) throw new ApiError("Tu cuenta de asesor ya no está activa. Inicia sesión de nuevo.", 401);
  return advisor;
}

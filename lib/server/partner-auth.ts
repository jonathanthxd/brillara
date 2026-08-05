import "server-only";

import { ApiError } from "./api";
import { PartnerSession, getPartnerSession } from "./session";
import { getSupabaseAdmin } from "./supabase";

interface PartnerUserRecord {
  id: string;
  partner_id: string;
  location_id: string | null;
  name: string;
  role: "owner" | "manager" | "buyer";
  active: boolean;
  session_version: number;
  partners: { active: boolean } | { active: boolean }[] | null;
  partner_locations: { active: boolean } | { active: boolean }[] | null;
}

function relationIsActive(value: { active: boolean } | { active: boolean }[] | null): boolean {
  const relation = Array.isArray(value) ? value[0] : value;
  return relation?.active === true;
}

/**
 * A signed cookie alone is intentionally not enough: every protected partner
 * request checks the current user, partner and assigned branch. Suspending an
 * account therefore takes effect immediately instead of waiting for expiry.
 */
export async function getActivePartnerSession(): Promise<PartnerSession | null> {
  const session = await getPartnerSession();
  if (!session) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("partner_users")
    .select("id, partner_id, location_id, name, role, active, session_version, partners(active), partner_locations(active)")
    .eq("id", session.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const user = data as unknown as PartnerUserRecord;
  if (
    !user.active ||
    !relationIsActive(user.partners) ||
    (user.location_id !== null && !relationIsActive(user.partner_locations)) ||
    !Number.isInteger(user.session_version) ||
    user.session_version !== session.sessionVersion ||
    user.partner_id !== session.partnerId ||
    user.location_id !== session.locationId
  ) {
    return null;
  }

  return {
    id: user.id,
    partnerId: user.partner_id,
    locationId: user.location_id,
    name: user.name,
    role: user.role,
    sessionVersion: user.session_version,
  };
}

export async function requireActivePartnerSession(): Promise<PartnerSession> {
  const partnerUser = await getActivePartnerSession();
  if (!partnerUser) {
    throw new ApiError("Tu acceso de partner ya no está activo. Inicia sesión de nuevo.", 401);
  }
  return partnerUser;
}

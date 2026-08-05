import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { toPartnerUser } from "@/lib/partners";
import { validatePartnerId, validatePartnerUserInput } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
interface RouteContext { params: Promise<{ id: string; userId: string }> }

async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, userId } = await context.params;
    const partnerId = validatePartnerId(id);
    const validUserId = validatePartnerId(userId, "El usuario partner");
    const user = validatePartnerUserInput(await request.json(), false);
    const { data: owner, error: ownerError } = await getSupabaseAdmin()
      .from("partner_users")
      .select("partner_id")
      .eq("id", validUserId)
      .maybeSingle();
    if (ownerError) throw ownerError;
    if (!owner || String((owner as { partner_id: string }).partner_id) !== partnerId) throw new ApiError("El usuario partner no existe.", 404);
    const { data, error } = await getSupabaseAdmin().rpc("admin_update_partner_user", {
      p_id: validUserId,
      p_location_id: user.locationId,
      p_name: user.name,
      p_code: user.code,
      p_password: user.password,
      p_role: user.role,
      p_active: user.active,
    });
    if (error) throw error;
    const record = (data as Record<string, unknown>[] | null)?.[0];
    if (!record) throw new ApiError("El usuario partner no existe.", 404);
    return NextResponse.json({ user: toPartnerUser(record) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

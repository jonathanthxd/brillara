import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { toPartnerUser } from "@/lib/partners";
import { validatePartnerId, validatePartnerUserInput } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
interface RouteContext { params: Promise<{ id: string }> }

async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const partnerId = validatePartnerId(id);
    const user = validatePartnerUserInput(await request.json());
    const { data, error } = await getSupabaseAdmin().rpc("admin_create_partner_user", {
      p_partner_id: partnerId,
      p_location_id: user.locationId,
      p_name: user.name,
      p_code: user.code,
      p_password: user.password,
      p_role: user.role,
      p_active: user.active,
    });
    if (error) throw error;
    const record = (data as Record<string, unknown>[] | null)?.[0];
    if (!record) throw new ApiError("No fue posible crear el usuario partner.", 500);
    return NextResponse.json({ user: toPartnerUser(record) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

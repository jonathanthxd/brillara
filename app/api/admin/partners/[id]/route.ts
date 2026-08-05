import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { toPartner } from "@/lib/partners";
import { validatePartnerId, validatePartnerInput } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
interface RouteContext { params: Promise<{ id: string }> }

async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const partnerId = validatePartnerId(id);
    const partner = validatePartnerInput(await request.json());
    const { data, error } = await getSupabaseAdmin()
      .from("partners")
      .update({ name: partner.name, type: partner.type, phone: partner.phone, email: partner.email, active: partner.active })
      .eq("id", partnerId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError("El partner no existe.", 404);
    return NextResponse.json({ partner: toPartner(data as Record<string, unknown>) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

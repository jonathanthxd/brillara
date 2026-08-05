import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { toPartnerLocation } from "@/lib/partners";
import { validatePartnerId, validatePartnerLocationInput } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
interface RouteContext { params: Promise<{ id: string; locationId: string }> }

async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, locationId } = await context.params;
    const partnerId = validatePartnerId(id);
    const validLocationId = validatePartnerId(locationId, "La sucursal");
    const location = validatePartnerLocationInput(await request.json());
    const { data, error } = await getSupabaseAdmin()
      .from("partner_locations")
      .update(location)
      .eq("id", validLocationId)
      .eq("partner_id", partnerId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError("La sucursal no existe.", 404);
    return NextResponse.json({ location: toPartnerLocation(data as Record<string, unknown>) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

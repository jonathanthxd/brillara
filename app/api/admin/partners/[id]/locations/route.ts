import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { toPartnerLocation } from "@/lib/partners";
import { validatePartnerId, validatePartnerLocationInput } from "@/lib/validation";
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
    const location = validatePartnerLocationInput(await request.json());
    const { data, error } = await getSupabaseAdmin()
      .from("partner_locations")
      .insert({ partner_id: partnerId, ...location })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ location: toPartnerLocation(data as Record<string, unknown>) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

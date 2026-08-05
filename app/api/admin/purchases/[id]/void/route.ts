import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { validatePartnerId, validateOptionalText } from "@/lib/validation";
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
    const purchaseId = validatePartnerId(id, "La compra");
    const body = await request.json();
    const reason = validateOptionalText(body.reason, "El motivo de anulación", 1_000);
    if (!reason || reason.length < 5) throw new ApiError("Indica un motivo de anulación de al menos 5 caracteres.");
    const { error } = await getSupabaseAdmin().rpc("admin_void_purchase", {
      p_purchase_id: purchaseId,
      p_reason: reason,
      p_actor_name: "Administrador",
    });
    if (error) throw error;
    return NextResponse.json({ voided: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

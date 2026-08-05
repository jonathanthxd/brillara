import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { toPartnerPurchase } from "@/lib/partners";
import { validatePartnerId, validateOptionalText } from "@/lib/validation";
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
    const purchaseId = validatePartnerId(id, "La compra");
    const body = await request.json() as Record<string, unknown>;
    const totalPaid = typeof body.totalPaid === "number" ? body.totalPaid : Number(body.totalPaid);
    if (!Number.isFinite(totalPaid) || totalPaid < 0) throw new ApiError("El total pagado no es válido.");
    const notes = validateOptionalText(body.notes, "Las observaciones", 2_000);
    const reason = validateOptionalText(body.reason, "El motivo de la corrección", 1_000);
    if (!reason || reason.length < 5) throw new ApiError("Indica un motivo de corrección de al menos 5 caracteres.");
    const { data, error } = await getSupabaseAdmin().rpc("admin_correct_purchase", {
      p_purchase_id: purchaseId,
      p_total_paid: totalPaid,
      p_notes: notes,
      p_reason: reason,
      p_actor_name: "Administrador",
    });
    if (error) throw error;
    const record = (data as Record<string, unknown>[] | null)?.[0];
    if (!record) throw new ApiError("La compra no existe.", 404);
    const { data: purchaseData, error: purchaseError } = await getSupabaseAdmin().from("purchases").select("*").eq("id", purchaseId).single();
    if (purchaseError) throw purchaseError;
    return NextResponse.json({ purchase: toPartnerPurchase(purchaseData as Record<string, unknown>) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

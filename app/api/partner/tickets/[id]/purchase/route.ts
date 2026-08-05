import { ApiError, jsonError } from "@/lib/server/api";
import { getPartnerTicketDetail } from "@/lib/server/partner-data";
import { requireActivePartnerSession } from "@/lib/server/partner-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { validatePartnerId, validatePurchaseInput } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const partnerUser = await requireActivePartnerSession();
    const { id } = await context.params;
    const body = await request.json();
    const appointmentId = validatePartnerId(body.appointmentId, "La cita");
    const purchase = validatePurchaseInput(body);
    const { error } = await getSupabaseAdmin().rpc("partner_confirm_purchase", {
      p_ticket_id: id,
      p_appointment_id: appointmentId,
      p_partner_user_id: partnerUser.id,
      p_metal: purchase.metal,
      p_purity: purchase.purity,
      p_gross_weight_grams: purchase.grossWeightGrams,
      p_net_weight_grams: purchase.netWeightGrams,
      p_price_per_gram: purchase.pricePerGram,
      p_total_paid: purchase.totalPaid,
      p_total_explanation: purchase.totalExplanation,
      p_payment_method: purchase.paymentMethod,
      p_payment_reference: purchase.paymentReference,
      p_employee_name: purchase.employeeName,
      p_notes: purchase.notes,
      p_receipt_url: purchase.receiptUrl,
      p_confirmed_at: purchase.confirmedAt,
    });
    if (error) throw error;
    const detail = await getPartnerTicketDetail(id, partnerUser);
    if (!detail) throw new ApiError("No fue posible recuperar la compra confirmada.", 500);
    return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

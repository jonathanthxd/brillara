import { ApiError, jsonError } from "@/lib/server/api";
import { getPartnerTicketDetail } from "@/lib/server/partner-data";
import { requireActivePartnerSession } from "@/lib/server/partner-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { validateOutcomeInput, validatePartnerId } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const partnerUser = await requireActivePartnerSession();
    const { id } = await context.params;
    const body = await request.json();
    const appointmentId = validatePartnerId(body.appointmentId, "La cita");
    const outcome = validateOutcomeInput(body);
    const { error } = await getSupabaseAdmin().rpc("partner_record_outcome", {
      p_ticket_id: id,
      p_appointment_id: appointmentId,
      p_partner_user_id: partnerUser.id,
      p_outcome: outcome.outcome,
      p_notes: outcome.notes,
      p_rescheduled_at: outcome.rescheduledAt,
    });
    if (error) throw error;
    const detail = await getPartnerTicketDetail(id, partnerUser);
    if (!detail) throw new ApiError("No fue posible recuperar el ticket actualizado.", 500);
    return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

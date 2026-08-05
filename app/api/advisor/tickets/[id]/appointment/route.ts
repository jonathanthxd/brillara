import { ApiError, jsonError } from "@/lib/server/api";
import { requireActiveAdvisorSession } from "@/lib/server/advisor-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { toPartnerAppointment, toPartnerPurchase } from "@/lib/partners";
import { validateAppointmentInput } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext { params: Promise<{ id: string }> }

async function getAppointmentForAdvisor(ticketId: string, advisorId: string) {
  const supabase = getSupabaseAdmin();
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id, advisor_id, partner_id, partner_location_id, status, closed_at")
    .eq("id", ticketId)
    .eq("advisor_id", advisorId)
    .maybeSingle();
  if (ticketError) throw ticketError;
  if (!ticket) return null;
  const [appointmentResult, purchaseResult] = await Promise.all([
    supabase.from("partner_appointments").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("purchases").select("*").eq("ticket_id", ticketId).maybeSingle(),
  ]);
  if (appointmentResult.error) throw appointmentResult.error;
  if (purchaseResult.error) throw purchaseResult.error;
  return {
    appointment: appointmentResult.data ? toPartnerAppointment(appointmentResult.data as Record<string, unknown>) : null,
    purchase: purchaseResult.data ? toPartnerPurchase(purchaseResult.data as Record<string, unknown>) : null,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const advisor = await requireActiveAdvisorSession();
    const { id } = await context.params;
    const operation = await getAppointmentForAdvisor(id, advisor.id);
    if (!operation) throw new ApiError("Ticket no encontrado.", 404);
    return NextResponse.json(operation, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const advisor = await requireActiveAdvisorSession();
    const { id } = await context.params;
    const appointment = validateAppointmentInput(await request.json());
    const { error } = await getSupabaseAdmin().rpc("schedule_partner_appointment", {
      p_ticket_id: id,
      p_advisor_id: advisor.id,
      p_partner_id: appointment.partnerId,
      p_location_id: appointment.locationId,
      p_scheduled_at: appointment.scheduledAt,
      p_notes: appointment.notes,
    });
    if (error) throw error;
    const operation = await getAppointmentForAdvisor(id, advisor.id);
    if (!operation) throw new ApiError("No fue posible recuperar la cita programada.", 500);
    return NextResponse.json(operation, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

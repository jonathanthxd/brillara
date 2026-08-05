import { jsonError } from "@/lib/server/api";
import { TICKET_SELECT } from "@/lib/server/partner-data";
import { requireActivePartnerSession } from "@/lib/server/partner-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { toPartnerAppointment } from "@/lib/partners";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function safeSearch(value: string | null): string | null {
  if (!value) return null;
  const sanitized = value.trim().replace(/[,%()]/g, "").slice(0, 80);
  return sanitized || null;
}

export async function GET(request: NextRequest) {
  try {
    const partnerUser = await requireActivePartnerSession();
    const search = safeSearch(request.nextUrl.searchParams.get("q"));
    const view = request.nextUrl.searchParams.get("view") ?? "active";
    let query = getSupabaseAdmin()
      .from("tickets")
      .select(TICKET_SELECT)
      .eq("partner_id", partnerUser.partnerId);
    if (partnerUser.locationId) query = query.eq("partner_location_id", partnerUser.locationId);
    if (search) {
      const pattern = `%${search}%`;
      query = query.or(`ticket_number.ilike.${pattern},client_name.ilike.${pattern},phone.ilike.${pattern}`);
    }
    const { data, error } = await query.order("updated_at", { ascending: false }).limit(80);
    if (error) throw error;

    const allTickets = (data as DatabaseTicket[]).map(toTicket);
    const ticketIds = allTickets.map((ticket) => ticket.id);
    let appointments: Record<string, ReturnType<typeof toPartnerAppointment>> = {};
    let appointmentStatuses: Record<string, string[]> = {};
    if (ticketIds.length > 0) {
      let appointmentQuery = getSupabaseAdmin()
        .from("partner_appointments")
        .select("*")
        .eq("partner_id", partnerUser.partnerId)
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: false });
      if (partnerUser.locationId) appointmentQuery = appointmentQuery.eq("location_id", partnerUser.locationId);
      const { data: appointmentData, error: appointmentError } = await appointmentQuery;
      if (appointmentError) throw appointmentError;
      appointments = (appointmentData ?? []).reduce<Record<string, ReturnType<typeof toPartnerAppointment>>>((result, appointment) => {
        const mapped = toPartnerAppointment(appointment as Record<string, unknown>);
        if (!result[mapped.ticketId]) result[mapped.ticketId] = mapped;
        return result;
      }, {});
      appointmentStatuses = (appointmentData ?? []).reduce<Record<string, string[]>>((result, appointment) => {
        const mapped = toPartnerAppointment(appointment as Record<string, unknown>);
        result[mapped.ticketId] = [...(result[mapped.ticketId] ?? []), mapped.status];
        return result;
      }, {});
    }

    const tickets = allTickets.filter((ticket) => {
      const closed = ["compra-realizada", "no-concretado", "cancelado", "archivado"].includes(ticket.status);
      const historicalAppointment = (appointmentStatuses[ticket.id] ?? []).some((status) => ["completada", "no-asistio", "no-concretada", "reprogramada", "en-revision"].includes(status));
      return view === "history" ? closed || historicalAppointment : view === "all" ? true : !closed;
    });

    return NextResponse.json(
      { tickets: tickets.map((ticket) => ({ ticket, appointment: appointments[ticket.id] ?? null })) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

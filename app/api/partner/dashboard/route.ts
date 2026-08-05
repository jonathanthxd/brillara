import { jsonError } from "@/lib/server/api";
import { requireActivePartnerSession } from "@/lib/server/partner-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { toPartnerAppointment } from "@/lib/partners";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET() {
  try {
    const partnerUser = await requireActivePartnerSession();
    const supabase = getSupabaseAdmin();
    let ticketsQuery = supabase
      .from("tickets")
      .select("*, advisors(code, name), partners(name), partner_locations(name, city)")
      .eq("partner_id", partnerUser.partnerId);
    let appointmentsQuery = supabase
      .from("partner_appointments")
      .select("*")
      .eq("partner_id", partnerUser.partnerId);
    let purchasesQuery = supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("partner_id", partnerUser.partnerId)
      .is("voided_at", null)
      .gte("confirmed_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString());
    if (partnerUser.locationId) {
      ticketsQuery = ticketsQuery.eq("partner_location_id", partnerUser.locationId);
      appointmentsQuery = appointmentsQuery.eq("location_id", partnerUser.locationId);
      purchasesQuery = purchasesQuery.eq("location_id", partnerUser.locationId);
    }

    const [ticketsResult, appointmentsResult, purchasesResult] = await Promise.all([
      ticketsQuery.order("updated_at", { ascending: false }).limit(80),
      appointmentsQuery.order("scheduled_at", { ascending: true }).limit(120),
      purchasesQuery,
    ]);
    if (ticketsResult.error) throw ticketsResult.error;
    if (appointmentsResult.error) throw appointmentsResult.error;
    if (purchasesResult.error) throw purchasesResult.error;

    const tickets = (ticketsResult.data as DatabaseTicket[]).map(toTicket);
    const appointments = (appointmentsResult.data ?? []).map((record) => toPartnerAppointment(record as Record<string, unknown>));
    const now = new Date();
    const today = startOfToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const pending = tickets.filter((ticket) => ticket.status === "cita-programada" || ticket.status === "pendiente-confirmacion");
    const todayAppointments = appointments.filter((appointment) => {
      const date = new Date(appointment.scheduledAt);
      return date >= today && date < tomorrow && ["programada", "pendiente-confirmacion"].includes(appointment.status);
    });
    const noShows = appointments.filter((appointment) => {
      const date = new Date(appointment.updatedAt);
      return appointment.status === "no-asistio" && date >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    });
    const currentAppointments = appointments.filter((appointment) => appointment.status === "programada" || appointment.status === "pendiente-confirmacion");
    const appointmentByTicket = new Map(currentAppointments.map((appointment) => [appointment.ticketId, appointment]));

    return NextResponse.json(
      {
        stats: {
          todayAppointments: todayAppointments.length,
          pendingConfirmation: pending.length,
          purchasesLast30Days: purchasesResult.count ?? 0,
          problemsInReview: tickets.filter((ticket) => ticket.status === "en-revision").length,
          noShowsLast30Days: noShows.length,
        },
        today: todayAppointments.map((appointment) => ({
          appointment,
          ticket: tickets.find((ticket) => ticket.id === appointment.ticketId) ?? null,
        })).filter((item) => item.ticket),
        pending: pending.map((ticket) => ({ ticket, appointment: appointmentByTicket.get(ticket.id) ?? null })),
        recent: tickets.slice(0, 12).map((ticket) => ({ ticket, appointment: appointmentByTicket.get(ticket.id) ?? null })),
        generatedAt: now.toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

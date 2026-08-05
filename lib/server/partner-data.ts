import "server-only";

import { toPartnerAppointment, toPartnerPurchase, toTicketEvent } from "@/lib/partners";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { PartnerTicketDetail } from "@/types/partner";
import { PartnerSession } from "./session";
import { getSupabaseAdmin } from "./supabase";

const TICKET_SELECT = "*, advisors(code, name), partners(name), partner_locations(name, city)";

function scopePartnerTickets<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  partner: PartnerSession,
): T {
  let scoped = query.eq("partner_id", partner.partnerId);
  if (partner.locationId) scoped = scoped.eq("partner_location_id", partner.locationId);
  return scoped;
}

export async function getPartnerTicketDetail(
  ticketId: string,
  partner: PartnerSession,
): Promise<PartnerTicketDetail | null> {
  const supabase = getSupabaseAdmin();
  const ticketQuery = scopePartnerTickets(
    supabase.from("tickets").select(TICKET_SELECT).eq("id", ticketId),
    partner,
  );
  const { data: ticketData, error: ticketError } = await ticketQuery.maybeSingle();
  if (ticketError) throw ticketError;
  if (!ticketData) return null;

  let appointmentQuery = supabase
    .from("partner_appointments")
    .select("*")
    .eq("ticket_id", ticketId)
    .eq("partner_id", partner.partnerId);
  if (partner.locationId) appointmentQuery = appointmentQuery.eq("location_id", partner.locationId);

  const [appointmentResult, purchaseResult, eventsResult] = await Promise.all([
    appointmentQuery.order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("purchases").select("*").eq("ticket_id", ticketId).maybeSingle(),
    supabase.from("partner_ticket_events").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: false }).limit(100),
  ]);
  if (appointmentResult.error) throw appointmentResult.error;
  if (purchaseResult.error) throw purchaseResult.error;
  if (eventsResult.error) throw eventsResult.error;

  return {
    ticket: toTicket(ticketData as DatabaseTicket),
    appointment: appointmentResult.data ? toPartnerAppointment(appointmentResult.data as Record<string, unknown>) : null,
    purchase: purchaseResult.data ? toPartnerPurchase(purchaseResult.data as Record<string, unknown>) : null,
    events: (eventsResult.data ?? []).map((event) => toTicketEvent(event as Record<string, unknown>)),
  };
}

export { TICKET_SELECT, scopePartnerTickets };

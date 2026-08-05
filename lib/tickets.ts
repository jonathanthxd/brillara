import { Ticket, TicketMessage, TicketStatus } from "@/types/ticket";

export interface DatabaseTicket {
  id: string | number;
  ticket_number: string;
  client_name: string;
  phone: string;
  city: string;
  location: string;
  description: string;
  photos: string[] | null;
  status: string | null;
  advisor_id: string | null;
  referral_attribution_id?: string | null;
  referrer_advisor_id?: string | null;
  referrer_code?: string | null;
  referrer_name?: string | null;
  partner_id?: string | null;
  partner_location_id?: string | null;
  closed_at?: string | null;
  messages: TicketMessage[] | null;
  created_at: string;
  updated_at: string;
  advisors?: { code: string; name: string } | { code: string; name: string }[] | null;
  partners?: { name: string } | { name: string }[] | null;
  partner_locations?: { name: string; city?: string | null } | { name: string; city?: string | null }[] | null;
}

export function toTicket(record: DatabaseTicket): Ticket {
  const advisor = Array.isArray(record.advisors) ? record.advisors[0] ?? null : record.advisors ?? null;
  const partner = Array.isArray(record.partners) ? record.partners[0] ?? null : record.partners ?? null;
  const partnerLocation = Array.isArray(record.partner_locations)
    ? record.partner_locations[0] ?? null
    : record.partner_locations ?? null;
  return {
    id: String(record.id),
    ticketNumber: record.ticket_number,
    clientName: record.client_name,
    phone: record.phone,
    city: record.city,
    location: record.location,
    description: record.description,
    photos: record.photos ?? [],
    status: (record.status ?? "nuevo") as TicketStatus,
    advisorId: record.advisor_id,
    advisor,
    referralAttributionId: record.referral_attribution_id ?? null,
    referrer: record.referrer_code && record.referrer_name
      ? { code: record.referrer_code, name: record.referrer_name }
      : null,
    partnerId: record.partner_id ?? null,
    partnerLocationId: record.partner_location_id ?? null,
    partner,
    partnerLocation: partnerLocation
      ? { name: partnerLocation.name, city: partnerLocation.city ?? null }
      : null,
    closedAt: record.closed_at ?? null,
    messages: record.messages ?? [],
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

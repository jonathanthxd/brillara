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
  messages: TicketMessage[] | null;
  created_at: string;
  updated_at: string;
  advisors?: { code: string; name: string } | null;
}

export function toTicket(record: DatabaseTicket): Ticket {
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
    advisor: record.advisors ?? null,
    messages: record.messages ?? [],
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

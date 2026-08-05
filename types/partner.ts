import { Ticket } from "./ticket";

export type PartnerRole = "owner" | "manager" | "buyer";
export type AppointmentStatus = "programada" | "pendiente-confirmacion" | "completada" | "no-asistio" | "no-concretada" | "reprogramada" | "en-revision" | "cancelada";
export type PartnerOutcome = "no_show" | "rejected_offer" | "not_authentic" | "purity_mismatch" | "price_disagreement" | "return_later" | "rescheduled" | "requirements_not_met" | "duplicate_ticket" | "other";

export interface Partner {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerLocation {
  id: string;
  partnerId: string;
  name: string;
  address: string | null;
  city: string | null;
  timezone: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerUser {
  id: string;
  partnerId: string;
  locationId: string | null;
  name: string;
  code: string;
  role: PartnerRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerAppointment {
  id: string;
  ticketId: string;
  partnerId: string;
  locationId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string | null;
  createdByAdvisorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerPurchase {
  id: string;
  ticketId: string;
  appointmentId: string;
  partnerId: string;
  locationId: string;
  confirmedByPartnerUserId: string;
  metal: string;
  purity: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  pricePerGram: number;
  calculatedTotal: number;
  totalPaid: number;
  paymentMethod: string;
  paymentReference: string | null;
  employeeName: string | null;
  notes: string | null;
  receiptUrl: string | null;
  confirmedAt: string;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  eventType: string;
  actorType: string;
  actorId: string | null;
  actorName: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface PartnerTicketDetail {
  ticket: Ticket;
  appointment: PartnerAppointment | null;
  purchase: PartnerPurchase | null;
  events: TicketEvent[];
}

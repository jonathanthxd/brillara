import {
  Partner,
  PartnerAppointment,
  PartnerLocation,
  PartnerPurchase,
  PartnerRole,
  PartnerUser,
  TicketEvent,
} from "@/types/partner";

type UnknownRecord = Record<string, unknown>;

function text(value: unknown): string | null {
  return typeof value === "string" ? value : value === null || value === undefined ? null : String(value);
}

function requiredText(value: unknown): string {
  return text(value) ?? "";
}

function number(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function boolean(value: unknown): boolean {
  return value === true;
}

function role(value: unknown): PartnerRole {
  return value === "owner" || value === "manager" || value === "buyer" ? value : "buyer";
}

export function toPartner(record: UnknownRecord): Partner {
  return {
    id: requiredText(record.id),
    name: requiredText(record.name),
    type: requiredText(record.type),
    phone: text(record.phone),
    email: text(record.email),
    active: boolean(record.active),
    createdAt: requiredText(record.created_at),
    updatedAt: requiredText(record.updated_at),
  };
}

export function toPartnerLocation(record: UnknownRecord): PartnerLocation {
  return {
    id: requiredText(record.id),
    partnerId: requiredText(record.partner_id),
    name: requiredText(record.name),
    address: text(record.address),
    city: text(record.city),
    timezone: requiredText(record.timezone) || "America/Los_Angeles",
    active: boolean(record.active),
    createdAt: requiredText(record.created_at),
    updatedAt: requiredText(record.updated_at),
  };
}

export function toPartnerUser(record: UnknownRecord): PartnerUser {
  return {
    id: requiredText(record.id),
    partnerId: requiredText(record.partner_id),
    locationId: text(record.location_id),
    name: requiredText(record.name),
    code: requiredText(record.code),
    role: role(record.role),
    active: boolean(record.active),
    lastLoginAt: text(record.last_login_at),
    createdAt: requiredText(record.created_at),
    updatedAt: requiredText(record.updated_at),
  };
}

export function toPartnerAppointment(record: UnknownRecord): PartnerAppointment {
  const status = requiredText(record.status);
  return {
    id: requiredText(record.id),
    ticketId: requiredText(record.ticket_id),
    partnerId: requiredText(record.partner_id),
    locationId: requiredText(record.location_id),
    scheduledAt: requiredText(record.scheduled_at),
    status: status as PartnerAppointment["status"],
    notes: text(record.notes),
    createdByAdvisorId: text(record.created_by_advisor_id),
    createdAt: requiredText(record.created_at),
    updatedAt: requiredText(record.updated_at),
  };
}

export function toPartnerPurchase(record: UnknownRecord): PartnerPurchase {
  return {
    id: requiredText(record.id),
    ticketId: requiredText(record.ticket_id),
    appointmentId: requiredText(record.appointment_id),
    partnerId: requiredText(record.partner_id),
    locationId: requiredText(record.location_id),
    confirmedByPartnerUserId: requiredText(record.confirmed_by_partner_user_id),
    metal: requiredText(record.metal),
    purity: requiredText(record.purity),
    grossWeightGrams: number(record.gross_weight_grams),
    netWeightGrams: number(record.net_weight_grams),
    pricePerGram: number(record.price_per_gram),
    calculatedTotal: number(record.calculated_total),
    totalPaid: number(record.total_paid),
    paymentMethod: requiredText(record.payment_method),
    paymentReference: text(record.payment_reference),
    employeeName: text(record.employee_name),
    notes: text(record.notes),
    receiptUrl: text(record.receipt_url),
    confirmedAt: requiredText(record.confirmed_at),
    voidedAt: text(record.voided_at),
    voidReason: text(record.void_reason),
    createdAt: requiredText(record.created_at),
    updatedAt: requiredText(record.updated_at),
  };
}

export function toTicketEvent(record: UnknownRecord): TicketEvent {
  const details = record.details;
  return {
    id: requiredText(record.id),
    ticketId: requiredText(record.ticket_id),
    eventType: requiredText(record.event_type),
    actorType: requiredText(record.actor_type),
    actorId: text(record.actor_id),
    actorName: text(record.actor_name),
    details: details && typeof details === "object" && !Array.isArray(details) ? details as Record<string, unknown> : {},
    createdAt: requiredText(record.created_at),
  };
}

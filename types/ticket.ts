export type TicketStatus = 
  | "nuevo" 
  | "en-negociacion" 
  | "cita-programada" 
  | "pendiente-confirmacion"
  | "compra-realizada" 
  | "no-concretado"
  | "en-revision"
  | "cancelado" 
  | "archivado";

export interface TicketMessage {
  id: string;
  sender: "cliente" | "admin";
  senderName?: string;
  text: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  clientName: string;
  phone: string;
  city: string;
  location: string;
  description: string;
  photos: string[]; // base64 previews
  status: TicketStatus;
  advisorId: string | null;
  advisor: { code: string; name: string } | null;
  referralAttributionId: string | null;
  referrer: { code: string; name: string } | null;
  partnerId: string | null;
  partnerLocationId: string | null;
  partner: { name: string } | null;
  partnerLocation: { name: string; city: string | null } | null;
  closedAt: string | null;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

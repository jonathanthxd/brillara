export type TicketStatus = 
  | "nuevo" 
  | "en-negociacion" 
  | "cita-programada" 
  | "compra-realizada" 
  | "cancelado" 
  | "archivado";

export interface TicketMessage {
  id: string;
  sender: "cliente" | "admin";
  text: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  clientName: string;
  phone: string;
  city: string;
  location: string;
  description: string;
  photos: string[]; // base64 previews
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

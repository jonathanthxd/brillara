import { Ticket, TicketMessage } from "@/types/ticket";

const STORAGE_KEY = "brillara_tickets";

function generateId(): string {
  return "TKT-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function getTickets(): Ticket[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getTicketById(id: string): Ticket | null {
  return getTickets().find((t) => t.id === id) ?? null;
}

export function getTicketsByName(name: string): Ticket[] {
  return getTickets().filter((t) => t.clientName === name);
}

export function createTicket(data: Omit<Ticket, "id" | "status" | "messages" | "createdAt" | "updatedAt">): Ticket {
  const now = new Date().toISOString();
  const ticket: Ticket = {
    ...data,
    id: generateId(),
    status: "nuevo",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  const all = getTickets();
  all.unshift(ticket);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return ticket;
}

export function addMessage(ticketId: string, message: Omit<TicketMessage, "id" | "timestamp">): Ticket | null {
  const all = getTickets();
  const idx = all.findIndex((t) => t.id === ticketId);
  if (idx === -1) return null;
  
  const newMessage: TicketMessage = {
    ...message,
    id: Math.random().toString(36).substring(2, 10),
    timestamp: new Date().toISOString(),
  };
  
  all[idx].messages.push(newMessage);
  all[idx].updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all[idx];
}

export function updateTicketStatus(ticketId: string, status: Ticket["status"]): Ticket | null {
  const all = getTickets();
  const idx = all.findIndex((t) => t.id === ticketId);
  if (idx === -1) return null;
  all[idx].status = status;
  all[idx].updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all[idx];
}

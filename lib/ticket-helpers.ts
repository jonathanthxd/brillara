import { TicketStatus } from "@/types/ticket";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  "nuevo": "Nuevo",
  "en-negociacion": "En Negociación",
  "cita-programada": "Cita Programada",
  "compra-realizada": "Compra Realizada",
  "cancelado": "Cancelado",
  "archivado": "Archivado",
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  "nuevo": "bg-blue-500/10 text-blue-500",
  "en-negociacion": "bg-primary/10 text-primary",
  "cita-programada": "bg-green-500/10 text-green-500",
  "compra-realizada": "bg-emerald-500/10 text-emerald-500",
  "cancelado": "bg-destructive/10 text-destructive",
  "archivado": "bg-muted text-muted-foreground",
};

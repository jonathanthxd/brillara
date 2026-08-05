import { TicketStatus } from "@/types/ticket";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  "nuevo": "Nuevo",
  "en-negociacion": "En Negociación",
  "cita-programada": "Cita Programada",
  "pendiente-confirmacion": "Pendiente de confirmación",
  "compra-realizada": "Compra Realizada",
  "no-concretado": "No concretado",
  "en-revision": "En revisión",
  "cancelado": "Cancelado",
  "archivado": "Archivado",
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  "nuevo": "bg-blue-500/10 text-blue-500",
  "en-negociacion": "bg-primary/10 text-primary",
  "cita-programada": "bg-green-500/10 text-green-500",
  "pendiente-confirmacion": "bg-amber-500/10 text-amber-600",
  "compra-realizada": "bg-emerald-500/10 text-emerald-500",
  "no-concretado": "bg-orange-500/10 text-orange-600",
  "en-revision": "bg-violet-500/10 text-violet-600",
  "cancelado": "bg-destructive/10 text-destructive",
  "archivado": "bg-muted text-muted-foreground",
};

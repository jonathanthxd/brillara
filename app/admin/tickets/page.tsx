"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { Ticket, TicketStatus } from "@/types/ticket";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface TicketsResponse { tickets: Ticket[] }

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<TicketStatus | "todos">("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void api<TicketsResponse>("/api/admin/tickets")
      .then((data) => setTickets(data.tickets))
      .catch((requestError) => {
        if (requestError instanceof ClientApiError && requestError.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar los tickets.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(() => filter === "todos" ? tickets : tickets.filter((ticket) => ticket.status === filter), [filter, tickets]);
  if (loading) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando tickets…</main>;
  if (error) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-destructive">{error}</main>;

  return (
    <main className="flex flex-1 flex-col px-6 py-12"><div className="mx-auto w-full max-w-6xl"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="font-heading text-3xl font-bold text-foreground">Gestión de tickets</h1><p className="text-muted-foreground">{tickets.length} negociaciones en total</p></div><label className="sr-only" htmlFor="status-filter">Filtrar por estado</label><select id="status-filter" value={filter} onChange={(event) => setFilter(event.target.value as TicketStatus | "todos")} className="h-10 rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none focus:border-primary"><option value="todos">Todos los estados</option><option value="nuevo">Nuevo</option><option value="en-negociacion">En negociación</option><option value="cita-programada">Cita programada</option><option value="compra-realizada">Compra realizada</option><option value="cancelado">Cancelado</option><option value="archivado">Archivado</option></select></div><div className="space-y-3">{filtered.length === 0 ? <p className="text-muted-foreground">No hay tickets con este estado.</p> : filtered.map((ticket) => <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-3"><span className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</span><span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span></div><p className="mt-1 text-sm font-medium text-foreground">{ticket.clientName} — {ticket.phone}</p><p className="text-xs text-muted-foreground">{ticket.city} · {ticket.messages.length} mensaje{ticket.messages.length === 1 ? "" : "s"}{ticket.referrer ? <> · Referido por {ticket.referrer.name} #{ticket.referrer.code}</> : ""}</p></div><span className="text-sm font-medium text-primary">Ver detalle →</span></Link>)}</div></div></main>
  );
}

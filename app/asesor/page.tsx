"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { Ticket } from "@/types/ticket";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Advisor { id: string; code: string; name: string }
interface SessionResponse { authenticated: boolean; advisor: Advisor | null }
interface TicketsResponse { tickets: Ticket[] }

export default function AdvisorDashboard() {
  const router = useRouter();
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const session = await api<SessionResponse>("/api/advisor/session");
        if (!session.authenticated || !session.advisor) { router.replace("/asesor/login"); return; }
        setAdvisor(session.advisor);
        const data = await api<TicketsResponse>("/api/advisor/tickets");
        setTickets(data.tickets);
      } catch (requestError) {
        if (requestError instanceof ClientApiError && requestError.status === 401) { router.replace("/asesor/login"); return; }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar los tickets.");
      } finally { setLoading(false); }
    }
    void load();
  }, [router]);

  const myTickets = useMemo(() => tickets.filter((ticket) => ticket.advisorId === advisor?.id), [advisor?.id, tickets]);
  const availableTickets = useMemo(() => tickets.filter((ticket) => !ticket.advisorId && ticket.status === "nuevo"), [tickets]);

  async function claim(ticketId: string) {
    setClaiming(ticketId); setError("");
    try { const data = await api<{ ticket: Ticket }>("/api/advisor/tickets", { method: "POST", body: JSON.stringify({ id: ticketId }) }); setTickets((current) => current.map((ticket) => ticket.id === ticketId ? data.ticket : ticket)); router.push(`/asesor/tickets/${ticketId}`); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos tomar el ticket."); }
    finally { setClaiming(null); }
  }

  async function logout() { await api("/api/advisor/session", { method: "DELETE" }).catch(() => undefined); router.replace("/asesor/login"); }
  if (loading) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando panel…</main>;
  if (!advisor) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-destructive">{error || "Sesión no disponible."}</main>;

  return <main className="flex flex-1 flex-col px-6 py-12"><div className="mx-auto w-full max-w-6xl"><div className="mb-8 flex items-center justify-between"><div><h1 className="font-heading text-3xl font-bold text-foreground">Panel de {advisor.name}#{advisor.code}</h1><p className="text-muted-foreground">Gestión de negociaciones</p></div><button onClick={logout} className="h-10 rounded-full border border-border px-6 text-sm font-medium text-foreground hover:bg-accent">Cerrar sesión</button></div><TicketList title={`Mis tickets (${myTickets.length})`} tickets={myTickets} empty="No tienes tickets asignados." /><section className="mt-10"><h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Tickets disponibles ({availableTickets.length})</h2>{availableTickets.length === 0 ? <p className="text-muted-foreground">No hay tickets nuevos disponibles.</p> : <div className="space-y-3">{availableTickets.map((ticket) => <div key={ticket.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"><div><span className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</span><p className="text-sm font-medium text-foreground">{ticket.clientName} — {ticket.city}</p><p className="line-clamp-1 text-xs text-muted-foreground">{ticket.description}</p></div><button type="button" disabled={claiming !== null} onClick={() => claim(ticket.id)} className="h-9 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground disabled:opacity-50">{claiming === ticket.id ? "Tomando…" : "Atender"}</button></div>)}</div>}</section>{error && <p role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}</div></main>;
}

function TicketList({ title, tickets, empty }: { title: string; tickets: Ticket[]; empty: string }) {
  return <section><h2 className="mb-4 font-heading text-xl font-semibold text-foreground">{title}</h2>{tickets.length === 0 ? <p className="text-muted-foreground">{empty}</p> : <div className="space-y-3">{tickets.map((ticket) => <Link key={ticket.id} href={`/asesor/tickets/${ticket.id}`} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"><div><span className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</span><p className="text-sm font-medium text-foreground">{ticket.clientName} — {ticket.city}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span></Link>)}</div>}</section>;
}

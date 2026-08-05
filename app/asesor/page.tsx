"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { Ticket } from "@/types/ticket";
import { ArrowUpRight, ClipboardList, LogOut, UserRound } from "lucide-react";
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

  return <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto w-full max-w-6xl"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRound className="size-5" aria-hidden /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Portal del asesor</p><h1 className="mt-1 font-heading text-3xl font-bold text-foreground sm:text-4xl">{advisor.name} <span className="font-sans text-lg font-medium text-muted-foreground">#{advisor.code}</span></h1><p className="mt-1 text-muted-foreground">Gestión de negociaciones</p></div></div><button onClick={logout} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"><LogOut className="size-4" aria-hidden /> Cerrar sesión</button></div><TicketList title={`Mis tickets (${myTickets.length})`} tickets={myTickets} empty="No tienes tickets asignados." /><section className="mt-10"><div className="mb-4 flex items-center justify-between"><h2 className="font-heading text-2xl font-semibold text-foreground">Tickets disponibles</h2><span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{availableTickets.length}</span></div>{availableTickets.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-6 text-muted-foreground">No hay tickets nuevos disponibles.</p> : <div className="space-y-3">{availableTickets.map((ticket) => <div key={ticket.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><span className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</span><p className="mt-1 text-sm font-medium text-foreground">{ticket.clientName} <span className="text-muted-foreground">— {ticket.city}</span></p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{ticket.description}</p></div><button type="button" disabled={claiming !== null} onClick={() => claim(ticket.id)} className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50">{claiming === ticket.id ? "Tomando…" : <>Atender <ArrowUpRight className="size-3.5" aria-hidden /></>}</button></div>)}</div>}</section>{error && <p role="alert" className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}</div></main>;
}

function TicketList({ title, tickets, empty }: { title: string; tickets: Ticket[]; empty: string }) {
  return <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardList className="size-4" aria-hidden /></span><h2 className="font-heading text-2xl font-semibold text-foreground">{title}</h2></div>{tickets.length === 0 ? <p className="rounded-2xl bg-muted/60 p-5 text-muted-foreground">{empty}</p> : <div className="space-y-3">{tickets.map((ticket) => <Link key={ticket.id} href={`/asesor/tickets/${ticket.id}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-4 transition-all hover:border-primary/35 hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between"><div><span className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</span><p className="mt-1 text-sm font-medium text-foreground">{ticket.clientName} <span className="text-muted-foreground">— {ticket.city}</span></p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span></Link>)}</div>}</section>;
}

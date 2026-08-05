"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { Ticket } from "@/types/ticket";
import { ArrowUpRight, ClipboardList, Copy, Link2, LogOut, MousePointerClick, ShoppingBag, TicketCheck, UserCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Advisor { id: string; code: string; name: string }
interface SessionResponse { authenticated: boolean; advisor: Advisor | null }
interface TicketsResponse { tickets: Ticket[] }
interface ReferralLead { id: string; name: string | null; registeredAt: string | null; firstSeenAt: string; lastSeenAt: string }
interface ReferralStats {
  code: string;
  shareUrl: string;
  uniqueVisitors: number;
  registeredLeads: number;
  ticketsCreated: number;
  purchasesCompleted: number;
  recentLeads: ReferralLead[];
}
interface ReferralResponse { referral: ReferralStats }

export default function AdvisorDashboard() {
  const router = useRouter();
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const session = await api<SessionResponse>("/api/advisor/session");
        if (!session.authenticated || !session.advisor) { router.replace("/asesor/login"); return; }
        setAdvisor(session.advisor);
        const [ticketData, referralData] = await Promise.all([
          api<TicketsResponse>("/api/advisor/tickets"),
          api<ReferralResponse>("/api/advisor/referrals"),
        ]);
        setTickets(ticketData.tickets);
        setReferral(referralData.referral);
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
  async function copyReferralLink() {
    if (!referral) return;
    try {
      await navigator.clipboard.writeText(referral.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setError("No pudimos copiar el enlace. Puedes seleccionarlo y copiarlo manualmente.");
    }
  }
  if (loading) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando panel…</main>;
  if (!advisor) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-destructive">{error || "Sesión no disponible."}</main>;

  return <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto w-full max-w-6xl"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRound className="size-5" aria-hidden /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Portal del asesor</p><h1 className="mt-1 font-heading text-3xl font-bold text-foreground sm:text-4xl">{advisor.name} <span className="font-sans text-lg font-medium text-muted-foreground">#{advisor.code}</span></h1><p className="mt-1 text-muted-foreground">Gestión de negociaciones</p></div></div><button onClick={logout} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"><LogOut className="size-4" aria-hidden /> Cerrar sesión</button></div>{referral && <ReferralOverview referral={referral} copied={copied} onCopy={copyReferralLink} />}<TicketList title={`Mis tickets (${myTickets.length})`} tickets={myTickets} empty="No tienes tickets asignados." /><section className="mt-10"><div className="mb-4 flex items-center justify-between"><h2 className="font-heading text-2xl font-semibold text-foreground">Tickets disponibles</h2><span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{availableTickets.length}</span></div>{availableTickets.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-6 text-muted-foreground">No hay tickets nuevos disponibles.</p> : <div className="space-y-3">{availableTickets.map((ticket) => <div key={ticket.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><span className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</span><p className="mt-1 text-sm font-medium text-foreground">{ticket.clientName} <span className="text-muted-foreground">— {ticket.city}</span></p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{ticket.description}</p></div><button type="button" disabled={claiming !== null} onClick={() => claim(ticket.id)} className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50">{claiming === ticket.id ? "Tomando…" : <>Atender <ArrowUpRight className="size-3.5" aria-hidden /></>}</button></div>)}</div>}</section>{error && <p role="alert" className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}</div></main>;
}

function ReferralOverview({ referral, copied, onCopy }: { referral: ReferralStats; copied: boolean; onCopy: () => void }) {
  return <section className="mb-8 rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-sm sm:p-7"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex items-center gap-2 text-primary"><Link2 className="size-4" aria-hidden /><p className="text-xs font-semibold uppercase tracking-[0.16em]">Mi enlace de referido</p></div><h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">Comparte tu enlace y sigue tus resultados</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">La primera referencia válida queda asociada al cliente. Cuando abra una negociación, se asignará automáticamente a tu panel.</p></div><button type="button" onClick={onCopy} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:brightness-110"><Copy className="size-4" aria-hidden />{copied ? "Enlace copiado" : "Copiar enlace"}</button></div><div className="mt-5 flex flex-col gap-2 rounded-2xl border border-border bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between"><code className="min-w-0 truncate font-mono text-sm text-foreground">{referral.shareUrl}</code><span className="shrink-0 rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">#{referral.code}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ReferralMetric label="Visitas únicas" value={referral.uniqueVisitors} icon={<MousePointerClick className="size-4" aria-hidden />} /><ReferralMetric label="Registrados" value={referral.registeredLeads} icon={<UserCheck className="size-4" aria-hidden />} /><ReferralMetric label="Tickets creados" value={referral.ticketsCreated} icon={<TicketCheck className="size-4" aria-hidden />} /><ReferralMetric label="Compras realizadas" value={referral.purchasesCompleted} icon={<ShoppingBag className="size-4" aria-hidden />} /></div><div className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="font-heading text-lg font-semibold text-foreground">Personas conseguidas</h3><span className="text-xs text-muted-foreground">Últimas {referral.recentLeads.length}</span></div>{referral.recentLeads.length === 0 ? <p className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">Aún no hay visitas desde tu enlace.</p> : <div className="grid gap-2 md:grid-cols-2">{referral.recentLeads.map((lead) => <div key={lead.id} className="rounded-2xl border border-border bg-background/60 px-4 py-3"><p className="truncate text-sm font-medium text-foreground">{lead.name ?? "Visita sin registro"}</p><p className="mt-1 text-xs text-muted-foreground">{lead.registeredAt ? `Registrado el ${displayReferralDate(lead.registeredAt)}` : `Visitó el ${displayReferralDate(lead.firstSeenAt)}`}</p></div>)}</div>}</div></section>;
}

function ReferralMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-background/65 p-4"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{label}</p><span className="text-primary">{icon}</span></div><p className="mt-2 font-heading text-3xl font-bold text-foreground">{value}</p></div>;
}

function displayReferralDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "fecha no disponible" : new Intl.DateTimeFormat("es-US", { day: "numeric", month: "short" }).format(date);
}

function TicketList({ title, tickets, empty }: { title: string; tickets: Ticket[]; empty: string }) {
  return <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardList className="size-4" aria-hidden /></span><h2 className="font-heading text-2xl font-semibold text-foreground">{title}</h2></div>{tickets.length === 0 ? <p className="rounded-2xl bg-muted/60 p-5 text-muted-foreground">{empty}</p> : <div className="space-y-3">{tickets.map((ticket) => <Link key={ticket.id} href={`/asesor/tickets/${ticket.id}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-4 transition-all hover:border-primary/35 hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between"><div><span className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</span><p className="mt-1 text-sm font-medium text-foreground">{ticket.clientName} <span className="text-muted-foreground">— {ticket.city}</span></p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span></Link>)}</div>}</section>;
}

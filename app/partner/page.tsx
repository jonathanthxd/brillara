"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { PartnerAppointment } from "@/types/partner";
import { Ticket } from "@/types/ticket";
import { CalendarDays, ClipboardCheck, Clock3, LogOut, Search, ShieldAlert, ShoppingBag, Store, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

interface PartnerUser { id: string; partnerId: string; locationId: string | null; name: string; role: string }
interface SessionResponse { authenticated: boolean; partnerUser: PartnerUser | null }
interface TicketRow { ticket: Ticket; appointment: PartnerAppointment | null }
interface DashboardResponse {
  stats: { todayAppointments: number; pendingConfirmation: number; purchasesLast30Days: number; problemsInReview: number; noShowsLast30Days: number };
  today: TicketRow[];
  pending: TicketRow[];
  recent: TicketRow[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const session = await api<SessionResponse>("/api/partner/session");
        if (!session.authenticated || !session.partnerUser) { router.replace("/partner/login"); return; }
        setPartnerUser(session.partnerUser);
        setDashboard(await api<DashboardResponse>("/api/partner/dashboard"));
      } catch (requestError) {
        if (requestError instanceof ClientApiError && requestError.status === 401) { router.replace("/partner/login"); return; }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar el portal.");
      } finally { setLoading(false); }
    }
    void load();
  }, [router]);

  async function logout() {
    await api("/api/partner/session", { method: "DELETE" }).catch(() => undefined);
    router.replace("/partner/login");
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/partner/history?q=${encodeURIComponent(search)}`);
  }

  if (loading) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando portal…</main>;
  if (!partnerUser || !dashboard) return <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center"><h1 className="font-heading text-3xl font-bold">No pudimos cargar el portal</h1><p className="mt-3 text-muted-foreground">{error || "Sesión no disponible."}</p></main>;

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto w-full max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Store className="size-5" aria-hidden /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Portal del partner</p><h1 className="mt-1 font-heading text-3xl font-bold text-foreground sm:text-4xl">Hola, {partnerUser.name}</h1><p className="mt-1 text-muted-foreground">Resultados presenciales y citas asignadas</p></div></div><div className="flex flex-wrap gap-2"><Link href="/partner/history" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent"><Clock3 className="size-4" aria-hidden /> Historial</Link><button onClick={logout} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-accent"><LogOut className="size-4" aria-hidden /> Cerrar sesión</button></div></div>
      <form onSubmit={submitSearch} className="mb-7 flex gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm"><label className="sr-only" htmlFor="partner-search">Buscar ticket</label><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input id="partner-search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={80} className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Buscar por ticket, nombre o teléfono" /></div><button type="submit" className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Buscar</button></form>
      <div className="mb-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Citas de hoy" value={dashboard.stats.todayAppointments} icon={<CalendarDays className="size-4" aria-hidden />} /><Metric label="Pendientes" value={dashboard.stats.pendingConfirmation} icon={<ClipboardCheck className="size-4" aria-hidden />} /><Metric label="Compras (30 días)" value={dashboard.stats.purchasesLast30Days} icon={<ShoppingBag className="size-4" aria-hidden />} /><Metric label="En revisión" value={dashboard.stats.problemsInReview} icon={<ShieldAlert className="size-4" aria-hidden />} /><Metric label="No presentados" value={dashboard.stats.noShowsLast30Days} icon={<TicketCheck className="size-4" aria-hidden />} /></div>
      <section className="mb-8 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><SectionTitle title="Citas de hoy" subtitle="Solo aparecen las citas asignadas a tu partner o sucursal." /><TicketRows rows={dashboard.today} empty="No tienes citas pendientes para hoy." /></section>
      <section className="mb-8 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-sm sm:p-7"><SectionTitle title="Pendientes de confirmación" subtitle="Registra una compra, resultado o problema desde el ticket." /><TicketRows rows={dashboard.pending} empty="No hay visitas pendientes de resultado." /></section>
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><SectionTitle title="Actividad reciente" subtitle="Incluye citas, resultados y operaciones de tu partner." /><TicketRows rows={dashboard.recent} empty="Aún no hay actividad asignada." /></section>
      {error && <p role="alert" className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
    </div></main>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{label}</p><span className="text-primary">{icon}</span></div><p className="mt-2 font-heading text-3xl font-bold text-foreground">{value}</p></div>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="mb-5"><h2 className="font-heading text-2xl font-semibold text-foreground">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>;
}

function TicketRows({ rows, empty }: { rows: TicketRow[]; empty: string }) {
  if (rows.length === 0) return <p className="rounded-2xl border border-dashed border-border bg-background/40 p-5 text-sm text-muted-foreground">{empty}</p>;
  return <div className="space-y-3">{rows.map(({ ticket, appointment }) => <Link key={ticket.id} href={`/partner/tickets/${ticket.id}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-background/55 p-4 transition-colors hover:border-primary/35 hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</p><p className="mt-1 font-medium text-foreground">{ticket.clientName} <span className="text-muted-foreground">· {ticket.phone}</span></p><p className="mt-1 text-xs text-muted-foreground">{appointment ? formatDate(appointment.scheduledAt) : "Sin cita activa"}{ticket.advisor ? ` · Asesor: ${ticket.advisor.name}` : ""}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span></Link>)}</div>;
}

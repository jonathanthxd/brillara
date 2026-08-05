"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { Ticket } from "@/types/ticket";
import { ArrowUpRight, CalendarDays, Settings2, Store, TicketCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface TicketsResponse { tickets: Ticket[] }

export default function AdminDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { tickets: items } = await api<TicketsResponse>("/api/admin/tickets");
        setTickets(items);
      } catch (requestError) {
        if (requestError instanceof ClientApiError && requestError.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar los tickets.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const stats = useMemo(() => ({
    total: tickets.length,
    nuevos: tickets.filter((ticket) => ticket.status === "nuevo").length,
    negociacion: tickets.filter((ticket) => ticket.status === "en-negociacion").length,
    citas: tickets.filter((ticket) => ticket.status === "cita-programada").length,
  }), [tickets]);

  async function logout() {
    await api("/api/admin/session", { method: "DELETE" }).catch(() => undefined);
    router.replace("/admin/login");
  }

  if (loading) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando panel…</main>;
  if (error) return <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center"><h1 className="font-heading text-3xl font-bold">No pudimos cargar el panel</h1><p className="mt-3 text-muted-foreground">{error}</p></main>;

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Administración</span>
            <h1 className="mt-3 font-heading text-4xl font-bold text-foreground">Vista general</h1>
            <p className="mt-1 text-muted-foreground">Controla negociaciones, equipo y contenido público de BRILLARA.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/asesores" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:-translate-y-0.5 hover:brightness-110"><UsersRound className="size-4" aria-hidden /> Asesores</Link>
            <Link href="/admin/partners" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"><Store className="size-4" aria-hidden /> Partners</Link>
            <Link href="/admin/config" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"><Settings2 className="size-4" aria-hidden /> Configuración</Link>
            <button onClick={logout} className="h-10 rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent">Cerrar sesión</button>
          </div>
        </div>
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total tickets" value={stats.total} icon={<TicketCheck className="size-4" aria-hidden />} />
          <StatCard label="Nuevos" value={stats.nuevos} color="text-blue-500" icon={<ArrowUpRight className="size-4" aria-hidden />} />
          <StatCard label="En negociación" value={stats.negociacion} color="text-primary" icon={<TicketCheck className="size-4" aria-hidden />} />
          <StatCard label="Citas" value={stats.citas} color="text-green-500" icon={<CalendarDays className="size-4" aria-hidden />} />
        </div>
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="font-heading text-2xl font-semibold text-foreground">Actividad reciente</h2><p className="mt-1 text-sm text-muted-foreground">Últimos tickets recibidos</p></div><Link href="/admin/tickets" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Ver todos <ArrowUpRight className="size-4" aria-hidden /></Link></div>
          {tickets.length === 0 ? <p className="rounded-2xl bg-muted/60 p-6 text-center text-muted-foreground">No hay tickets aún.</p> : <div className="space-y-3">{tickets.slice(0, 5).map((ticket) => <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-4 transition-all hover:border-primary/35 hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between"><div><span className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</span><p className="mt-1 text-sm font-medium text-foreground">{ticket.clientName} <span className="text-muted-foreground">— {ticket.city}</span></p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span></Link>)}</div>}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, color = "text-foreground", icon }: { label: string; value: number; color?: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className={`flex size-8 items-center justify-center rounded-xl bg-muted ${color}`}>{icon}</span></div><p className={`mt-3 font-heading text-3xl font-bold ${color}`}>{value}</p></div>;
}

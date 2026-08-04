"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { Ticket } from "@/types/ticket";
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
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1><p className="text-muted-foreground">Resumen de operaciones</p></div><div className="flex gap-3"><Link href="/admin/config" className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent">Configuración</Link><button onClick={logout} className="h-10 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent">Cerrar sesión</button></div></div>
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Total tickets" value={stats.total} /><StatCard label="Nuevos" value={stats.nuevos} color="text-blue-500" /><StatCard label="En negociación" value={stats.negociacion} color="text-primary" /><StatCard label="Citas" value={stats.citas} color="text-green-500" /></div>
        <section><div className="mb-4 flex items-center justify-between"><h2 className="font-heading text-xl font-semibold text-foreground">Actividad reciente</h2><Link href="/admin/tickets" className="text-sm font-medium text-primary hover:underline">Ver todos los tickets →</Link></div>{tickets.length === 0 ? <p className="text-muted-foreground">No hay tickets aún.</p> : <div className="space-y-3">{tickets.slice(0, 5).map((ticket) => <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"><div><span className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</span><p className="text-sm font-medium text-foreground">{ticket.clientName} — {ticket.city}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span></Link>)}</div>}</section>
      </div>
    </main>
  );
}

function StatCard({ label, value, color = "text-foreground" }: { label: string; value: number; color?: string }) {
  return <div className="rounded-2xl border border-border bg-card p-6"><p className="text-sm text-muted-foreground">{label}</p><p className={`mt-2 font-heading text-3xl font-bold ${color}`}>{value}</p></div>;
}

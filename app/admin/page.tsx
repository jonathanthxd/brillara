"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAdminLoggedIn, logoutAdmin } from "@/services/admin";
import { getTickets } from "@/services/tickets";
import { getAnalyticsSummary } from "@/services/analytics";
import { Ticket } from "@/types/ticket";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/ticket-helpers";

export default function AdminDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAdminLoggedIn()) {
      router.push("/admin/login");
      return;
    }
    setTickets(getTickets());
    setSummary(getAnalyticsSummary());
  }, [router]);

  if (!mounted) return null;

  const stats = {
    total: tickets.length,
    nuevos: tickets.filter((t) => t.status === "nuevo").length,
    negociacion: tickets.filter((t) => t.status === "en-negociacion").length,
    citas: tickets.filter((t) => t.status === "cita-programada").length,
    concluidos: tickets.filter((t) => t.status === "compra-realizada").length,
  };

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Resumen de operaciones</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/config" className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent">
              Configuración
            </Link>
            <button onClick={() => { logoutAdmin(); router.push("/admin/login"); }} className="h-10 rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent">
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Métricas de Negocio */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Tickets" value={stats.total} />
          <StatCard label="Nuevos" value={stats.nuevos} color="text-blue-500" />
          <StatCard label="En Negociación" value={stats.negociacion} color="text-primary" />
          <StatCard label="Citas Programadas" value={stats.citas} color="text-green-500" />
        </div>

        {/* Métricas de Web */}
        {summary && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Métricas del Sitio</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Visitas Totales</p>
                <p className="mt-1 font-heading text-2xl font-bold text-foreground">{summary.totalVisits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
                <p className="mt-1 font-heading text-2xl font-bold text-foreground">{summary.uniqueVisitors}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tickets Iniciados</p>
                <p className="mt-1 font-heading text-2xl font-bold text-primary">{summary.ticketsStarted}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Conversión</p>
                <p className="mt-1 font-heading text-2xl font-bold text-green-500">{summary.conversionRate}%</p>
              </div>
            </div>
            
            {summary.topPages.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-foreground">Páginas más visitadas:</p>
                <div className="flex flex-wrap gap-2">
                  {summary.topPages.map(([page, count]: [string, number]) => (
                    <span key={page} className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                      {page} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actividad reciente */}
        <div>
          <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Actividad reciente</h2>
          {tickets.length === 0 ? (
            <p className="text-muted-foreground">No hay tickets aún.</p>
          ) : (
            <div className="space-y-3">
              {tickets.slice(0, 5).map((t) => (
                <Link key={t.id} href={`/admin/tickets/${t.id}`} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">#{t.id}</span>
                    <p className="text-sm font-medium text-foreground">{t.clientName} — {t.city}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/admin/tickets" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Ver todos los tickets →
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, color = "text-foreground" }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 font-heading text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAdvisorLoggedIn, getCurrentAdvisor, logoutAdvisor } from "@/services/supabase-advisors";
import { getAllTickets, assignTicketToAdvisor } from "@/services/supabase-tickets";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/ticket-helpers";

export default function AdvisorDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [advisor, setAdvisor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAdvisorLoggedIn()) {
      router.push("/asesor/login");
      return;
    }
    setAdvisor(getCurrentAdvisor());
    loadTickets();
  }, [router]);

  async function loadTickets() {
    setLoading(true);
    const all = await getAllTickets();
    setTickets(all);
    
    const current = getCurrentAdvisor();
    if (current) {
      setMyTickets(all.filter((t: any) => t.advisor_id === current.id));
    }
    setLoading(false);
  }

  async function handleClaimTicket(ticketId: string) {
    const current = getCurrentAdvisor();
    if (!current) return;
    await assignTicketToAdvisor(ticketId, current.id);
    await loadTickets();
  }

  if (!mounted) return null;

  const unassignedTickets = tickets.filter((t: any) => !t.advisor_id && t.status === "nuevo");

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Panel de {advisor?.name}#{advisor?.code}
            </h1>
            <p className="text-muted-foreground">Gestión de negociaciones</p>
          </div>
          <button
            onClick={() => { logoutAdvisor(); router.push("/asesor/login"); }}
            className="h-10 rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
            Mis Tickets ({myTickets.length})
          </h2>
          {myTickets.length === 0 ? (
            <p className="text-muted-foreground">No tienes tickets asignados.</p>
          ) : (
            <div className="space-y-3">
              {myTickets.map((t: any) => (
                <Link
                  key={t.id}
                  href={`/asesor/tickets/${t.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
                >
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">#{t.ticket_number || t.id.slice(0, 8)}</span>
                    <p className="text-sm font-medium text-foreground">{t.client_name} — {t.city}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[t.status as any]}`}>
                    {STATUS_LABELS[t.status as any]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
            Tickets Disponibles ({unassignedTickets.length})
          </h2>
          {unassignedTickets.length === 0 ? (
            <p className="text-muted-foreground">No hay tickets nuevos disponibles.</p>
          ) : (
            <div className="space-y-3">
              {unassignedTickets.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">#{t.ticket_number || t.id.slice(0, 8)}</span>
                    <p className="text-sm font-medium text-foreground">{t.client_name} — {t.city}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                  </div>
                  <button
                    onClick={() => handleClaimTicket(t.id)}
                    className="h-9 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition-all hover:brightness-110"
                  >
                    Atender
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

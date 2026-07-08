"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAdminLoggedIn } from "@/services/admin";
import { getTickets } from "@/services/tickets";
import { Ticket, TicketStatus } from "@/types/ticket";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/ticket-helpers";

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<TicketStatus | "todos">("todos");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAdminLoggedIn()) {
      router.push("/admin/login");
      return;
    }
    setTickets(getTickets());
  }, [router]);

  if (!mounted) return null;

  const filtered = filter === "todos" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Gestión de Tickets</h1>
            <p className="text-muted-foreground">{tickets.length} negociaciones en total</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as TicketStatus | "todos")}
            className="h-10 rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="todos">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="en-negociacion">En Negociación</option>
            <option value="cita-programada">Cita Programada</option>
            <option value="compra-realizada">Compra Realizada</option>
            <option value="cancelado">Cancelado</option>
            <option value="archivado">Archivado</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tickets/${t.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">#{t.id}</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">{t.clientName} — {t.phone}</p>
                <p className="text-xs text-muted-foreground">{t.city} · {t.messages.length} mensaje{t.messages.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="text-sm font-medium text-primary">Ver detalle →</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

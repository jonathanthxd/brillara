"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTicketsByName } from "@/services/tickets";
import { recordVisit } from "@/services/analytics";
import { Ticket } from "@/types/ticket";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/ticket-helpers";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    recordVisit("/tickets");
    const saved = localStorage.getItem("brillara_name");
    if (saved) {
      setName(saved);
      setTickets(getTicketsByName(saved));
    }
  }, []);

  if (tickets.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">Mis Tickets</h1>
        <p className="mt-4 text-muted-foreground">Aún no has iniciado ninguna negociación.</p>
        <Link href="/ticket/nuevo" className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-all hover:brightness-110">
          Iniciar primera negociación
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Mis Tickets</h1>
            <p className="text-muted-foreground">Negociaciones de {name}</p>
          </div>
          <Link href="/ticket/nuevo" className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:brightness-110">
            + Nuevo
          </Link>
        </div>

        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/ticket/${ticket.id}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-muted-foreground">#{ticket.id}</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Creado: {new Date(ticket.createdAt).toLocaleDateString("es-US")}
                  {ticket.messages.length > 0 && ` · ${ticket.messages.length} mensaje${ticket.messages.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                Ver detalle <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

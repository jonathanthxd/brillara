"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { Ticket } from "@/types/ticket";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProfileResponse {
  registered: boolean;
  name: string | null;
}

interface TicketsResponse {
  tickets: Ticket[];
}

export default function MyTicketsPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profile = await api<ProfileResponse>("/api/profile");
        if (!profile.registered) {
          router.replace("/");
          return;
        }

        setName(profile.name);
        const data = await api<TicketsResponse>("/api/tickets");
        setTickets(data.tickets);
      } catch (requestError) {
        if (requestError instanceof ClientApiError && requestError.status === 401) {
          router.replace("/");
          return;
        }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar tus tickets.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  if (loading) {
    return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando tus tickets…</main>;
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">No pudimos cargar tus tickets</h1>
        <p className="mt-3 text-muted-foreground">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Reintentar</button>
      </main>
    );
  }

  if (tickets.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">Mis tickets</h1>
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Mis tickets</h1>
            <p className="text-muted-foreground">Negociaciones de {name}</p>
          </div>
          <Link href="/ticket/nuevo" className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:brightness-110">
            + Nuevo
          </Link>
        </div>

        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/ticket/${ticket.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-muted-foreground">#{ticket.ticketNumber}</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Creado: {new Date(ticket.createdAt).toLocaleDateString("es-US")}
                  {ticket.messages.length > 0 && ` · ${ticket.messages.length} mensaje${ticket.messages.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <span className="text-sm font-medium text-primary">Ver detalle →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

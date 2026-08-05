"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { PartnerAppointment } from "@/types/partner";
import { Ticket } from "@/types/ticket";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

interface TicketRow { ticket: Ticket; appointment: PartnerAppointment | null }
interface TicketsResponse { tickets: TicketRow[] }

export default function PartnerHistoryPage() {
  return <Suspense fallback={<main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando historial…</main>}><PartnerHistoryContent /></Suspense>;
}

function PartnerHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams({ view: initialSearch ? "all" : "history" });
    if (initialSearch) query.set("q", initialSearch);
    void api<TicketsResponse>(`/api/partner/tickets?${query.toString()}`)
      .then((data) => setRows(data.tickets))
      .catch((requestError) => {
        if (requestError instanceof ClientApiError && requestError.status === 401) { router.replace("/partner/login"); return; }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar el historial.");
      })
      .finally(() => setLoading(false));
  }, [initialSearch, router]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.replace(`/partner/history${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
    setLoading(true);
  }

  if (loading) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando historial…</main>;
  return <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto w-full max-w-5xl"><Link href="/partner" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ArrowLeft className="size-4" aria-hidden /> Volver al portal</Link><h1 className="mt-4 font-heading text-3xl font-bold text-foreground">Historial y búsqueda</h1><p className="mt-1 text-muted-foreground">Consulta operaciones cerradas o encuentra un ticket asignado por número, nombre o teléfono.</p><form onSubmit={submit} className="mt-6 flex gap-2"><label className="sr-only" htmlFor="history-search">Buscar ticket</label><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input id="history-search" value={search} onChange={(event) => setSearch(event.target.value)} className="input h-11 pl-10" placeholder="Ticket, cliente o teléfono" /></div><button type="submit" className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Buscar</button></form>{error && <p role="alert" className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}<div className="mt-7 space-y-3">{rows.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-6 text-muted-foreground">No hay tickets para mostrar.</p> : rows.map(({ ticket, appointment }) => <Link key={ticket.id} href={`/partner/tickets/${ticket.id}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/35 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</p><p className="mt-1 font-medium text-foreground">{ticket.clientName} <span className="text-muted-foreground">· {ticket.phone}</span></p><p className="mt-1 text-xs text-muted-foreground">{appointment ? new Date(appointment.scheduledAt).toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" }) : "Sin cita registrada"}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span></Link>)}</div></div></main>;
}

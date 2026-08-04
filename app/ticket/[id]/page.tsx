"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { Ticket } from "@/types/ticket";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

interface TicketResponse {
  ticket: Ticket;
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadTicket() {
      try {
        const data = await api<TicketResponse>(`/api/tickets/${params.id}`);
        setTicket(data.ticket);
      } catch (requestError) {
        if (requestError instanceof ClientApiError && requestError.status === 401) {
          router.replace("/");
          return;
        }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar el ticket.");
      } finally {
        setLoading(false);
      }
    }

    void loadTicket();
  }, [params.id, router]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket || !newMessage.trim()) return;

    setError("");
    setSending(true);
    try {
      const data = await api<TicketResponse>(`/api/tickets/${ticket.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: newMessage }),
      });
      setTicket(data.ticket);
      setNewMessage("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos enviar tu mensaje.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando ticket…</main>;
  }

  if (!ticket) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">Ticket no disponible</h1>
        <p className="mt-3 max-w-md text-muted-foreground">{error || "Este ticket pertenece a otra sesión o ya no existe."}</p>
        <Link href="/tickets" className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Ver mis tickets</Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6"><Link href="/tickets" className="text-sm text-muted-foreground hover:text-foreground">← Volver a mis tickets</Link></div>
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</p>
              <h1 className="font-heading text-2xl font-bold text-foreground">Negociación de {ticket.clientName}</h1>
            </div>
            <span className={`rounded-full px-4 py-1.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>
          </div>
          <div className="mt-4 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
            <div><span className="font-medium text-foreground">Teléfono:</span> {ticket.phone}</div>
            <div><span className="font-medium text-foreground">Ciudad:</span> {ticket.city}</div>
            <div><span className="font-medium text-foreground">Ubicación:</span> {ticket.location}</div>
          </div>
          <div className="mt-4 rounded-xl bg-muted p-4"><p className="text-sm font-medium text-foreground">Descripción:</p><p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p></div>
          {ticket.photos.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-foreground">Fotos adjuntas:</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {ticket.photos.map((photo, index) => (
                  <a key={photo} href={photo} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary">
                    <Image src={photo} alt={`Foto adjunta ${index + 1}`} fill unoptimized sizes="(max-width: 640px) 33vw, 25vw" className="object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <section className="mb-6" aria-labelledby="conversation-heading">
          <h2 id="conversation-heading" className="mb-4 font-heading text-xl font-semibold text-foreground">Conversación</h2>
          {ticket.messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><p className="text-muted-foreground">Aún no hay mensajes. Escribe el primero para iniciar la conversación.</p></div>
          ) : (
            <div className="space-y-4">
              {ticket.messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "cliente" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.sender === "cliente" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {message.senderName && <p className="mb-1 text-[10px] opacity-70">{message.senderName}</p>}
                    <p>{message.text}</p>
                    <p className={`mt-1 text-[10px] ${message.sender === "cliente" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(message.timestamp).toLocaleString("es-US", { dateStyle: "short", timeStyle: "short" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <label className="sr-only" htmlFor="new-message">Escribe un mensaje</label>
          <input id="new-message" type="text" value={newMessage} onChange={(event) => setNewMessage(event.target.value)} maxLength={1_000} placeholder="Escribe un mensaje…" className="h-12 min-w-0 flex-1 rounded-full border border-input bg-background px-6 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <button type="submit" disabled={sending || !newMessage.trim()} className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50">{sending ? "Enviando…" : "Enviar"}</button>
        </form>
      </div>
    </main>
  );
}

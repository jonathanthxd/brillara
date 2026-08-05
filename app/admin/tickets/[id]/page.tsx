"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { Ticket, TicketStatus } from "@/types/ticket";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

interface TicketResponse { ticket: Ticket }
const STATUSES: TicketStatus[] = ["nuevo", "en-negociacion", "cita-programada", "compra-realizada", "cancelado", "archivado"];

export default function AdminTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api<TicketResponse>(`/api/admin/tickets/${params.id}`)
      .then((data) => setTicket(data.ticket))
      .catch((requestError) => {
        if (requestError instanceof ClientApiError && requestError.status === 401) { router.replace("/admin/login"); return; }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar el ticket.");
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  async function changeStatus(status: TicketStatus) {
    if (!ticket || saving) return;
    setSaving(true); setError("");
    try { const data = await api<TicketResponse>(`/api/admin/tickets/${ticket.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setTicket(data.ticket); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos actualizar el estado."); }
    finally { setSaving(false); }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket || !newMessage.trim() || saving) return;
    setSaving(true); setError("");
    try { const data = await api<TicketResponse>(`/api/admin/tickets/${ticket.id}/messages`, { method: "POST", body: JSON.stringify({ text: newMessage }) }); setTicket(data.ticket); setNewMessage(""); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos enviar el mensaje."); }
    finally { setSaving(false); }
  }

  async function logout() { await api("/api/admin/session", { method: "DELETE" }).catch(() => undefined); router.replace("/admin/login"); }
  if (loading) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando ticket…</main>;
  if (!ticket) return <main className="flex flex-1 flex-col items-center justify-center px-6 py-24"><h1 className="font-heading text-3xl font-bold">Ticket no encontrado</h1><p className="mt-3 text-muted-foreground">{error}</p></main>;

  return (
    <main className="flex flex-1 flex-col px-6 py-12"><div className="mx-auto w-full max-w-3xl"><div className="mb-6 flex items-center justify-between"><Link href="/admin/tickets" className="text-sm text-muted-foreground hover:text-foreground">← Volver a tickets</Link><button onClick={logout} className="text-sm text-muted-foreground hover:text-destructive">Cerrar sesión</button></div><TicketCard ticket={ticket} onStatus={changeStatus} disabled={saving} /><section className="mb-6"><h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Conversación</h2>{ticket.messages.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">Sin mensajes aún.</div> : <div className="space-y-4">{ticket.messages.map((message) => <div key={message.id} className={`flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{message.senderName && <p className="mb-1 text-[10px] opacity-70">{message.senderName}</p>}<p>{message.text}</p><p className="mt-1 text-[10px] opacity-70">{new Date(message.timestamp).toLocaleString("es-US", { dateStyle: "short", timeStyle: "short" })}</p></div></div>)}</div>}</section>{error && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<form onSubmit={sendMessage} className="flex gap-3"><label htmlFor="admin-message" className="sr-only">Responder como administrador</label><input id="admin-message" type="text" value={newMessage} onChange={(event) => setNewMessage(event.target.value)} maxLength={1_000} placeholder="Responder como administrador…" className="h-12 min-w-0 flex-1 rounded-full border border-input bg-background px-6 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /><button type="submit" disabled={saving || !newMessage.trim()} className="h-12 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? "Guardando…" : "Enviar"}</button></form></div></main>
  );
}

function TicketCard({ ticket, onStatus, disabled }: { ticket: Ticket; onStatus: (status: TicketStatus) => void; disabled: boolean }) {
  return (
    <div className="mb-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</p><h1 className="font-heading text-2xl font-bold text-foreground">{ticket.clientName}</h1></div>
        <span className={`rounded-full px-4 py-1.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2"><p><span className="font-medium text-foreground">Tel.:</span> {ticket.phone}</p><p><span className="font-medium text-foreground">Ciudad:</span> {ticket.city}</p><p><span className="font-medium text-foreground">Ubicación:</span> {ticket.location}</p><p><span className="font-medium text-foreground">Creado:</span> {new Date(ticket.createdAt).toLocaleDateString("es-US")}</p>{ticket.referrer && <p><span className="font-medium text-foreground">Referido por:</span> {ticket.referrer.name} #{ticket.referrer.code}</p>}</div>
      <div className="mt-4 rounded-xl bg-muted p-4"><p className="text-sm font-medium text-foreground">Descripción:</p><p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p></div>
      {ticket.photos.length > 0 && <div className="mt-4"><p className="mb-2 text-sm font-medium text-foreground">Fotos adjuntas:</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{ticket.photos.map((photo, index) => <a key={photo} href={photo} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg border border-border"><Image src={photo} alt={`Foto adjunta ${index + 1}`} fill unoptimized sizes="(max-width: 640px) 33vw, 25vw" className="object-cover" /></a>)}</div></div>}
      <div className="mt-6 border-t border-border pt-4"><p className="mb-2 text-sm font-medium text-foreground">Cambiar estado:</p><div className="flex flex-wrap gap-2">{STATUSES.map((status) => <button key={status} type="button" onClick={() => onStatus(status)} disabled={disabled} className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${ticket.status === status ? `${STATUS_COLORS[status]} ring-2 ring-primary` : "border border-border bg-background text-muted-foreground hover:text-foreground"}`}>{STATUS_LABELS[status]}</button>)}</div></div>
    </div>
  );
}

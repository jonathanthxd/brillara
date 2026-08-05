"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { Partner, PartnerAppointment, PartnerLocation, PartnerPurchase } from "@/types/partner";
import { Ticket, TicketStatus } from "@/types/ticket";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

interface TicketResponse { ticket: Ticket }
interface OperationResponse { appointment: PartnerAppointment | null; purchase: PartnerPurchase | null }
interface PartnersResponse { partners: Partner[]; locations: PartnerLocation[] }
const STATUSES: TicketStatus[] = ["nuevo", "en-negociacion", "cancelado"];

function localDateTime(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export default function AdvisorTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [operation, setOperation] = useState<OperationResponse>({ appointment: null, purchase: null });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [locations, setLocations] = useState<PartnerLocation[]>([]);
  const [partnerId, setPartnerId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(localDateTime());
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [ticketData, operationData, partnersData] = await Promise.all([
          api<TicketResponse>(`/api/advisor/tickets/${params.id}`),
          api<OperationResponse>(`/api/advisor/tickets/${params.id}/appointment`),
          api<PartnersResponse>("/api/advisor/partners"),
        ]);
        setTicket(ticketData.ticket); setOperation(operationData); setPartners(partnersData.partners); setLocations(partnersData.locations);
        if (operationData.appointment) {
          setPartnerId(operationData.appointment.partnerId);
          setLocationId(operationData.appointment.locationId);
          setAppointmentNotes(operationData.appointment.notes ?? "");
          const date = new Date(operationData.appointment.scheduledAt); const offset = date.getTimezoneOffset() * 60_000;
          setScheduledAt(new Date(date.getTime() - offset).toISOString().slice(0, 16));
        }
      } catch (requestError) {
        if (requestError instanceof ClientApiError && requestError.status === 401) { router.replace("/asesor/login"); return; }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar el ticket.");
      } finally { setLoading(false); }
    }
    void load();
  }, [params.id, router]);

  const availableLocations = useMemo(() => locations.filter((location) => location.partnerId === partnerId && location.active), [locations, partnerId]);
  const isClosed = ticket?.status === "compra-realizada" || ticket?.status === "no-concretado" || ticket?.status === "archivado";

  async function changeStatus(status: TicketStatus) {
    if (!ticket || saving || isClosed) return;
    setSaving(true); setError(""); setNotice("");
    try { const data = await api<TicketResponse>(`/api/advisor/tickets/${ticket.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setTicket(data.ticket); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos actualizar el estado."); }
    finally { setSaving(false); }
  }

  async function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!ticket || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const data = await api<OperationResponse>(`/api/advisor/tickets/${ticket.id}/appointment`, { method: "POST", body: JSON.stringify({ partnerId, locationId, scheduledAt: new Date(scheduledAt).toISOString(), notes: appointmentNotes }) });
      setOperation(data);
      const refreshed = await api<TicketResponse>(`/api/advisor/tickets/${ticket.id}`); setTicket(refreshed.ticket);
      setNotice("Cita programada. El ticket ya aparece para el partner seleccionado.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos programar la cita."); }
    finally { setSaving(false); }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!ticket || !newMessage.trim() || saving) return;
    setSaving(true); setError("");
    try { const data = await api<TicketResponse>(`/api/advisor/tickets/${ticket.id}/messages`, { method: "POST", body: JSON.stringify({ text: newMessage }) }); setTicket(data.ticket); setNewMessage(""); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos enviar el mensaje."); }
    finally { setSaving(false); }
  }
  async function logout() { await api("/api/advisor/session", { method: "DELETE" }).catch(() => undefined); router.replace("/asesor/login"); }
  if (loading) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando ticket…</main>;
  if (!ticket) return <main className="flex flex-1 flex-col items-center justify-center px-6 py-24"><h1 className="font-heading text-3xl font-bold">Ticket no encontrado</h1><p className="mt-3 text-muted-foreground">{error}</p></main>;

  return <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto w-full max-w-4xl"><div className="mb-6 flex items-center justify-between"><Link href="/asesor" className="text-sm text-muted-foreground hover:text-foreground">← Volver al panel</Link><button onClick={logout} className="text-sm text-muted-foreground hover:text-destructive">Cerrar sesión</button></div><section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</p><h1 className="font-heading text-2xl font-bold text-foreground">{ticket.clientName}</h1></div><span className={`rounded-full px-4 py-1.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span></div><div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2"><p><span className="font-medium text-foreground">Tel.:</span> {ticket.phone}</p><p><span className="font-medium text-foreground">Ciudad:</span> {ticket.city}</p><p><span className="font-medium text-foreground">Ubicación:</span> {ticket.location}</p><p><span className="font-medium text-foreground">Creado:</span> {new Date(ticket.createdAt).toLocaleDateString("es-US")}</p>{ticket.referrer && <p><span className="font-medium text-foreground">Referido por:</span> {ticket.referrer.name} #{ticket.referrer.code}</p>}</div><div className="mt-4 rounded-xl bg-muted p-4"><p className="text-sm font-medium text-foreground">Descripción:</p><p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p></div>{ticket.photos.length > 0 && <div className="mt-4"><p className="mb-2 text-sm font-medium text-foreground">Fotos adjuntas:</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{ticket.photos.map((photo, index) => <a key={photo} href={photo} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg border border-border"><Image src={photo} alt={`Foto adjunta ${index + 1}`} fill unoptimized sizes="(max-width: 640px) 33vw, 25vw" className="object-cover" /></a>)}</div></div>}{!isClosed && <div className="mt-6 border-t border-border pt-4"><p className="mb-2 text-sm font-medium text-foreground">Cambiar estado de seguimiento:</p><div className="flex flex-wrap gap-2">{STATUSES.map((status) => <button key={status} type="button" disabled={saving} onClick={() => changeStatus(status)} className={`rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-50 ${ticket.status === status ? `${STATUS_COLORS[status]} ring-2 ring-primary` : "border border-border bg-background text-muted-foreground hover:text-foreground"}`}>{STATUS_LABELS[status]}</button>)}</div><p className="mt-3 text-xs text-muted-foreground">La compra solo puede ser confirmada por el partner después de la visita presencial.</p></div>}</section>
  {!isClosed && <section className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-sm sm:p-7"><h2 className="font-heading text-2xl font-semibold text-foreground">Programar visita presencial</h2><p className="mt-1 text-sm text-muted-foreground">El partner seleccionado verá este ticket al guardar la cita.</p><form onSubmit={schedule} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><span className="block text-sm font-medium text-foreground">Partner</span><select value={partnerId} onChange={(event) => { setPartnerId(event.target.value); setLocationId(""); }} className="input" required><option value="">Selecciona un partner</option>{partners.filter((partner) => partner.active).map((partner) => <option key={partner.id} value={partner.id}>{partner.name} · {partner.type}</option>)}</select></label><label className="space-y-1.5"><span className="block text-sm font-medium text-foreground">Sucursal</span><select value={locationId} onChange={(event) => setLocationId(event.target.value)} className="input" required disabled={!partnerId}><option value="">Selecciona una sucursal</option>{availableLocations.map((location) => <option key={location.id} value={location.id}>{location.name}{location.city ? ` · ${location.city}` : ""}</option>)}</select></label><label className="space-y-1.5"><span className="block text-sm font-medium text-foreground">Fecha y hora</span><input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="input" required /></label><div className="hidden sm:block" /><label className="space-y-1.5 sm:col-span-2"><span className="block text-sm font-medium text-foreground">Notas para la visita</span><textarea value={appointmentNotes} onChange={(event) => setAppointmentNotes(event.target.value)} className="min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary" maxLength={1000} placeholder="Información útil para el partner" /></label><div className="sm:col-span-2"><button type="submit" disabled={saving || !partnerId || !locationId} className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Guardando…" : operation.appointment ? "Reprogramar cita" : "Programar cita"}</button></div></form>{operation.appointment && <p className="mt-4 rounded-xl border border-border bg-background/70 p-3 text-sm text-muted-foreground">Cita actual: <strong className="text-foreground">{new Date(operation.appointment.scheduledAt).toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" })}</strong>. Estado de visita: {operation.appointment.status.replaceAll("-", " ")}.</p>}</section>}
  {operation.purchase && <section className="mt-6 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5 shadow-sm"><h2 className="font-heading text-2xl font-semibold text-foreground">Resultado del partner</h2><p className="mt-2 text-sm text-muted-foreground">Compra confirmada: {operation.purchase.metal} {operation.purchase.purity}, {operation.purchase.netWeightGrams} g netos, total pagado {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(operation.purchase.totalPaid)}.</p></section>}
  {notice && <p role="status" className="mt-6 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-foreground">{notice}</p>}{error && <p role="alert" className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}<section className="mt-6"><h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Conversación</h2>{ticket.messages.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">Sin mensajes aún.</div> : <div className="space-y-4">{ticket.messages.map((message) => <div key={message.id} className={`flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{message.senderName && <p className="mb-1 text-[10px] opacity-70">{message.senderName}</p>}<p>{message.text}</p><p className="mt-1 text-[10px] opacity-70">{new Date(message.timestamp).toLocaleString("es-US", { dateStyle: "short", timeStyle: "short" })}</p></div></div>)}</div>}</section><form onSubmit={sendMessage} className="mt-5 flex gap-3"><label htmlFor="advisor-message" className="sr-only">Responder como asesor</label><input id="advisor-message" type="text" value={newMessage} onChange={(event) => setNewMessage(event.target.value)} maxLength={1000} placeholder="Responder como asesor…" className="h-12 min-w-0 flex-1 rounded-full border border-input bg-background px-6 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /><button type="submit" disabled={saving || !newMessage.trim()} className="h-12 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? "Guardando…" : "Enviar"}</button></form></div></main>;
}

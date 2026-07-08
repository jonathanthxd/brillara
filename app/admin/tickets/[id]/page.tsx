"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { isAdminLoggedIn, logoutAdmin } from "@/services/admin";
import { getTicketById, addMessage, updateTicketStatus } from "@/services/tickets";
import { Ticket, TicketStatus } from "@/types/ticket";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/ticket-helpers";

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAdminLoggedIn()) {
      router.push("/admin/login");
      return;
    }
    const id = params.id as string;
    const t = getTicketById(id);
    if (t) setTicket(t);
  }, [params.id, router]);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket || !newMessage.trim()) return;
    const updated = addMessage(ticket.id, { sender: "admin", text: newMessage.trim() });
    if (updated) {
      setTicket(updated);
      setNewMessage("");
    }
  }

  function handleChangeStatus(newStatus: TicketStatus) {
    if (!ticket) return;
    const updated = updateTicketStatus(ticket.id, newStatus);
    if (updated) setTicket(updated);
  }

  if (!mounted) return null;
  if (!ticket) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <h1 className="font-heading text-3xl font-bold text-foreground">Ticket no encontrado</h1>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/tickets" className="text-sm text-muted-foreground hover:text-foreground">← Volver a tickets</Link>
          <button
            onClick={() => { logoutAdmin(); router.push("/admin/login"); }}
            className="text-sm text-muted-foreground hover:text-destructive"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-muted-foreground">#{ticket.id}</p>
              <h1 className="font-heading text-2xl font-bold text-foreground">{ticket.clientName}</h1>
            </div>
            <span className={`rounded-full px-4 py-1.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
              {STATUS_LABELS[ticket.status]}
            </span>
          </div>
          
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p><span className="font-medium text-foreground">Tel:</span> {ticket.phone}</p>
            <p><span className="font-medium text-foreground">Ciudad:</span> {ticket.city}</p>
            <p><span className="font-medium text-foreground">Ubicación:</span> {ticket.location}</p>
            <p><span className="font-medium text-foreground">Creado:</span> {new Date(ticket.createdAt).toLocaleDateString("es-US")}</p>
          </div>

          <div className="mt-4 rounded-xl bg-muted p-4">
            <p className="text-sm font-medium text-foreground">Descripción:</p>
            <p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>
          </div>

          {ticket.photos.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-foreground">Fotos adjuntas:</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {ticket.photos.map((photo, i) => (
                  <img key={i} src={photo} alt="" className="aspect-square rounded-lg border border-border object-cover" />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-2 text-sm font-medium text-foreground">Cambiar estado:</p>
            <div className="flex flex-wrap gap-2">
              {(["nuevo", "en-negociacion", "cita-programada", "compra-realizada", "cancelado", "archivado"] as TicketStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleChangeStatus(s)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    ticket.status === s
                      ? `${STATUS_COLORS[s]} ring-2 ring-offset-2 ring-offset-background ring-primary`
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="mb-6">
          <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Conversación</h2>
          {ticket.messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Sin mensajes aún. Escribe el primero.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ticket.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    <p>{msg.text}</p>
                    <p className={`mt-1 text-[10px] ${msg.sender === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Responder como administrador..."
            className="h-12 flex-1 rounded-full border border-input bg-background px-6 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="h-12 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </main>
  );
}

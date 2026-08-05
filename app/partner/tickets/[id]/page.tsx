"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-helpers";
import { PartnerOutcome, PartnerTicketDetail } from "@/types/partner";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Action = "purchase" | "outcome" | "problem" | null;

interface PurchaseForm {
  metal: string;
  purity: string;
  grossWeightGrams: string;
  netWeightGrams: string;
  pricePerGram: string;
  totalPaid: string;
  totalExplanation: string;
  paymentMethod: "cash" | "check" | "zelle" | "venmo" | "bank_transfer" | "other";
  paymentReference: string;
  employeeName: string;
  notes: string;
  receiptUrl: string;
  confirmedAt: string;
}

const initialPurchase: PurchaseForm = {
  metal: "Oro", purity: "", grossWeightGrams: "", netWeightGrams: "", pricePerGram: "", totalPaid: "", totalExplanation: "", paymentMethod: "cash", paymentReference: "", employeeName: "", notes: "", receiptUrl: "", confirmedAt: localDateTime(),
};

const OUTCOMES: { value: PartnerOutcome; label: string }[] = [
  { value: "no_show", label: "El cliente no asistió" },
  { value: "rejected_offer", label: "El cliente rechazó la oferta" },
  { value: "not_authentic", label: "El metal no era auténtico" },
  { value: "purity_mismatch", label: "La pureza no coincidía" },
  { value: "price_disagreement", label: "No se llegó a acuerdo de precio" },
  { value: "return_later", label: "El cliente regresará después" },
  { value: "rescheduled", label: "La cita fue reprogramada" },
  { value: "requirements_not_met", label: "El artículo no cumplía requisitos" },
  { value: "duplicate_ticket", label: "Ticket duplicado" },
  { value: "other", label: "Otro motivo" },
];

function localDateTime(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function eventLabel(value: string): string {
  const labels: Record<string, string> = {
    appointment_scheduled: "Cita programada",
    appointment_rescheduled: "Cita reprogramada",
    purchase_confirmed: "Compra confirmada",
    partner_outcome_recorded: "Resultado presencial registrado",
    partner_problem_reported: "Problema enviado a revisión",
    purchase_voided: "Compra anulada",
    purchase_corrected: "Compra corregida por administración",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

export default function PartnerTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<PartnerTicketDetail | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [purchase, setPurchase] = useState<PurchaseForm>(initialPurchase);
  const [outcome, setOutcome] = useState<PartnerOutcome>("no_show");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [rescheduledAt, setRescheduledAt] = useState("");
  const [problemCategory, setProblemCategory] = useState("Información incorrecta");
  const [problemNotes, setProblemNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void api<PartnerTicketDetail>(`/api/partner/tickets/${params.id}`)
      .then(setDetail)
      .catch((requestError) => {
        if (requestError instanceof ClientApiError && requestError.status === 401) { router.replace("/partner/login"); return; }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar el ticket.");
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const calculated = useMemo(() => {
    const net = Number(purchase.netWeightGrams);
    const price = Number(purchase.pricePerGram);
    return Number.isFinite(net) && Number.isFinite(price) ? Math.round(net * price * 100) / 100 : 0;
  }, [purchase.netWeightGrams, purchase.pricePerGram]);
  const totalDifference = useMemo(() => Math.abs((Number(purchase.totalPaid) || 0) - calculated), [calculated, purchase.totalPaid]);
  const canAct = Boolean(detail?.appointment && !detail.purchase && ["programada", "pendiente-confirmacion"].includes(detail.appointment.status));

  async function confirmPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail?.appointment || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const next = await api<PartnerTicketDetail>(`/api/partner/tickets/${detail.ticket.id}/purchase`, { method: "POST", body: JSON.stringify({ appointmentId: detail.appointment.id, ...purchase, confirmedAt: new Date(purchase.confirmedAt).toISOString() }) });
      setDetail(next); setAction(null); setNotice("Compra confirmada y registrada de forma permanente.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos confirmar la compra."); }
    finally { setSaving(false); }
  }

  async function submitOutcome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail?.appointment || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const next = await api<PartnerTicketDetail>(`/api/partner/tickets/${detail.ticket.id}/outcome`, { method: "POST", body: JSON.stringify({ appointmentId: detail.appointment.id, outcome, notes: outcomeNotes, rescheduledAt: outcome === "rescheduled" ? new Date(rescheduledAt).toISOString() : null }) });
      setDetail(next); setAction(null); setNotice("Resultado presencial registrado.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos registrar el resultado."); }
    finally { setSaving(false); }
  }

  async function submitProblem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail?.appointment || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const next = await api<PartnerTicketDetail>(`/api/partner/tickets/${detail.ticket.id}/problem`, { method: "POST", body: JSON.stringify({ appointmentId: detail.appointment.id, category: problemCategory, notes: problemNotes }) });
      setDetail(next); setAction(null); setNotice("El ticket fue enviado a revisión administrativa.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos reportar el problema."); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando ticket…</main>;
  if (!detail) return <main className="flex flex-1 flex-col items-center justify-center px-6 py-24"><h1 className="font-heading text-3xl font-bold">Ticket no encontrado</h1><p className="mt-3 text-muted-foreground">{error}</p></main>;
  const { ticket, appointment, purchase: completedPurchase, events } = detail;

  return <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto w-full max-w-5xl"><div className="mb-6 flex items-center justify-between"><Link href="/partner" className="text-sm font-medium text-primary hover:underline">← Volver al portal</Link><Link href="/partner/history" className="text-sm text-muted-foreground hover:text-foreground">Historial</Link></div><section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-xs text-muted-foreground">#{ticket.ticketNumber}</p><h1 className="mt-1 font-heading text-3xl font-bold text-foreground">{ticket.clientName}</h1><p className="mt-1 text-sm text-muted-foreground">{ticket.phone} · {ticket.city}</p></div><span className={`w-fit rounded-full px-4 py-1.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span></div><div className="mt-6 grid gap-3 text-sm sm:grid-cols-2"><Info label="Cita" value={appointment ? new Date(appointment.scheduledAt).toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" }) : "No registrada"} /><Info label="Asesor" value={ticket.advisor ? `${ticket.advisor.name} #${ticket.advisor.code}` : "Sin asesor"} /><Info label="Referido" value={ticket.referrer ? `${ticket.referrer.name} #${ticket.referrer.code}` : "Sin referido"} /><Info label="Sucursal" value={ticket.partnerLocation ? `${ticket.partnerLocation.name}${ticket.partnerLocation.city ? ` · ${ticket.partnerLocation.city}` : ""}` : "No asignada"} /></div><div className="mt-5 rounded-2xl bg-muted/65 p-4"><p className="text-sm font-medium text-foreground">Metal descrito por el cliente</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ticket.description}</p>{appointment?.notes && <><p className="mt-4 text-sm font-medium text-foreground">Notas de la cita</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{appointment.notes}</p></>}</div>{ticket.photos.length > 0 && <div className="mt-5"><p className="mb-2 text-sm font-medium text-foreground">Fotografías proporcionadas</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{ticket.photos.map((photo, index) => <a key={photo} href={photo} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-xl border border-border"><Image src={photo} alt={`Foto del ticket ${index + 1}`} fill unoptimized sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" /></a>)}</div></div>}</section>
  {canAct && <section className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-sm sm:p-7"><h2 className="font-heading text-2xl font-semibold text-foreground">Certificar resultado presencial</h2><p className="mt-1 text-sm text-muted-foreground">Estas acciones quedan registradas. No hay un selector libre de estados.</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => setAction("purchase")} className={`rounded-full px-4 py-2 text-sm font-semibold ${action === "purchase" ? "bg-primary text-primary-foreground" : "border border-primary/30 bg-background text-primary"}`}>Confirmar compra</button><button type="button" onClick={() => setAction("outcome")} className={`rounded-full px-4 py-2 text-sm font-semibold ${action === "outcome" ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"}`}>No se realizó la compra</button><button type="button" onClick={() => setAction("problem")} className={`rounded-full px-4 py-2 text-sm font-semibold ${action === "problem" ? "bg-destructive text-primary-foreground" : "border border-destructive/30 bg-background text-destructive"}`}>Reportar problema</button></div>{action === "purchase" && <PurchaseForm form={purchase} setForm={setPurchase} calculated={calculated} difference={totalDifference} saving={saving} onSubmit={confirmPurchase} />}{action === "outcome" && <OutcomeForm outcome={outcome} setOutcome={setOutcome} notes={outcomeNotes} setNotes={setOutcomeNotes} rescheduledAt={rescheduledAt} setRescheduledAt={setRescheduledAt} saving={saving} onSubmit={submitOutcome} />}{action === "problem" && <ProblemForm category={problemCategory} setCategory={setProblemCategory} notes={problemNotes} setNotes={setProblemNotes} saving={saving} onSubmit={submitProblem} />}</section>}
  {completedPurchase && <PurchaseSummary purchase={completedPurchase} />}
  <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><h2 className="font-heading text-2xl font-semibold text-foreground">Historial auditable</h2>{events.length === 0 ? <p className="mt-4 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">Sin eventos registrados aún.</p> : <div className="mt-5 space-y-3">{events.map((event) => <div key={event.id} className="rounded-2xl border border-border bg-background/50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium text-foreground">{eventLabel(event.eventType)}</p><time className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" })}</time></div><p className="mt-1 text-xs text-muted-foreground">{event.actorName ?? event.actorType}</p>{typeof event.details.notes === "string" && <p className="mt-2 text-sm text-muted-foreground">{event.details.notes}</p>}</div>)}</div>}</section>{notice && <p role="status" className="mt-5 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-foreground">{notice}</p>}{error && <p role="alert" className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}</div></main>;
}

function Info({ label, value }: { label: string; value: string }) { return <p className="rounded-xl border border-border bg-background/60 p-3"><span className="block text-xs text-muted-foreground">{label}</span><span className="mt-1 block font-medium text-foreground">{value}</span></p>; }

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5"><span className="block text-sm font-medium text-foreground">{label}</span>{children}</label>; }

function PurchaseForm({ form, setForm, calculated, difference, saving, onSubmit }: { form: PurchaseForm; setForm: (form: PurchaseForm) => void; calculated: number; difference: number; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const update = (field: keyof PurchaseForm, value: string) => setForm({ ...form, [field]: value });
  return <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-primary/20 bg-background/75 p-4 sm:p-5"><h3 className="font-heading text-xl font-semibold text-foreground">Datos de la compra</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="Tipo de metal"><input value={form.metal} onChange={(event) => update("metal", event.target.value)} className="input" maxLength={80} required /></Field><Field label="Pureza o kilataje"><input value={form.purity} onChange={(event) => update("purity", event.target.value)} className="input" maxLength={60} placeholder="Ej. 14K / .925" required /></Field><Field label="Peso bruto (g)"><input type="number" min="0.0001" step="0.0001" value={form.grossWeightGrams} onChange={(event) => update("grossWeightGrams", event.target.value)} className="input" required /></Field><Field label="Peso neto (g)"><input type="number" min="0.0001" step="0.0001" value={form.netWeightGrams} onChange={(event) => update("netWeightGrams", event.target.value)} className="input" required /></Field><Field label="Precio por gramo (USD)"><input type="number" min="0" step="0.0001" value={form.pricePerGram} onChange={(event) => update("pricePerGram", event.target.value)} className="input" required /></Field><Field label="Total pagado (USD)"><input type="number" min="0" step="0.01" value={form.totalPaid} onChange={(event) => update("totalPaid", event.target.value)} className="input" required /></Field></div><div className="rounded-xl border border-border bg-muted/60 p-3 text-sm"><p className="text-muted-foreground">Cálculo del sistema</p><p className="mt-1 font-heading text-xl font-semibold text-foreground">{money(calculated)}</p>{difference > 0.01 && <p className="mt-1 text-xs text-amber-700">El total pagado difiere {money(difference)}. Debes explicar la diferencia.</p>}</div>{difference > 0.01 && <Field label="Explicación de la diferencia"><textarea value={form.totalExplanation} onChange={(event) => update("totalExplanation", event.target.value)} className="min-h-20 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary" maxLength={500} required /></Field>}<div className="grid gap-4 sm:grid-cols-2"><Field label="Método de pago"><select value={form.paymentMethod} onChange={(event) => update("paymentMethod", event.target.value)} className="input"><option value="cash">Efectivo</option><option value="check">Cheque</option><option value="zelle">Zelle</option><option value="venmo">Venmo</option><option value="bank_transfer">Transferencia bancaria</option><option value="other">Otro</option></select></Field><Field label="Referencia de pago (opcional)"><input value={form.paymentReference} onChange={(event) => update("paymentReference", event.target.value)} className="input" maxLength={160} /></Field><Field label="Empleado que realizó la compra"><input value={form.employeeName} onChange={(event) => update("employeeName", event.target.value)} className="input" maxLength={80} placeholder="Opcional si eres tú" /></Field><Field label="Fecha y hora de compra"><input type="datetime-local" value={form.confirmedAt} onChange={(event) => update("confirmedAt", event.target.value)} className="input" required /></Field></div><Field label="Observaciones (opcional)"><textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} className="min-h-20 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary" maxLength={2000} /></Field><Field label="URL de comprobante o imagen (opcional)"><input value={form.receiptUrl} onChange={(event) => update("receiptUrl", event.target.value)} className="input" maxLength={2_800_000} placeholder="https://…" /></Field><button type="submit" disabled={saving} className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Confirmando…" : "Confirmar compra de forma oficial"}</button></form>;
}

function OutcomeForm({ outcome, setOutcome, notes, setNotes, rescheduledAt, setRescheduledAt, saving, onSubmit }: { outcome: PartnerOutcome; setOutcome: (value: PartnerOutcome) => void; notes: string; setNotes: (value: string) => void; rescheduledAt: string; setRescheduledAt: (value: string) => void; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-border bg-background/75 p-4 sm:p-5"><h3 className="font-heading text-xl font-semibold text-foreground">Resultado sin compra</h3><Field label="Motivo"><select value={outcome} onChange={(event) => setOutcome(event.target.value as PartnerOutcome)} className="input">{OUTCOMES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>{outcome === "rescheduled" && <Field label="Nueva fecha y hora"><input type="datetime-local" value={rescheduledAt} onChange={(event) => setRescheduledAt(event.target.value)} className="input" required /></Field>}<Field label="Notas relevantes (opcional)"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-20 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary" maxLength={1000} /></Field><button type="submit" disabled={saving} className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Guardando…" : "Registrar resultado"}</button></form>;
}

function ProblemForm({ category, setCategory, notes, setNotes, saving, onSubmit }: { category: string; setCategory: (value: string) => void; notes: string; setNotes: (value: string) => void; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-destructive/25 bg-background/75 p-4 sm:p-5"><h3 className="font-heading text-xl font-semibold text-foreground">Enviar a revisión administrativa</h3><Field label="Tipo de problema"><select value={category} onChange={(event) => setCategory(event.target.value)} className="input"><option>El cliente no coincide</option><option>Información incorrecta</option><option>Cita de otra sucursal</option><option>Metal ya vendido</option><option>Disputa</option><option>Ticket duplicado</option><option>Otro</option></select></Field><Field label="Explicación"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary" minLength={5} maxLength={1000} required /></Field><button type="submit" disabled={saving} className="h-11 rounded-full bg-destructive px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Enviando…" : "Reportar problema"}</button></form>;
}

function PurchaseSummary({ purchase }: { purchase: NonNullable<PartnerTicketDetail["purchase"]> }) {
  return <section className="mt-6 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5 shadow-sm sm:p-7"><h2 className="font-heading text-2xl font-semibold text-foreground">Compra registrada</h2><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><Info label="Metal" value={`${purchase.metal} · ${purchase.purity}`} /><Info label="Peso neto" value={`${purchase.netWeightGrams} g`} /><Info label="Total pagado" value={money(purchase.totalPaid)} /><Info label="Confirmada" value={new Date(purchase.confirmedAt).toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" })} /></div>{purchase.voidedAt && <p className="mt-4 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">Compra anulada: {purchase.voidReason ?? "Sin motivo registrado"}</p>}</section>;
}

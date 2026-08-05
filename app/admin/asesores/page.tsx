"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { Advisor } from "@/types/advisor";
import { Copy, KeyRound, Link2, MousePointerClick, Pencil, Plus, ShoppingBag, ShieldCheck, TicketCheck, Trash2, UserCheck, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AdvisorsResponse {
  advisors: Advisor[];
}

interface AdvisorResponse {
  advisor: Advisor;
}

interface ReferralReport {
  advisorId: string;
  advisorCode: string;
  advisorName: string;
  referralCode: string;
  shareUrl: string;
  uniqueVisitors: number;
  registeredLeads: number;
  ticketsCreated: number;
  purchasesCompleted: number;
}

interface ReferralReportsResponse {
  reports: ReferralReport[];
}

interface AdvisorForm {
  name: string;
  code: string;
  password: string;
}

const EMPTY_FORM: AdvisorForm = { name: "", code: "", password: "" };

function displayDate(value: string | null): string {
  if (!value) return "Disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Disponible";
  return new Intl.DateTimeFormat("es-US", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export default function AdvisorManagementPage() {
  const router = useRouter();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [reports, setReports] = useState<ReferralReport[]>([]);
  const [form, setForm] = useState<AdvisorForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [advisorData, reportData] = await Promise.all([
          api<AdvisorsResponse>("/api/admin/advisors"),
          api<ReferralReportsResponse>("/api/admin/referrals"),
        ]);
        setAdvisors(advisorData.advisors);
        setReports(reportData.reports);
      } catch (requestError) {
        if (requestError instanceof ClientApiError && requestError.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar los asesores.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEditing(advisor: Advisor) {
    setEditingId(advisor.id);
    setForm({ name: advisor.name, code: advisor.code, password: "" });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingId) {
        const data = await api<AdvisorResponse>(`/api/admin/advisors/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        setAdvisors((current) => current.map((advisor) => advisor.id === editingId ? data.advisor : advisor));
        setNotice("Asesor actualizado. La contraseña solo cambió si escribiste una nueva.");
      } else {
        const data = await api<AdvisorResponse>("/api/admin/advisors", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setAdvisors((current) => [...current, data.advisor].sort((a, b) => a.name.localeCompare(b.name, "es")));
        setNotice("Asesor creado. Ya puede iniciar sesión con su código y contraseña.");
      }
      resetForm();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos guardar el asesor.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAdvisor(advisor: Advisor) {
    const confirmed = window.confirm(
      `¿Eliminar a ${advisor.name}? Sus tickets quedarán sin asesor asignado y su sesión dejará de funcionar.`,
    );
    if (!confirmed) return;

    setDeletingId(advisor.id);
    setError("");
    setNotice("");
    try {
      await api(`/api/admin/advisors/${advisor.id}`, { method: "DELETE" });
      setAdvisors((current) => current.filter((item) => item.id !== advisor.id));
      if (editingId === advisor.id) resetForm();
      setNotice("Asesor eliminado y tickets liberados.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos eliminar el asesor.");
    } finally {
      setDeletingId(null);
    }
  }

  async function copyReferralLink(advisor: Advisor, report?: ReferralReport) {
    const url = report?.shareUrl ?? `https://www.brillara.gold/r/${encodeURIComponent(advisor.referralCode)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(advisor.id);
      window.setTimeout(() => setCopiedId((current) => current === advisor.id ? null : current), 2_000);
    } catch {
      setError("No pudimos copiar el enlace. Puedes seleccionarlo y copiarlo manualmente.");
    }
  }

  if (loading) {
    return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando equipo…</main>;
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-medium text-primary transition-colors hover:underline">← Volver al panel</Link>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UsersRound className="size-5" aria-hidden /></span>
              <div>
                <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Equipo de asesores</h1>
                <p className="mt-1 text-muted-foreground">Crea accesos, actualiza credenciales y administra quién atiende tickets.</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <span className="font-heading text-2xl font-bold text-foreground">{advisors.length}</span> asesores activos
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="h-fit rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {editingId ? <Pencil className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              </span>
              <div>
                <h2 className="font-heading text-2xl font-semibold text-foreground">{editingId ? "Editar asesor" : "Nuevo asesor"}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {editingId ? "Deja la contraseña en blanco si debe conservar la actual." : "La contraseña no se mostrará ni se guardará en texto visible."}
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="Nombre completo" htmlFor="advisor-name">
                <input id="advisor-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" maxLength={80} className="input" placeholder="Ej.: Valeria Montes" required />
              </Field>
              <Field label="Código de acceso" htmlFor="advisor-code">
                <input id="advisor-code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} autoComplete="username" minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" className="input font-mono" placeholder="Ej.: 10001" required />
                <p className="text-xs text-muted-foreground">Usa letras, números, guiones o guiones bajos. Al crear el asesor, este código también genera su enlace público permanente.</p>
              </Field>
              <Field label={editingId ? "Nueva contraseña (opcional)" : "Contraseña temporal"} htmlFor="advisor-password">
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <input id="advisor-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete={editingId ? "new-password" : "new-password"} minLength={editingId ? undefined : 8} maxLength={256} className="input pl-11" placeholder={editingId ? "Conservar contraseña actual" : "Mínimo 8 caracteres"} required={!editingId} />
                </div>
                <p className="text-xs text-muted-foreground">Debe incluir al menos una letra y un número.</p>
              </Field>
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                  {editingId ? <Pencil className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
                  {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear asesor"}
                </button>
                {editingId && <button type="button" onClick={resetForm} disabled={saving} className="h-11 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50">Cancelar</button>}
              </div>
            </form>

            <div className="mt-6 flex gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <p>Las contraseñas se convierten en hashes dentro de Supabase. El panel no las puede recuperar después de guardarlas.</p>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold text-foreground">Asesores activos</h2>
              <span className="text-sm text-muted-foreground">{advisors.length === 1 ? "1 acceso" : `${advisors.length} accesos`}</span>
            </div>
            {advisors.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><UserRound className="size-5" aria-hidden /></span>
                <h3 className="mt-4 font-heading text-xl font-semibold text-foreground">Aún no hay asesores</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Crea el primer acceso con el formulario. Podrá entrar inmediatamente en <span className="font-mono text-foreground">/asesor/login</span>.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {advisors.map((advisor) => {
                  const report = reports.find((item) => item.advisorId === advisor.id);
                  const shareUrl = report?.shareUrl ?? `https://www.brillara.gold/r/${encodeURIComponent(advisor.referralCode)}`;
                  return (
                    <article key={advisor.id} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted font-heading text-lg font-semibold text-primary">{advisor.name.slice(0, 1).toUpperCase()}</span>
                        <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-xs font-medium text-muted-foreground">{advisor.code}</span>
                      </div>
                      <h3 className="mt-4 truncate font-heading text-xl font-semibold text-foreground" title={advisor.name}>{advisor.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Creado: {displayDate(advisor.createdAt)}</p>
                      <div className="mt-4 rounded-xl border border-border bg-muted/35 p-3">
                        <div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Link2 className="size-3.5 text-primary" aria-hidden /> Enlace de referido</span><button type="button" onClick={() => copyReferralLink(advisor, report)} className="inline-flex h-7 items-center gap-1 rounded-full bg-background px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"><Copy className="size-3" aria-hidden />{copiedId === advisor.id ? "Copiado" : "Copiar"}</button></div>
                        <code className="mt-2 block truncate text-xs text-foreground" title={shareUrl}>{shareUrl}</code>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><Metric label="Visitas" value={report?.uniqueVisitors ?? 0} icon={<MousePointerClick className="size-3" aria-hidden />} /><Metric label="Registrados" value={report?.registeredLeads ?? 0} icon={<UserCheck className="size-3" aria-hidden />} /><Metric label="Tickets" value={report?.ticketsCreated ?? 0} icon={<TicketCheck className="size-3" aria-hidden />} /><Metric label="Compras" value={report?.purchasesCompleted ?? 0} icon={<ShoppingBag className="size-3" aria-hidden />} /></div>
                      <div className="mt-5 flex gap-2">
                        <button type="button" onClick={() => startEditing(advisor)} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-border text-xs font-medium text-foreground transition-colors hover:bg-accent"><Pencil className="size-3.5" aria-hidden /> Editar</button>
                        <button type="button" disabled={deletingId === advisor.id} onClick={() => deleteAdvisor(advisor)} className="inline-flex size-9 items-center justify-center rounded-full border border-destructive/20 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50" aria-label={`Eliminar a ${advisor.name}`} title="Eliminar asesor"><Trash2 className="size-3.5" aria-hidden /></button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {notice && <p role="status" className="mt-6 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-foreground">{notice}</p>}
        {error && <p role="alert" className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      </div>
    </main>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-lg bg-muted/70 px-2.5 py-2"><p className="flex items-center gap-1 text-muted-foreground">{icon}{label}</p><p className="mt-1 font-heading text-lg font-semibold text-foreground">{value}</p></div>;
}

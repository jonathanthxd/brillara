"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { Partner, PartnerLocation, PartnerRole, PartnerUser } from "@/types/partner";
import { Ban, CheckCircle2, ChevronRight, MapPin, Pencil, Plus, ShoppingBag, Store, UserCog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

interface PartnerReport {
  partnerId: string;
  locationsCount: number;
  usersCount: number;
  pendingAppointments: number;
  confirmedPurchases: number;
  noConcretadas: number;
  problemsInReview: number;
  volumeGrams: number;
  totalPaid: number;
  lastLoginAt: string | null;
}
interface PartnerResponse { partner: Partner }
interface LocationResponse { location: PartnerLocation }
interface UserResponse { user: PartnerUser }
interface ManagementResponse { partners: Partner[]; locations: PartnerLocation[]; users: PartnerUser[]; reports: PartnerReport[] }
interface PurchaseRow { purchase: { id: string; totalPaid: number; netWeightGrams: number; confirmedAt: string; voidedAt: string | null; voidReason: string | null; notes: string | null }; ticket: { number: string; clientName: string; referrerName: string | null; referrerCode: string | null } | null; partnerName: string; locationName: string; confirmedBy: string }
interface PurchasesResponse { purchases: PurchaseRow[] }

interface PartnerForm { name: string; type: string; phone: string; email: string; active: boolean }
interface LocationForm { name: string; address: string; city: string; timezone: string; active: boolean }
interface UserForm { name: string; code: string; password: string; role: PartnerRole; locationId: string; active: boolean }

const EMPTY_PARTNER: PartnerForm = { name: "", type: "Joyería", phone: "", email: "", active: true };
const EMPTY_LOCATION: LocationForm = { name: "", address: "", city: "", timezone: "America/Los_Angeles", active: true };
const EMPTY_USER: UserForm = { name: "", code: "", password: "", role: "buyer", locationId: "", active: true };

function date(value: string | null): string { return value ? new Intl.DateTimeFormat("es-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin acceso aún"; }
function money(value: number): string { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value); }

export default function PartnerManagementPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [locations, setLocations] = useState<PartnerLocation[]>([]);
  const [users, setUsers] = useState<PartnerUser[]>([]);
  const [reports, setReports] = useState<PartnerReport[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [partnerForm, setPartnerForm] = useState<PartnerForm>(EMPTY_PARTNER);
  const [locationForm, setLocationForm] = useState<LocationForm>(EMPTY_LOCATION);
  const [userForm, setUserForm] = useState<UserForm>(EMPTY_USER);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const [management, purchaseData] = await Promise.all([
      api<ManagementResponse>("/api/admin/partners"),
      api<PurchasesResponse>("/api/admin/purchases?limit=30"),
    ]);
    setPartners(management.partners); setLocations(management.locations); setUsers(management.users); setReports(management.reports); setPurchases(purchaseData.purchases);
    setSelectedId((current) => current && management.partners.some((partner) => partner.id === current) ? current : management.partners[0]?.id ?? null);
  }

  useEffect(() => {
    async function initialize() {
      try {
        await load();
      } catch (requestError) {
        if (requestError instanceof ClientApiError && requestError.status === 401) { router.replace("/admin/login"); return; }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar los partners.");
      } finally {
        setLoading(false);
      }
    }
    void initialize();
  }, [router]);

  const selected = partners.find((partner) => partner.id === selectedId) ?? null;
  const selectedLocations = useMemo(() => locations.filter((location) => location.partnerId === selectedId), [locations, selectedId]);
  const selectedUsers = useMemo(() => users.filter((user) => user.partnerId === selectedId), [users, selectedId]);

  function resetPartner() { setPartnerForm(EMPTY_PARTNER); setEditingPartnerId(null); }
  function startEditingPartner(partner: Partner) { setSelectedId(partner.id); setEditingPartnerId(partner.id); setPartnerForm({ name: partner.name, type: partner.type, phone: partner.phone ?? "", email: partner.email ?? "", active: partner.active }); setNotice(""); setError(""); }
  function startEditingUser(user: PartnerUser) { setEditingUserId(user.id); setUserForm({ name: user.name, code: user.code, password: "", role: user.role, locationId: user.locationId ?? "", active: user.active }); setError(""); setNotice(""); }

  async function submitPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      if (editingPartnerId) {
        const data = await api<PartnerResponse>(`/api/admin/partners/${editingPartnerId}`, { method: "PATCH", body: JSON.stringify(partnerForm) });
        setPartners((current) => current.map((partner) => partner.id === data.partner.id ? data.partner : partner));
        setNotice("Partner actualizado. Si fue suspendido, sus usuarios perderán acceso en la siguiente solicitud.");
      } else {
        const data = await api<PartnerResponse>("/api/admin/partners", { method: "POST", body: JSON.stringify(partnerForm) });
        setPartners((current) => [...current, data.partner].sort((a, b) => a.name.localeCompare(b.name, "es"))); setSelectedId(data.partner.id); setNotice("Partner creado. Ahora agrega una sucursal y un usuario individual.");
      }
      resetPartner();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos guardar el partner."); }
    finally { setSaving(false); }
  }

  async function submitLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const data = await api<LocationResponse>(`/api/admin/partners/${selected.id}/locations`, { method: "POST", body: JSON.stringify(locationForm) });
      setLocations((current) => [...current, data.location]); setLocationForm(EMPTY_LOCATION); setNotice("Sucursal creada.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos crear la sucursal."); }
    finally { setSaving(false); }
  }

  async function toggleLocation(location: PartnerLocation) {
    if (!selected) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const data = await api<LocationResponse>(`/api/admin/partners/${selected.id}/locations/${location.id}`, { method: "PATCH", body: JSON.stringify({ name: location.name, address: location.address ?? "", city: location.city ?? "", timezone: location.timezone, active: !location.active }) });
      setLocations((current) => current.map((item) => item.id === data.location.id ? data.location : item)); setNotice(location.active ? "Sucursal suspendida." : "Sucursal reactivada.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos actualizar la sucursal."); }
    finally { setSaving(false); }
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const endpoint = editingUserId ? `/api/admin/partners/${selected.id}/users/${editingUserId}` : `/api/admin/partners/${selected.id}/users`;
      const data = await api<UserResponse>(endpoint, { method: editingUserId ? "PATCH" : "POST", body: JSON.stringify({ ...userForm, locationId: userForm.locationId || null }) });
      setUsers((current) => editingUserId ? current.map((user) => user.id === data.user.id ? data.user : user) : [...current, data.user]);
      setUserForm(EMPTY_USER); setEditingUserId(null); setNotice(editingUserId ? "Usuario partner actualizado." : "Usuario partner creado. Puede ingresar en /partner/login.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos guardar el usuario."); }
    finally { setSaving(false); }
  }

  async function voidPurchase(row: PurchaseRow) {
    const reason = window.prompt(`Anular la compra de ${row.ticket?.clientName ?? "este cliente"}. Indica el motivo (mínimo 5 caracteres):`);
    if (!reason) return;
    setSaving(true); setError(""); setNotice("");
    try { await api(`/api/admin/purchases/${row.purchase.id}/void`, { method: "POST", body: JSON.stringify({ reason }) }); await load(); setNotice("Compra anulada; el ticket quedó en revisión y la conversión queda excluida."); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos anular la compra."); }
    finally { setSaving(false); }
  }

  async function correctPurchase(row: PurchaseRow) {
    const total = window.prompt("Nuevo total pagado (USD):", String(row.purchase.totalPaid));
    if (total === null) return;
    const reason = window.prompt("Motivo de corrección (mínimo 5 caracteres):");
    if (!reason) return;
    setSaving(true); setError(""); setNotice("");
    try { await api(`/api/admin/purchases/${row.purchase.id}`, { method: "PATCH", body: JSON.stringify({ totalPaid: Number(total), notes: row.purchase.notes ?? "", reason }) }); await load(); setNotice("Compra corregida y conservada en el historial de auditoría."); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos corregir la compra."); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando partners…</main>;
  return <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto w-full max-w-7xl"><div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><Link href="/admin" className="text-sm font-medium text-primary hover:underline">← Volver al panel</Link><div className="mt-3 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Store className="size-5" aria-hidden /></span><div><h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Partners y compras presenciales</h1><p className="mt-1 text-muted-foreground">Organizaciones, sucursales, compradores autorizados y trazabilidad de operaciones.</p></div></div></div><div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"><span className="font-heading text-2xl font-bold text-foreground">{partners.length}</span> partners registrados</div></div>
  <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><section className="h-fit rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex items-start gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{editingPartnerId ? <Pencil className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}</span><div><h2 className="font-heading text-2xl font-semibold text-foreground">{editingPartnerId ? "Editar partner" : "Nuevo partner"}</h2><p className="mt-1 text-sm text-muted-foreground">Una organización puede tener varias sucursales y usuarios individuales.</p></div></div><form onSubmit={submitPartner} className="mt-6 space-y-4"><Field label="Nombre"><input value={partnerForm.name} onChange={(event) => setPartnerForm({ ...partnerForm, name: event.target.value })} className="input" maxLength={120} required /></Field><Field label="Tipo"><select value={partnerForm.type} onChange={(event) => setPartnerForm({ ...partnerForm, type: event.target.value })} className="input"><option>Joyería</option><option>Comprador independiente</option><option>Refinador</option><option>Sucursal propia</option><option>Otro comprador autorizado</option></select></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Teléfono"><input value={partnerForm.phone} onChange={(event) => setPartnerForm({ ...partnerForm, phone: event.target.value })} className="input" maxLength={32} /></Field><Field label="Correo"><input type="email" value={partnerForm.email} onChange={(event) => setPartnerForm({ ...partnerForm, email: event.target.value })} className="input" maxLength={160} /></Field></div><label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={partnerForm.active} onChange={(event) => setPartnerForm({ ...partnerForm, active: event.target.checked })} /> Partner activo</label><div className="flex flex-wrap gap-2"><button disabled={saving} className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Guardando…" : editingPartnerId ? "Guardar cambios" : "Crear partner"}</button>{editingPartnerId && <button type="button" onClick={resetPartner} className="h-11 rounded-full border border-border px-5 text-sm font-medium text-foreground">Cancelar</button>}</div></form></section>
  <section><h2 className="mb-4 font-heading text-2xl font-semibold text-foreground">Partners</h2>{partners.length === 0 ? <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Crea el primer partner para configurar sus sucursales y compradores.</div> : <div className="grid gap-3 sm:grid-cols-2">{partners.map((partner) => { const report = reports.find((item) => item.partnerId === partner.id); return <article key={partner.id} className={`rounded-2xl border bg-card p-5 shadow-sm transition-colors ${selectedId === partner.id ? "border-primary ring-1 ring-primary/30" : "border-border"}`}><div className="flex items-start justify-between gap-3"><button type="button" onClick={() => setSelectedId(partner.id)} className="min-w-0 text-left"><h3 className="truncate font-heading text-xl font-semibold text-foreground">{partner.name}</h3><p className="mt-1 text-xs text-muted-foreground">{partner.type}</p></button><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${partner.active ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>{partner.active ? "Activo" : "Suspendido"}</span></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><MiniMetric label="Citas pendientes" value={report?.pendingAppointments ?? 0} /><MiniMetric label="Compras" value={report?.confirmedPurchases ?? 0} /><MiniMetric label="Volumen" value={`${report?.volumeGrams ?? 0} g`} /><MiniMetric label="Pagado" value={money(report?.totalPaid ?? 0)} /></div><p className="mt-3 text-xs text-muted-foreground">Último acceso: {date(report?.lastLoginAt ?? null)}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => setSelectedId(partner.id)} className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full border border-border text-xs font-medium text-foreground"><ChevronRight className="size-3.5" aria-hidden /> Gestionar</button><button type="button" onClick={() => startEditingPartner(partner)} className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground" title="Editar partner"><Pencil className="size-3.5" aria-hidden /></button></div></article>; })}</div>}</section></div>
  {selected && <section className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Configuración seleccionada</p><h2 className="mt-1 font-heading text-3xl font-semibold text-foreground">{selected.name}</h2></div>{selected.active ? <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="size-4" aria-hidden /> Activo</span> : <span className="inline-flex items-center gap-1 text-sm text-destructive"><Ban className="size-4" aria-hidden /> Suspendido</span>}</div><div className="mt-6 grid gap-6 xl:grid-cols-2"><div><div className="flex items-center gap-2"><MapPin className="size-4 text-primary" aria-hidden /><h3 className="font-heading text-xl font-semibold text-foreground">Sucursales</h3></div><div className="mt-3 space-y-2">{selectedLocations.length === 0 ? <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Aún no hay sucursales.</p> : selectedLocations.map((location) => <div key={location.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/50 p-3"><div><p className="font-medium text-foreground">{location.name}</p><p className="text-xs text-muted-foreground">{[location.city, location.address].filter(Boolean).join(" · ") || location.timezone}</p></div><button type="button" disabled={saving} onClick={() => toggleLocation(location)} className={`rounded-full px-3 py-1 text-xs font-medium ${location.active ? "bg-emerald-500/10 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>{location.active ? "Suspender" : "Activar"}</button></div>)}</div><form onSubmit={submitLocation} className="mt-4 rounded-2xl border border-border bg-muted/30 p-4"><h4 className="font-medium text-foreground">Nueva sucursal</h4><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Nombre"><input value={locationForm.name} onChange={(event) => setLocationForm({ ...locationForm, name: event.target.value })} className="input h-10" maxLength={120} required /></Field><Field label="Ciudad"><input value={locationForm.city} onChange={(event) => setLocationForm({ ...locationForm, city: event.target.value })} className="input h-10" maxLength={100} /></Field><Field label="Dirección"><input value={locationForm.address} onChange={(event) => setLocationForm({ ...locationForm, address: event.target.value })} className="input h-10" maxLength={180} /></Field><Field label="Zona horaria"><input value={locationForm.timezone} onChange={(event) => setLocationForm({ ...locationForm, timezone: event.target.value })} className="input h-10" maxLength={80} required /></Field></div><button disabled={saving} className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Plus className="size-3.5" aria-hidden /> Crear sucursal</button></form></div>
  <div><div className="flex items-center gap-2"><UserCog className="size-4 text-primary" aria-hidden /><h3 className="font-heading text-xl font-semibold text-foreground">Usuarios partner</h3></div><div className="mt-3 space-y-2">{selectedUsers.length === 0 ? <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Aún no hay usuarios individuales.</p> : selectedUsers.map((user) => <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/50 p-3"><div><p className="font-medium text-foreground">{user.name} <span className="font-mono text-xs text-muted-foreground">#{user.code}</span></p><p className="text-xs text-muted-foreground">{user.role} · {selectedLocations.find((location) => location.id === user.locationId)?.name ?? "Todas las sucursales"} · último acceso: {date(user.lastLoginAt)}</p></div><button type="button" disabled={saving} onClick={() => startEditingUser(user)} className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">Editar</button></div>)}</div><form onSubmit={submitUser} className="mt-4 rounded-2xl border border-border bg-muted/30 p-4"><h4 className="font-medium text-foreground">{editingUserId ? "Editar usuario" : "Nuevo usuario"}</h4><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Nombre"><input value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} className="input h-10" maxLength={80} required /></Field><Field label="Código individual"><input value={userForm.code} onChange={(event) => setUserForm({ ...userForm, code: event.target.value })} className="input h-10 font-mono" minLength={3} maxLength={64} pattern="[A-Za-z0-9_-]+" required /></Field><Field label={editingUserId ? "Nueva contraseña (opcional)" : "Contraseña temporal"}><input type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} className="input h-10" minLength={editingUserId ? undefined : 8} maxLength={256} required={!editingUserId} /></Field><Field label="Rol"><select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value as PartnerRole })} className="input h-10"><option value="buyer">Comprador</option><option value="manager">Gerente</option><option value="owner">Propietario</option></select></Field><Field label="Sucursal asignada"><select value={userForm.locationId} onChange={(event) => setUserForm({ ...userForm, locationId: event.target.value })} className="input h-10"><option value="">Todas las sucursales</option>{selectedLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></Field><label className="flex items-center gap-2 self-end pb-2 text-sm text-foreground"><input type="checkbox" checked={userForm.active} onChange={(event) => setUserForm({ ...userForm, active: event.target.checked })} /> Usuario activo</label></div><div className="mt-3 flex gap-2"><button disabled={saving} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50">{editingUserId ? "Guardar usuario" : "Crear usuario"}</button>{editingUserId && <button type="button" onClick={() => { setEditingUserId(null); setUserForm(EMPTY_USER); }} className="h-10 rounded-full border border-border px-4 text-xs font-medium text-foreground">Cancelar</button>}</div></form></div></div></section>}
  <section className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex items-center gap-2"><ShoppingBag className="size-5 text-primary" aria-hidden /><div><h2 className="font-heading text-2xl font-semibold text-foreground">Compras recientes</h2><p className="mt-1 text-sm text-muted-foreground">Las anulaciones y correcciones dejan un registro permanente de auditoría.</p></div></div><div className="mt-5 space-y-3">{purchases.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">No hay compras registradas todavía.</p> : purchases.map((row) => <article key={row.purchase.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-mono text-xs text-muted-foreground">#{row.ticket?.number ?? "Ticket"}</p><p className="mt-1 font-medium text-foreground">{row.ticket?.clientName ?? "Cliente no disponible"} · {row.partnerName} / {row.locationName}</p><p className="mt-1 text-xs text-muted-foreground">{row.purchase.netWeightGrams} g · {money(row.purchase.totalPaid)} · confirmó {row.confirmedBy} · {date(row.purchase.confirmedAt)}</p>{row.ticket?.referrerName && <p className="mt-1 text-xs text-muted-foreground">Referido: {row.ticket.referrerName} #{row.ticket.referrerCode}</p>}{row.purchase.voidedAt && <p className="mt-2 text-xs text-destructive">Anulada: {row.purchase.voidReason}</p>}</div>{!row.purchase.voidedAt && <div className="flex gap-2"><button type="button" disabled={saving} onClick={() => correctPurchase(row)} className="h-9 rounded-full border border-border px-3 text-xs font-medium text-foreground disabled:opacity-50">Corregir</button><button type="button" disabled={saving} onClick={() => voidPurchase(row)} className="h-9 rounded-full border border-destructive/25 bg-destructive/5 px-3 text-xs font-medium text-destructive disabled:opacity-50">Anular</button></div>}</article>)}</div></section>{notice && <p role="status" className="mt-6 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-foreground">{notice}</p>}{error && <p role="alert" className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}</div></main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5"><span className="block text-sm font-medium text-foreground">{label}</span>{children}</label>; }
function MiniMetric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg bg-muted/60 p-2"><p className="text-muted-foreground">{label}</p><p className="mt-1 font-heading text-base font-semibold text-foreground">{value}</p></div>; }

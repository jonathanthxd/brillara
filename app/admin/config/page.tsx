"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { PublicSettings } from "@/lib/pricing";
import { Announcement } from "@/types/announcement";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

interface SettingsResponse { settings: PublicSettings }
interface AnnouncementsResponse { announcements: Announcement[] }

export default function AdminConfigPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [settingsData, announcementsData] = await Promise.all([
          api<SettingsResponse>("/api/admin/settings"),
          api<AnnouncementsResponse>("/api/admin/announcements"),
        ]);
        setSettings(settingsData.settings);
        setAnnouncements(announcementsData.announcements);
      } catch (requestError) {
        if (requestError instanceof ClientApiError && requestError.status === 401) { router.replace("/admin/login"); return; }
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar la configuración.");
      } finally { setLoading(false); }
    }
    void load();
  }, [router]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true); setNotice(""); setError("");
    try { const data = await api<SettingsResponse>("/api/admin/settings", { method: "PUT", body: JSON.stringify(settings) }); setSettings(data.settings); setNotice("Configuración guardada y publicada."); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos guardar la configuración."); }
    finally { setSaving(false); }
  }

  async function addAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setNotice(""); setError("");
    try { const data = await api<{ announcement: Announcement }>("/api/admin/announcements", { method: "POST", body: JSON.stringify({ title: newTitle, content: newContent }) }); setAnnouncements((current) => [data.announcement, ...current]); setNewTitle(""); setNewContent(""); setNotice("Anuncio publicado."); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos publicar el anuncio."); }
    finally { setSaving(false); }
  }

  async function toggleAnnouncement(announcement: Announcement) {
    setSaving(true); setError("");
    try { await api(`/api/admin/announcements/${announcement.id}`, { method: "PATCH", body: JSON.stringify({ active: !announcement.active }) }); setAnnouncements((current) => current.map((item) => item.id === announcement.id ? { ...item, active: !item.active } : item)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos cambiar el anuncio."); }
    finally { setSaving(false); }
  }

  async function deleteAnnouncement(id: string) {
    if (!window.confirm("¿Eliminar este anuncio?")) return;
    setSaving(true); setError("");
    try { await api(`/api/admin/announcements/${id}`, { method: "DELETE" }); setAnnouncements((current) => current.filter((item) => item.id !== id)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No pudimos eliminar el anuncio."); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-muted-foreground">Cargando configuración…</main>;
  if (!settings) return <main className="flex flex-1 items-center justify-center px-6 py-24 text-destructive">{error || "Configuración no disponible."}</main>;

  return (
    <main className="flex flex-1 flex-col px-6 py-12"><div className="mx-auto w-full max-w-3xl space-y-12"><section><h1 className="font-heading text-3xl font-bold text-foreground">Configuración</h1><p className="text-muted-foreground">Precios de referencia y datos públicos del negocio</p><form onSubmit={saveSettings} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6"><div className="grid gap-4 md:grid-cols-2"><Field label="Comisión de pago (%)"><input type="number" step="0.01" min="0" max="1" value={settings.commissionRate} onChange={(event) => setSettings({ ...settings, commissionRate: Number(event.target.value) })} className="input" /><p className="text-xs text-muted-foreground">0.85 = 85% del precio de referencia.</p></Field><Field label="Precio de oro (override)"><input type="number" step="0.01" min="0" value={settings.goldPriceOverride ?? ""} onChange={(event) => setSettings({ ...settings, goldPriceOverride: event.target.value ? Number(event.target.value) : null })} placeholder="Usar referencia" className="input" /></Field><Field label="Precio de plata (override)"><input type="number" step="0.01" min="0" value={settings.silverPriceOverride ?? ""} onChange={(event) => setSettings({ ...settings, silverPriceOverride: event.target.value ? Number(event.target.value) : null })} placeholder="Usar referencia" className="input" /></Field><Field label="Teléfono de contacto"><input type="text" value={settings.phoneContact} maxLength={100} onChange={(event) => setSettings({ ...settings, phoneContact: event.target.value })} className="input" /></Field></div><Field label="Horario de atención"><input type="text" value={settings.businessHours} maxLength={200} onChange={(event) => setSettings({ ...settings, businessHours: event.target.value })} className="input" /></Field><Field label="Área de cobertura"><textarea rows={2} value={settings.coverageArea} maxLength={500} onChange={(event) => setSettings({ ...settings, coverageArea: event.target.value })} className="input py-3" /></Field><button type="submit" disabled={saving} className="h-12 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50">{saving ? "Guardando…" : "Guardar configuración"}</button></form></section><section><h2 className="font-heading text-2xl font-bold text-foreground">Anuncios</h2><p className="text-muted-foreground">Avisos públicos para visitantes</p><form onSubmit={addAnnouncement} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6"><label className="sr-only" htmlFor="announcement-title">Título</label><input id="announcement-title" type="text" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} maxLength={120} placeholder="Título del anuncio" className="input" required /><label className="sr-only" htmlFor="announcement-content">Contenido</label><textarea id="announcement-content" rows={2} value={newContent} onChange={(event) => setNewContent(event.target.value)} maxLength={600} placeholder="Contenido del anuncio" className="input py-3" required /><button type="submit" disabled={saving || !newTitle.trim() || !newContent.trim()} className="h-12 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground disabled:opacity-50">Publicar anuncio</button></form><div className="mt-6 space-y-3">{announcements.length === 0 ? <p className="text-muted-foreground">No hay anuncios publicados.</p> : announcements.map((announcement) => <div key={announcement.id} className={`rounded-xl border p-4 ${announcement.active ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-medium text-foreground">{announcement.title}</h3><div className="flex gap-2"><button type="button" disabled={saving} onClick={() => toggleAnnouncement(announcement)} className={`rounded-full px-3 py-1 text-xs font-medium ${announcement.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{announcement.active ? "Activo" : "Inactivo"}</button><button type="button" disabled={saving} onClick={() => deleteAnnouncement(announcement.id)} className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/20">Eliminar</button></div></div><p className="mt-1 text-sm text-muted-foreground">{announcement.content}</p></div>)}</div></section>{notice && <p role="status" className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">{notice}</p>}{error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}</div></main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><label className="text-sm font-medium text-foreground">{label}</label>{children}</div>; }

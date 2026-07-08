"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminLoggedIn } from "@/services/admin";
import { getConfig, saveConfig, BrillaraConfig } from "@/services/config";
import { getAnnouncements, createAnnouncement, toggleAnnouncement, deleteAnnouncement, Announcement } from "@/services/announcements";

export default function AdminConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<BrillaraConfig | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAdminLoggedIn()) {
      router.push("/admin/login");
      return;
    }
    setConfig(getConfig());
    setAnnouncements(getAnnouncements());
  }, [router]);

  function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    saveConfig(config);
    alert("Configuración guardada. Los precios se actualizarán automáticamente.");
  }

  function handleAddAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    createAnnouncement({ title: newTitle, content: newContent, active: true });
    setNewTitle("");
    setNewContent("");
    setAnnouncements(getAnnouncements());
  }

  function handleToggle(id: string) {
    toggleAnnouncement(id);
    setAnnouncements(getAnnouncements());
  }

  function handleDelete(id: string) {
    deleteAnnouncement(id);
    setAnnouncements(getAnnouncements());
  }

  if (!mounted || !config) return null;

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-12">
        
        {/* Configuración de Precios */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">Precios, comisiones y datos del negocio</p>
          
          <form onSubmit={handleSaveConfig} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Comisión de pago (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={config.commissionRate}
                  onChange={(e) => setConfig({ ...config, commissionRate: parseFloat(e.target.value) })}
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">0.85 = 85% del valor de mercado</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Precio Oro (override)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.goldPriceOverride ?? ""}
                  onChange={(e) => setConfig({ ...config, goldPriceOverride: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Dejar vacío para automático"
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Precio Plata (override)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.silverPriceOverride ?? ""}
                  onChange={(e) => setConfig({ ...config, silverPriceOverride: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Dejar vacío para automático"
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Teléfono de contacto</label>
                <input
                  type="text"
                  value={config.phoneContact}
                  onChange={(e) => setConfig({ ...config, phoneContact: e.target.value })}
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Horario de atención</label>
              <input
                type="text"
                value={config.businessHours}
                onChange={(e) => setConfig({ ...config, businessHours: e.target.value })}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Área de cobertura</label>
              <textarea
                rows={2}
                value={config.coverageArea}
                onChange={(e) => setConfig({ ...config, coverageArea: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
              />
            </div>
            <button type="submit" className="h-12 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-all hover:brightness-110">
              Guardar Configuración
            </button>
          </form>
        </div>

        {/* Anuncios */}
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Anuncios</h2>
          <p className="text-muted-foreground">Avisos temporales para los visitantes</p>
          
          <form onSubmit={handleAddAnnouncement} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título del anuncio"
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none focus:border-primary"
            />
            <textarea
              rows={2}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Contenido del anuncio"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
            />
            <button type="submit" className="h-12 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-all hover:brightness-110">
              Publicar Anuncio
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {announcements.length === 0 && <p className="text-muted-foreground">No hay anuncios publicados.</p>}
            {announcements.map((a) => (
              <div key={a.id} className={`rounded-xl border p-4 ${a.active ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">{a.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(a.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${a.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {a.active ? "Activo" : "Inactivo"}
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="rounded-full px-3 py-1 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { api } from "@/lib/client-api";
import { DEFAULT_SETTINGS, PublicSettings } from "@/lib/pricing";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SettingsResponse {
  settings: PublicSettings;
}

export function ContactSection() {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    void api<SettingsResponse>("/api/public/settings")
      .then((data) => setSettings(data.settings))
      .catch(() => undefined);
  }, []);

  const coverageCities = settings.coverageArea.split(",").map((city) => city.trim()).filter(Boolean);

  return (
    <section id="contacto" className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block text-xs font-medium uppercase tracking-widest text-primary">Estamos cerca de ti</span>
          <h2 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">Cobertura y contacto</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="font-heading text-xl font-semibold text-foreground">Áreas que cubrimos</h3>
            <p className="mt-2 text-sm text-muted-foreground">Nos desplazamos hasta tu ubicación dentro de estas zonas:</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {coverageCities.map((city) => <span key={city} className="rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground">{city}</span>)}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">¿No ves tu ciudad? Contáctanos de todos modos. Evaluamos caso por caso.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="font-heading text-xl font-semibold text-foreground">Habla con nosotros</h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>📞</div><div><p className="text-sm font-medium text-foreground">Teléfono</p><p className="text-sm text-muted-foreground">{settings.phoneContact}</p></div></div>
              <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>🕐</div><div><p className="text-sm font-medium text-foreground">Horario</p><p className="text-sm text-muted-foreground">{settings.businessHours}</p></div></div>
              <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>🚗</div><div><p className="text-sm font-medium text-foreground">Servicio</p><p className="text-sm text-muted-foreground">Desplazamiento incluido en el área</p></div></div>
            </div>
            <Link href="/ticket/nuevo" className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:brightness-110">Iniciar negociación ahora</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

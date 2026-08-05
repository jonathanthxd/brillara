"use client";

import { api } from "@/lib/client-api";
import { DEFAULT_SETTINGS, PublicSettings } from "@/lib/pricing";
import { Clock3, MapPinned, Phone, CarFront, ArrowRight } from "lucide-react";
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
    <section id="contacto" className="border-t border-border px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><MapPinned className="size-3.5" aria-hidden /> Estamos cerca de ti</span>
          <h2 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">Cobertura y contacto</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
            <h3 className="font-heading text-xl font-semibold text-foreground">Áreas que cubrimos</h3>
            <p className="mt-2 text-sm text-muted-foreground">Nos desplazamos hasta tu ubicación dentro de estas zonas:</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {coverageCities.map((city) => <span key={city} className="rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground">{city}</span>)}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">¿No ves tu ciudad? Contáctanos de todos modos. Evaluamos caso por caso.</p>
          </div>
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
            <h3 className="font-heading text-xl font-semibold text-foreground">Habla con nosotros</h3>
            <div className="mt-6 space-y-4">
              <ContactItem icon={<Phone className="size-5" aria-hidden />} label="Teléfono" value={settings.phoneContact} />
              <ContactItem icon={<Clock3 className="size-5" aria-hidden />} label="Horario" value={settings.businessHours} />
              <ContactItem icon={<CarFront className="size-5" aria-hidden />} label="Servicio" value="Desplazamiento incluido en el área" />
            </div>
            <Link href="/ticket/nuevo" className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:brightness-110">Iniciar negociación ahora <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div><div><p className="text-sm font-medium text-foreground">{label}</p><p className="text-sm text-muted-foreground">{value}</p></div></div>;
}

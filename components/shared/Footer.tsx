"use client";

import { useEffect, useState } from "react";
import { getConfig, BrillaraConfig } from "@/services/config";
import Link from "next/link";

export function Footer() {
  const [config, setConfig] = useState<BrillaraConfig | null>(null);

  useEffect(() => {
    setConfig(getConfig());
  }, []);

  return (
    <footer className="border-t border-border px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <p className="font-heading text-2xl font-bold text-foreground">BRILLARA</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Compra profesional de metales preciosos en el área de Los Ángeles. Transparencia, evaluación experta y pago inmediato.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-foreground">Contacto</p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>📞 {config?.phoneContact || "(323) 555-0199"}</p>
              <p>📍 {config?.coverageArea?.split(",")[0] || "Los Ángeles, CA"}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-foreground">Horario</p>
            <p className="mt-4 text-sm text-muted-foreground">
              {config?.businessHours || "Lunes a Sábado: 9:00 AM - 6:00 PM"}
            </p>
            <div className="mt-4 flex gap-4">
              <Link href="/inicio" className="text-sm text-muted-foreground hover:text-primary">Inicio</Link>
              <Link href="/inicio#precio" className="text-sm text-muted-foreground hover:text-primary">Precios</Link>
              <Link href="/tickets" className="text-sm text-muted-foreground hover:text-primary">Mis Tickets</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>© 2026 BRILLARA. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

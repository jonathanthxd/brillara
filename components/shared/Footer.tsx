"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-heading text-lg font-semibold text-foreground">BRILLARA</p>
          <p className="mt-1">Compra de metales preciosos con atención presencial en Los Ángeles.</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Navegación del pie de página">
          <Link href="/inicio" className="transition-colors hover:text-primary">Inicio</Link>
          <Link href="/inicio#precio" className="transition-colors hover:text-primary">Estimador</Link>
          <Link href="/tickets" className="transition-colors hover:text-primary">Mis tickets</Link>
          <Link href="/" className="transition-colors hover:text-primary">Cambiar nombre</Link>
        </nav>
      </div>
    </footer>
  );
}

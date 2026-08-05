"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Gem } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <footer className="border-t border-border bg-card/35 px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 text-sm text-muted-foreground md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground"><span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Gem className="size-4" aria-hidden /></span> BRILLARA</div>
          <p className="mt-3 leading-relaxed">Compra de metales preciosos con atención presencial, claridad y trato humano en Los Ángeles.</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <nav className="flex flex-wrap gap-x-5 gap-y-3" aria-label="Navegación del pie de página">
            <Link href="/inicio" className="transition-colors hover:text-primary">Inicio</Link>
            <Link href="/inicio#precio" className="transition-colors hover:text-primary">Estimador</Link>
            <Link href="/tickets" className="transition-colors hover:text-primary">Mis tickets</Link>
            <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-primary">Cambiar nombre <ArrowUpRight className="size-3" aria-hidden /></Link>
          </nav>
          <p className="text-xs text-muted-foreground/80">© {new Date().getFullYear()} BRILLARA</p>
        </div>
      </div>
    </footer>
  );
}

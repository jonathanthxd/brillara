"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function Navbar() {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setUserName(localStorage.getItem("brillara_name"));
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/inicio" className="font-heading text-2xl font-bold tracking-tight text-foreground">
          BRILLARA
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/inicio#precio" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Precios
          </Link>
          <Link href="/inicio#como-funciona" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Cómo Funciona
          </Link>
          <Link href="/tickets" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Mis Tickets
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {userName && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Hola, <span className="font-medium text-foreground">{userName}</span>
            </span>
          )}
          <Link
            href="/ticket/nuevo"
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
          >
            Iniciar Negociación
          </Link>
        </div>
      </div>
    </header>
  );
}

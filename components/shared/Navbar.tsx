"use client";

import { api } from "@/lib/client-api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProfileResponse {
  registered: boolean;
  name: string | null;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    void api<ProfileResponse>("/api/profile")
      .then(setProfile)
      .catch(() => setProfile({ registered: false, name: null }));
  }, []);

  async function changeProfile() {
    await api("/api/profile", { method: "DELETE" }).catch(() => undefined);
    router.replace("/");
    router.refresh();
  }

  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6">
        <Link href="/inicio" className="font-heading text-2xl font-bold tracking-tight text-foreground">
          BRILLARA
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegación principal">
          <Link href="/inicio#precio" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Precios
          </Link>
          <Link href="/inicio#como-funciona" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Cómo funciona
          </Link>
          <Link href="/tickets" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Mis tickets
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {profile?.registered && profile.name ? (
            <button
              type="button"
              onClick={changeProfile}
              title="Cambiar dispositivo o nombre"
              className="hidden text-right text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Hola, <span className="font-medium text-foreground">{profile.name}</span>
            </button>
          ) : (
            <Link href="/" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline">
              Identificarme
            </Link>
          )}
          <Link
            href={profile?.registered ? "/ticket/nuevo" : "/"}
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 sm:px-6"
          >
            Iniciar negociación
          </Link>
        </div>
      </div>
    </header>
  );
}

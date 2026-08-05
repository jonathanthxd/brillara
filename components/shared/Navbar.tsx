"use client";

import { api } from "@/lib/client-api";
import { PROFILE_CHANGE_EVENT, ProfileChangeDetail } from "@/lib/profile-events";
import { Menu, PencilLine, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LiquidMetalLink } from "@/components/ui/liquid-metal-button";

interface ProfileResponse {
  registered: boolean;
  name: string | null;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const loadProfile = () => {
      void api<ProfileResponse>("/api/profile")
        .then(setProfile)
        .catch(() => setProfile({ registered: false, name: null }));
    };

    const onProfileChanged = (event: Event) => {
      const detail = (event as CustomEvent<ProfileChangeDetail>).detail;
      if (detail && typeof detail.registered === "boolean") {
        setProfile({ registered: detail.registered, name: detail.name });
        return;
      }
      loadProfile();
    };

    loadProfile();
    window.addEventListener(PROFILE_CHANGE_EVENT, onProfileChanged);
    return () => window.removeEventListener(PROFILE_CHANGE_EVENT, onProfileChanged);
  }, []);

  async function changeProfile() {
    await api("/api/profile", { method: "DELETE" });
    setProfile({ registered: false, name: null });
    window.dispatchEvent(new CustomEvent(PROFILE_CHANGE_EVENT, { detail: { registered: false, name: null } }));
    router.replace("/");
    router.refresh();
  }

  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/inicio" className="group flex items-center gap-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-[1.7rem]">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-transform group-hover:rotate-6">B</span>
          BRILLARA
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegación principal">
          <Link href="/inicio#precio" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Precios
          </Link>
          <Link href="/inicio#como-funciona" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Cómo funciona
          </Link>
          <Link href="/tickets" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Mis tickets
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {profile?.registered && profile.name ? (
            <button
              type="button"
              onClick={changeProfile}
              title="Cambiar nombre en este dispositivo"
              className="hidden items-center gap-1.5 rounded-full px-2 py-1.5 text-right text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
            >
              <span>Hola, <span className="font-medium text-foreground">{profile.name}</span></span>
              <PencilLine className="size-3.5" aria-hidden />
            </button>
          ) : (
            <Link href="/" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:inline">
              Identificarme
            </Link>
          )}
          <LiquidMetalLink href={profile?.registered ? "/ticket/nuevo" : "/"} size="sm" className="hidden sm:inline-flex">Iniciar negociación</LiquidMetalLink>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent lg:hidden"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border/70 bg-background px-4 py-4 shadow-xl shadow-foreground/5 lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1" aria-label="Navegación móvil">
            <MobileLink href="/inicio#precio" onClick={() => setIsMenuOpen(false)}>Precio de hoy</MobileLink>
            <MobileLink href="/inicio#como-funciona" onClick={() => setIsMenuOpen(false)}>Cómo funciona</MobileLink>
            <MobileLink href="/tickets" onClick={() => setIsMenuOpen(false)}>Mis tickets</MobileLink>
            {profile?.registered && profile.name ? (
              <button type="button" onClick={changeProfile} className="mt-2 flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3 text-left text-sm text-foreground">
                <span>Hola, <strong>{profile.name}</strong></span>
                <span className="text-muted-foreground">Cambiar nombre</span>
              </button>
            ) : (
              <MobileLink href="/" onClick={() => setIsMenuOpen(false)}>Identificarme</MobileLink>
            )}
            <LiquidMetalLink href={profile?.registered ? "/ticket/nuevo" : "/"} onClick={() => setIsMenuOpen(false)} className="mt-2 w-full">Iniciar negociación</LiquidMetalLink>
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return <Link href={href} onClick={onClick} className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">{children}</Link>;
}

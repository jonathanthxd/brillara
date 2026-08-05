"use client";

import { api } from "@/lib/client-api";
import { PROFILE_CHANGE_EVENT } from "@/lib/profile-events";
import { ArrowRight, BadgeCheck, HandCoins, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function WelcomeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const profile = await api<{ registered: boolean; name: string }>("/api/profile", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      window.dispatchEvent(new CustomEvent(PROFILE_CHANGE_EVENT, { detail: profile }));
      router.replace("/inicio");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible guardar tu nombre.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_27rem),radial-gradient(circle_at_85%_80%,color-mix(in_oklab,var(--primary)_11%,transparent),transparent_26rem)]" />
      <div className="pointer-events-none absolute -left-28 top-20 -z-10 size-80 rounded-full border border-primary/20" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 -z-10 size-96 rounded-full border border-primary/15" />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <section className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="size-3.5" aria-hidden /> Bienvenido a BRILLARA
          </div>
          <h1 className="mt-5 font-heading text-5xl font-bold leading-[0.92] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Tu oro merece una <span className="text-primary">oferta clara.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
            Conoce el precio de referencia, prepara tu estimación y negocia con atención humana en Los Ángeles.
          </p>
          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3 lg:max-w-2xl">
            <TrustItem icon={<ShieldCheck className="size-4" aria-hidden />} text="Proceso transparente" />
            <TrustItem icon={<HandCoins className="size-4" aria-hidden />} text="Pago al acordar" />
            <TrustItem icon={<BadgeCheck className="size-4" aria-hidden />} text="Atención personal" />
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card/90 p-5 shadow-2xl shadow-primary/10 backdrop-blur sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-lg font-heading font-bold text-primary-foreground">B</span>
            <div>
              <p className="font-heading text-2xl font-semibold text-foreground">Empecemos</p>
              <p className="text-sm text-muted-foreground">Solo necesitamos saber cómo llamarte.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="visitor-name">¿Cómo te llamas?</label>
              <input
                id="visitor-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej.: Jonathan"
                autoComplete="given-name"
                autoFocus
                maxLength={80}
                className="h-14 w-full rounded-2xl border border-input bg-background px-5 text-lg text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/15"
                required
              />
            </div>
            {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Entrando..." : "Conocer BRILLARA"}
              {!isSubmitting && <ArrowRight className="size-4" aria-hidden />}
            </button>
          </form>
          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">Guardamos tu nombre en una cookie privada de este dispositivo para que puedas volver a tus tickets.</p>
        </section>
      </div>
    </main>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/65 px-3 py-3 text-sm font-medium text-foreground"><span className="text-primary">{icon}</span>{text}</div>;
}

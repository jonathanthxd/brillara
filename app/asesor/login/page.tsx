"use client";

import { api } from "@/lib/client-api";
import { ArrowRight, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdvisorLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try { await api("/api/advisor/session", { method: "POST", body: JSON.stringify({ code, password }) }); router.replace("/asesor"); router.refresh(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No fue posible iniciar sesión."); setLoading(false); }
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_20%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_26rem),radial-gradient(circle_at_80%_85%,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_24rem)]" />
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <section className="text-center lg:text-left">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 lg:mx-0"><ShieldCheck className="size-7" aria-hidden /></span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Acceso interno</p>
          <h1 className="mt-3 font-heading text-4xl font-bold leading-tight text-foreground sm:text-5xl">Portal del asesor</h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground lg:mx-0">Consulta los tickets disponibles, toma nuevas negociaciones y acompaña al cliente hasta su cita.</p>
          <div className="mt-7 inline-flex items-center gap-2 rounded-2xl border border-border bg-card/65 px-4 py-3 text-sm text-muted-foreground"><KeyRound className="size-4 text-primary" aria-hidden /> Tu acceso se administra desde el panel de BRILLARA.</div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-[2rem] border border-border bg-card/90 p-6 shadow-2xl shadow-primary/10 backdrop-blur sm:p-8">
          <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRound className="size-5" aria-hidden /></span><div><h2 className="font-heading text-2xl font-semibold text-foreground">Inicia sesión</h2><p className="text-sm text-muted-foreground">Usa el código entregado por administración.</p></div></div>
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="space-y-2"><label htmlFor="advisor-code" className="text-sm font-medium text-foreground">Código de asesor</label><input id="advisor-code" type="text" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="username" maxLength={64} placeholder="Ej.: 10001" className="input font-mono" required /></div>
            <div className="space-y-2"><label htmlFor="advisor-password" className="text-sm font-medium text-foreground">Contraseña</label><input id="advisor-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Tu contraseña" className="input" required /></div>
            {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={loading || !code.trim() || !password} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Verificando…" : <>Entrar al portal <ArrowRight className="size-4" aria-hidden /></>}</button>
          </form>
        </section>
      </div>
    </main>
  );
}

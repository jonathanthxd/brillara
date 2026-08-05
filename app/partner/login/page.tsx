"use client";

import { api } from "@/lib/client-api";
import { ArrowRight, KeyRound, ShieldCheck, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/partner/session", { method: "POST", body: JSON.stringify({ code, password }) });
      router.replace("/partner");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible iniciar sesión.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_29rem)]" />
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-border bg-card/90 p-6 shadow-2xl shadow-primary/10 backdrop-blur sm:p-8">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"><Store className="size-7" aria-hidden /></span>
        <h1 className="mt-6 text-center font-heading text-3xl font-bold text-foreground">Portal de partners</h1>
        <p className="mt-2 text-center text-muted-foreground">Confirma resultados presenciales de forma segura y trazable.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2"><label className="text-sm font-medium text-foreground" htmlFor="partner-code">Código de acceso</label><div className="relative"><ShieldCheck className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input id="partner-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="username" minLength={3} maxLength={64} className="input pl-11 font-mono" placeholder="Tu código personal" required /></div></div>
          <div className="space-y-2"><label className="text-sm font-medium text-foreground" htmlFor="partner-password">Contraseña</label><div className="relative"><KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input id="partner-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="input pl-11" placeholder="Contraseña" required /></div></div>
          {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={loading || !code || !password} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Verificando…" : <>Entrar al portal <ArrowRight className="size-4" aria-hidden /></>}</button>
        </form>
        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">Cada comprador usa su propio acceso. Si no lo tienes, solicita al administrador que cree o restablezca tu usuario.</p>
      </div>
    </main>
  );
}

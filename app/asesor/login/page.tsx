"use client";

import { api } from "@/lib/client-api";
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

  return <main className="flex min-h-screen flex-col items-center justify-center px-6"><div className="mx-auto w-full max-w-sm"><h1 className="text-center font-heading text-3xl font-bold text-foreground">Portal del asesor</h1><p className="mt-2 text-center text-muted-foreground">Acceso para el equipo BRILLARA</p><form onSubmit={handleSubmit} className="mt-8 space-y-4"><div className="space-y-2"><label htmlFor="advisor-code" className="text-sm font-medium text-foreground">Código de asesor</label><input id="advisor-code" type="text" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="username" maxLength={64} placeholder="Ej.: 10001" className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div><div className="space-y-2"><label htmlFor="advisor-password" className="text-sm font-medium text-foreground">Contraseña</label><input id="advisor-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Tu contraseña" className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button type="submit" disabled={loading || !code.trim() || !password} className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50">{loading ? "Verificando…" : "Entrar"}</button></form></div></main>;
}

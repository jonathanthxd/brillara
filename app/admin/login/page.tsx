"use client";

import { api } from "@/lib/client-api";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api("/api/admin/session", { method: "POST", body: JSON.stringify({ password }) });
      router.replace("/admin");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible iniciar sesión.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center font-heading text-3xl font-bold text-foreground">Panel administrativo</h1>
        <p className="mt-2 text-center text-muted-foreground">Acceso restringido</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="sr-only" htmlFor="admin-password">Contraseña</label>
          <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Contraseña" className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={loading || !password} className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50">{loading ? "Verificando…" : "Entrar"}</button>
        </form>
      </div>
    </main>
  );
}

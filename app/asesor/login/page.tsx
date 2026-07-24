"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdvisor } from "@/services/supabase-advisors";

export default function AdvisorLoginPage() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const advisor = await loginAdvisor(code, password);
    
    if (advisor) {
      router.push("/asesor");
    } else {
      setError("Código o contraseña incorrectos");
    }
    
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center font-heading text-3xl font-bold text-foreground">
          Portal del Asesor
        </h1>
        <p className="mt-2 text-center text-muted-foreground">
          Acceso para el equipo BRILLARA
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Código de Asesor</label>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              placeholder="Ej: 10001"
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Tu contraseña"
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

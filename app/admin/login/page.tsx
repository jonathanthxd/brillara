"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/services/admin";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loginAdmin(password)) {
      router.push("/admin");
    } else {
      setError(true);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center font-heading text-3xl font-bold text-foreground">Panel Administrativo</h1>
        <p className="mt-2 text-center text-muted-foreground">Acceso restringido</p>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Contraseña"
            className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {error && <p className="text-sm text-destructive">Contraseña incorrecta</p>}
          <button type="submit" className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:brightness-110">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}

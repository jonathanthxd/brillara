"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const [name, setName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("brillara_name");
    if (saved) {
      router.push("/inicio");
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem("brillara_name", name.trim());
      router.push("/inicio");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <h1 className="font-heading text-6xl font-bold tracking-tight text-foreground md:text-8xl">
        BRILLARA
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        Bienvenido a la experiencia de venta de metales preciosos más transparente de Los Ángeles.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 w-full max-w-sm space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="¿Cómo te llamas?"
          className="h-14 w-full rounded-full border border-border bg-card px-6 text-center text-lg text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />
        <button
          type="submit"
          className="inline-flex h-14 w-full items-center justify-center rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}

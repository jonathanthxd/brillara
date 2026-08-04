"use client";

import { api } from "@/lib/client-api";
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
      await api<{ registered: boolean; name: string }>("/api/profile", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      router.replace("/inicio");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible guardar tu nombre.");
      setIsSubmitting(false);
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

      <form onSubmit={handleSubmit} className="mt-10 w-full max-w-sm space-y-4" noValidate>
        <label className="sr-only" htmlFor="visitor-name">¿Cómo te llamas?</label>
        <input
          id="visitor-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="¿Cómo te llamas?"
          autoComplete="given-name"
          maxLength={80}
          className="h-14 w-full rounded-full border border-border bg-card px-6 text-center text-lg text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="inline-flex h-14 w-full items-center justify-center rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}

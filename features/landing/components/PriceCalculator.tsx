"use client";

import { useState, useEffect } from "react";
import {
  getMetalPrice,
  getAllPrices,
  calculateEstimate,
  formatCurrency,
  KARATS,
  UNITS,
  type Metal,
} from "@/services/prices";

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function PriceCalculator() {
  const [metal, setMetal] = useState<Metal>("gold");
  const [weight, setWeight] = useState<string>("");
  const [unit, setUnit] = useState<string>("g");
  const [karat, setKarat] = useState<number>(24);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false); // ✅ nuevo estado

  useEffect(() => {
    setMounted(true);
  }, []); // solo se ejecuta en el cliente

  const prices = getAllPrices();
  const currentPrice = getMetalPrice(metal);

  function handleCalculate() {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return;
    setEstimate(calculateEstimate(metal, w, unit, karat));
  }

  return (
    <section id="precio" className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block text-xs font-medium uppercase tracking-widest text-primary">
            Precio Actualizado
          </span>
          <h2 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            ¿Cuánto vale tu oro hoy?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Consulta el precio que BRILLARA está pagando y calcula una estimación al instante.
          </p>
        </div>

        {/* Tarjetas de precio */}
        <div className="mb-12 grid gap-6 md:grid-cols-2">
          {prices.map((p) => (
            <div
              key={p.metal}
              onClick={() => {
                setMetal(p.metal);
                setEstimate(null);
              }}
              className={`cursor-pointer rounded-2xl border p-6 transition-all ${
                metal === p.metal
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    {p.metal === "gold" ? "Oro" : "Plata"}
                  </p>
                  <p className="mt-1 font-heading text-3xl font-bold text-foreground">
                    {formatCurrency(p.pricePerGramUSD)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      / gramo puro
                    </span>
                  </p>
                </div>
                <div
                  className={`h-4 w-4 rounded-full border-2 ${
                    metal === p.metal
                      ? "border-primary bg-primary"
                      : "border-border"
                  }`}
                />
              </div>
              {/* ✅ Renderizado condicional para evitar hydration mismatch */}
              <p className="mt-3 text-xs text-muted-foreground">
                Actualizado: {mounted ? formatTime(p.updatedAt) : "--:--"}
              </p>
            </div>
          ))}
        </div>

        {/* Calculadora */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
          <h3 className="mb-6 font-heading text-2xl font-semibold text-foreground">
            Calcula tu estimación
          </h3>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Peso */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Peso
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setEstimate(null);
                }}
                placeholder="Ej: 10.5"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Unidad */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Unidad
              </label>
              <select
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  setEstimate(null);
                }}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Kilataje */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Kilataje
              </label>
              <select
                value={karat}
                onChange={(e) => {
                  setKarat(Number(e.target.value));
                  setEstimate(null);
                }}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {KARATS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label} ({(k.purity * 100).toFixed(1)}% pureza)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={!weight || parseFloat(weight) <= 0}
            className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Calcular Estimación
          </button>

          {/* Resultado */}
          {estimate !== null && (
            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
              <p className="text-sm font-medium text-muted-foreground">
                Estimación aproximada que BRILLARA pagaría:
              </p>
              <p className="mt-2 font-heading text-4xl font-bold text-primary md:text-5xl">
                {formatCurrency(estimate)}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Este cálculo es únicamente una estimación y no constituye una oferta definitiva.
                El valor final dependerá de la inspección física del material durante tu cita presencial.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
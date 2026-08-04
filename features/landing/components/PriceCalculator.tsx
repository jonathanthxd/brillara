"use client";

import { api } from "@/lib/client-api";
import {
  calculateEstimate,
  DEFAULT_SETTINGS,
  formatCurrency,
  KARATS,
  Metal,
  pricePerGram,
  PublicSettings,
  UNITS,
} from "@/lib/pricing";
import { useEffect, useMemo, useState } from "react";

interface SettingsResponse {
  settings: PublicSettings;
}

export function PriceCalculator() {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_SETTINGS);
  const [metal, setMetal] = useState<Metal>("gold");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("g");
  const [karat, setKarat] = useState(24);
  const [estimate, setEstimate] = useState<number | null>(null);

  useEffect(() => {
    void api<SettingsResponse>("/api/public/settings")
      .then((data) => setSettings(data.settings))
      .catch(() => undefined);
  }, []);

  const prices = useMemo(
    () => (["gold", "silver"] as Metal[]).map((item) => ({ metal: item, price: pricePerGram(item, settings) })),
    [settings],
  );

  function handleCalculate() {
    const value = Number.parseFloat(weight);
    if (!Number.isFinite(value) || value <= 0) return;
    setEstimate(calculateEstimate(metal, value, unit, karat, settings));
  }

  return (
    <section id="precio" className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block text-xs font-medium uppercase tracking-widest text-primary">Estimador de BRILLARA</span>
          <h2 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">¿Cuánto podría valer tu oro?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Consulta nuestra referencia de compra y calcula una estimación al instante.</p>
        </div>
        <div className="mb-12 grid gap-6 md:grid-cols-2">
          {prices.map((item) => (
            <button
              key={item.metal}
              type="button"
              onClick={() => { setMetal(item.metal); setEstimate(null); }}
              className={`rounded-2xl border p-6 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary ${metal === item.metal ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-card hover:border-primary/30"}`}
            >
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{item.metal === "gold" ? "Oro" : "Plata"}</p><p className="mt-1 font-heading text-3xl font-bold text-foreground">{formatCurrency(item.price)}<span className="ml-1 text-sm font-normal text-muted-foreground">/ gramo puro</span></p></div>
                <span aria-hidden className={`h-4 w-4 rounded-full border-2 ${metal === item.metal ? "border-primary bg-primary" : "border-border"}`} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Referencia de compra; el valor final se confirma tras evaluación presencial.</p>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
          <h3 className="mb-6 font-heading text-2xl font-semibold text-foreground">Calcula tu estimación</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground" htmlFor="weight">Peso</label><input id="weight" type="number" min="0" step="0.01" value={weight} onChange={(event) => { setWeight(event.target.value); setEstimate(null); }} placeholder="Ej.: 10.5" className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground" htmlFor="unit">Unidad</label><select id="unit" value={unit} onChange={(event) => { setUnit(event.target.value); setEstimate(null); }} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20">{UNITS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground" htmlFor="karat">Kilataje</label><select id="karat" value={karat} onChange={(event) => { setKarat(Number(event.target.value)); setEstimate(null); }} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20">{KARATS.map((item) => <option key={item.value} value={item.value}>{item.label} ({(item.purity * 100).toFixed(1)}% puro)</option>)}</select></div>
          </div>
          <button type="button" onClick={handleCalculate} disabled={!weight || Number.parseFloat(weight) <= 0} className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">Calcular estimación</button>
          {estimate !== null && <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6"><p className="text-sm font-medium text-muted-foreground">Estimación aproximada que BRILLARA podría pagar:</p><p className="mt-2 font-heading text-4xl font-bold text-primary md:text-5xl">{formatCurrency(estimate)}</p><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Es una orientación, no una oferta final. El valor se confirma mediante inspección física del material.</p></div>}
        </div>
      </div>
    </section>
  );
}

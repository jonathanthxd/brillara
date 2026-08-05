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
import { Calculator, CircleDollarSign, Gem, Sparkles } from "lucide-react";
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
    <section id="precio" className="border-t border-border px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center sm:mb-14">
          <span className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><Sparkles className="size-3.5" aria-hidden /> Estimador de BRILLARA</span>
          <h2 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">¿Cuánto podría valer tu oro?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Consulta nuestra referencia de compra y calcula una estimación al instante.</p>
        </div>
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {prices.map((item) => (
            <button
              key={item.metal}
              type="button"
              onClick={() => { setMetal(item.metal); setEstimate(null); }}
              className={`rounded-3xl border p-5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary sm:p-6 ${metal === item.metal ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">{item.metal === "gold" ? <Gem className="size-5" aria-hidden /> : <CircleDollarSign className="size-5" aria-hidden />}</span><div><p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{item.metal === "gold" ? "Oro" : "Plata"}</p><p className="mt-0.5 text-xs text-muted-foreground">Referencia por gramo puro</p></div></div>
                <span aria-hidden className={`flex size-5 items-center justify-center rounded-full border-2 ${metal === item.metal ? "border-primary bg-primary" : "border-border"}`}><span className={`size-1.5 rounded-full ${metal === item.metal ? "bg-primary-foreground" : "bg-transparent"}`} /></span>
              </div>
              <p className="mt-5 font-heading text-3xl font-bold text-foreground">{formatCurrency(item.price)}<span className="ml-1 font-sans text-sm font-normal text-muted-foreground">/ g</span></p>
              <p className="mt-2 text-xs text-muted-foreground">El valor final se confirma tras evaluación presencial.</p>
            </button>
          ))}
        </div>
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl shadow-primary/5 sm:p-8 md:p-10">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-heading text-2xl font-semibold text-foreground">Calcula tu estimación</h3><p className="mt-1 text-sm text-muted-foreground">Selecciona el metal, peso, unidad y kilataje.</p></div><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Calculator className="size-5" aria-hidden /></span></div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground" htmlFor="weight">Peso</label><input id="weight" type="number" inputMode="decimal" min="0" step="0.01" value={weight} onChange={(event) => { setWeight(event.target.value); setEstimate(null); }} placeholder="Ej.: 10.5" className="input" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground" htmlFor="unit">Unidad</label><select id="unit" value={unit} onChange={(event) => { setUnit(event.target.value); setEstimate(null); }} className="input">{UNITS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground" htmlFor="karat">Kilataje</label><select id="karat" value={karat} onChange={(event) => { setKarat(Number(event.target.value)); setEstimate(null); }} className="input">{KARATS.map((item) => <option key={item.value} value={item.value}>{item.label} ({(item.purity * 100).toFixed(1)}% puro)</option>)}</select></div>
          </div>
          <button type="button" onClick={handleCalculate} disabled={!weight || Number.parseFloat(weight) <= 0} className="mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Calculator className="size-4" aria-hidden /> Calcular estimación</button>
          {estimate !== null && <div aria-live="polite" className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6"><p className="text-sm font-medium text-muted-foreground">Estimación aproximada que BRILLARA podría pagar:</p><p className="mt-2 font-heading text-4xl font-bold text-primary md:text-5xl">{formatCurrency(estimate)}</p><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Es una orientación, no una oferta final. El valor se confirma mediante inspección física del material.</p></div>}
        </div>
      </div>
    </section>
  );
}

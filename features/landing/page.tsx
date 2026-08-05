import { PriceCalculator } from "./components/PriceCalculator";
import { Announcements } from "./components/Announcements";
import { FAQ } from "./components/FAQ";
import { ContactSection } from "./components/ContactSection";
import { ArrowRight, BadgeCheck, Calculator, CalendarCheck2, CircleDollarSign, Gem, ShieldCheck } from "lucide-react";
import { LiquidMetalLink } from "@/components/ui/liquid-metal-button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Announcements />

      <section className="relative isolate overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_10%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_27rem),radial-gradient(circle_at_85%_75%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_28rem)]" />
        <div className="brillara-orbit pointer-events-none absolute -right-24 -top-32 -z-10 size-[31rem] rounded-full border border-primary/15" />
        <div className="brillara-orbit pointer-events-none absolute -bottom-56 -left-28 -z-10 size-[35rem] rounded-full border border-primary/10" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
          <div className="brillara-reveal text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <BadgeCheck className="size-3.5" aria-hidden /> Compra de metales preciosos · Los Ángeles, CA
            </span>
            <h1 className="mt-6 max-w-4xl font-heading text-5xl font-bold leading-[0.97] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Una forma más clara de vender <span className="text-primary">tu oro.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0 lg:text-xl">
              Obtén una referencia honesta para oro, plata, joyas y diamantes. Evaluación profesional, transparencia total y pago inmediato en tu cita presencial.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <LiquidMetalLink href="#precio" size="lg" icon={<ArrowRight className="size-4" aria-hidden />}>Ver precio de hoy</LiquidMetalLink>
          <a
            href="#como-funciona"
            className="inline-flex h-14 items-center justify-center rounded-full border border-border bg-card/80 px-7 text-base font-medium text-card-foreground transition-all hover:border-primary/30 hover:bg-accent"
          >
            Cómo Funciona
          </a>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-primary" aria-hidden /> Sin compromisos</span>
              <span className="inline-flex items-center gap-2"><CircleDollarSign className="size-4 text-primary" aria-hidden /> Precio visible</span>
              <span className="inline-flex items-center gap-2"><CalendarCheck2 className="size-4 text-primary" aria-hidden /> Cita presencial</span>
            </div>
          </div>

          <aside className="brillara-reveal brillara-reveal-delay relative mx-auto w-full max-w-md rounded-[2rem] border border-border bg-card/85 p-5 shadow-2xl shadow-primary/10 backdrop-blur sm:p-7">
            <div className="brillara-float absolute -right-3 -top-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"><Gem className="size-5" aria-hidden /></div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Tu experiencia</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight text-foreground">Información antes de negociar.</h2>
            <div className="mt-6 space-y-3">
              <HeroStep number="01" icon={<CircleDollarSign className="size-4" aria-hidden />} title="Consulta la referencia" text="Revisa lo que pagamos por gramo." />
              <HeroStep number="02" icon={<Calculator className="size-4" aria-hidden />} title="Calcula tu estimado" text="Usa peso y kilataje para orientarte." />
              <HeroStep number="03" icon={<CalendarCheck2 className="size-4" aria-hidden />} title="Agenda con confianza" text="Conversamos y definimos una cita." />
            </div>
          </aside>
        </div>
      </section>

      <section id="como-funciona" className="border-t border-border px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-16">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Proceso Simple
            </span>
            <h2 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Vender tu oro nunca fue tan fácil
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", icon: <CircleDollarSign className="size-5" aria-hidden />, title: "Consulta el Precio", desc: "Revisa el precio actualizado que pagamos por gramo de oro y plata en tiempo real." },
              { step: "02", icon: <Calculator className="size-5" aria-hidden />, title: "Calcula tu Estimado", desc: "Usa nuestra calculadora para saber cuánto podrías recibir según peso y kilataje." },
              { step: "03", icon: <Gem className="size-5" aria-hidden />, title: "Inicia tu Negociación", desc: "Abre un ticket, describe tu material, adjunta fotos y conversa con nuestro equipo." },
              { step: "04", icon: <CalendarCheck2 className="size-5" aria-hidden />, title: "Cita y Pago", desc: "Acordamos una reunión presencial en el área de Los Ángeles. Evaluación y pago inmediato." },
            ].map((item) => (
              <div key={item.step} className="brillara-card relative flex flex-col rounded-3xl border border-border bg-card p-6 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/5">
                <div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{item.icon}</span><span className="font-heading text-2xl font-bold text-primary/30">{item.step}</span></div>
                <h3 className="font-heading text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PriceCalculator />
      <FAQ />
      <ContactSection />
    </main>
  );
}

function HeroStep({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-3 rounded-2xl border border-border/80 bg-background/55 p-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">Paso {number}</p><p className="mt-0.5 text-sm font-semibold text-foreground">{title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{text}</p></div></div>;
}

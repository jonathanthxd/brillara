export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* HERO: La única pregunta que importa */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
        
        <span className="mb-4 inline-block rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
          Compra de Metales Preciosos · Los Ángeles, CA
        </span>
        
        <h1 className="max-w-4xl font-heading text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-7xl">
          ¿Quieres vender <span className="text-primary">tu oro?</span>
        </h1>
        
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Obtén el mejor precio por tu oro, plata, joyas y diamantes. Evaluación profesional, transparencia total y pago inmediato en tu cita presencial.
        </p>
        
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#precio"
            className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110"
          >
            Ver Precio del Oro Hoy
          </a>
          <a
            href="#como-funciona"
            className="inline-flex h-14 items-center justify-center rounded-full border border-border bg-card px-10 text-base font-medium text-card-foreground transition-all hover:bg-accent"
          >
            Cómo Funciona
          </a>
        </div>
      </section>

      {/* CÓMO FUNCIONA: 4 pasos simples */}
      <section id="como-funciona" className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <span className="mb-3 inline-block text-xs font-medium uppercase tracking-widest text-primary">
              Proceso Simple
            </span>
            <h2 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Vender tu oro nunca fue tan fácil
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Consulta el Precio",
                desc: "Revisa el precio actualizado que pagamos por gramo de oro y plata en tiempo real.",
              },
              {
                step: "02",
                title: "Calcula tu Estimado",
                desc: "Usa nuestra calculadora para saber cuánto podrías recibir según peso y kilataje.",
              },
              {
                step: "03",
                title: "Inicia tu Negociación",
                desc: "Abre un ticket, describe tu material, adjunta fotos y conversa con nuestro equipo.",
              },
              {
                step: "04",
                title: "Cita y Pago",
                desc: "Acordamos una reunión presencial en el área de Los Ángeles. Evaluación y pago inmediato.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="mb-4 font-heading text-4xl font-bold text-primary/20">
                  {item.step}
                </span>
                <h3 className="font-heading text-xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLACEHOLDER: Precio en vivo (próximo paso) */}
      <section id="precio" className="border-t border-border px-6 py-24 text-center">
        <span className="mb-3 inline-block text-xs font-medium uppercase tracking-widest text-primary">
          Precio del Día
        </span>
        <h2 className="font-heading text-3xl font-semibold text-foreground">Precio del Oro y Plata</h2>
        <p className="mt-4 text-muted-foreground">Próximamente: precio actualizado en tiempo real + calculadora.</p>
      </section>
    </main>
  );
}

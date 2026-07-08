export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        
        <span className="mb-4 inline-block rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Joyería Fina desde 2024
        </span>
        
        <h1 className="max-w-4xl font-heading text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-7xl lg:text-8xl">
          Iluminamos tu <span className="text-primary">historia</span>
        </h1>
        
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Piezas únicas diseñadas con precisión artesanal. Cada joya cuenta una historia de elegancia atemporal.
        </p>
        
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#coleccion"
            className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110"
          >
            Ver Colección
          </a>
          <a
            href="#contacto"
            className="inline-flex h-14 items-center justify-center rounded-full border border-border bg-card px-10 text-base font-medium text-card-foreground transition-all hover:bg-accent"
          >
            Diseña tu Joya
          </a>
        </div>
      </section>

      {/* Placeholder para próximas secciones */}
      <section id="coleccion" className="border-t border-border px-6 py-24 text-center">
        <h2 className="font-heading text-3xl font-semibold text-foreground">Colección Próximamente</h2>
      </section>
    </main>
  );
}

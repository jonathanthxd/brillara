export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-heading text-5xl font-bold tracking-tight text-foreground md:text-7xl lg:text-8xl">
        BRILLARA
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
        Donde el arte se convierte en legado. Joyería fina diseñada para iluminar
        tu historia.
      </p>
      <div className="mt-10 flex gap-4">
        <a
          href="#coleccion"
          className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:brightness-110"
        >
          Explorar Colección
        </a>
        <a
          href="#contacto"
          className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-card px-8 text-sm font-medium text-card-foreground transition-all hover:bg-accent"
        >
          Contactar
        </a>
      </div>
    </main>
  );
}
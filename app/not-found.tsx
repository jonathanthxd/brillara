import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <p className="font-heading text-8xl font-bold text-primary/20 md:text-9xl">
        404
      </p>
      <h1 className="mt-4 font-heading text-3xl font-bold text-foreground md:text-4xl">
        Página no encontrada
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        La página que buscas no existe o ha sido movida. Pero no te preocupes, en BRILLARA siempre encontramos valor.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/inicio"
          className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110"
        >
          Volver al inicio
        </Link>
        <Link
          href="/ticket/nuevo"
          className="inline-flex h-14 items-center justify-center rounded-full border border-border bg-card px-10 text-base font-medium text-card-foreground transition-all hover:bg-accent"
        >
          Iniciar negociación
        </Link>
      </div>
    </main>
  );
}

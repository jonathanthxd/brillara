import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-foreground">
          BRILLARA
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#coleccion" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Colección
          </Link>
          <Link href="#nosotros" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Nosotros
          </Link>
          <Link href="#contacto" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Contacto
          </Link>
        </nav>

        <Link
          href="#contacto"
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
        >
          Reservar Cita
        </Link>
      </div>
    </header>
  );
}

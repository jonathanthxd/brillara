"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-heading text-3xl font-bold text-foreground">Algo no salió como esperábamos</h1>
      <p className="mt-3 max-w-md text-muted-foreground">No se han perdido tus datos. Puedes intentar cargar la página otra vez.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Reintentar</button>
    </main>
  );
}

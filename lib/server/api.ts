import "server-only";

import { NextResponse } from "next/server";
import { ServerConfigurationError } from "./configuration";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export function jsonError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ServerConfigurationError) {
    const message = process.env.NODE_ENV === "development"
      ? `Falta configurar ${error.variable} en .env.local. Revisa README.md.`
      : "El servidor no está configurado correctamente. Contacta a BRILLARA.";

    console.error("Server configuration error", error.variable);
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const databaseCode = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";

  if (process.env.NODE_ENV === "development" && ["42P01", "42703", "PGRST202"].includes(databaseCode)) {
    console.error("Database migration error", databaseCode);
    return NextResponse.json(
      { error: "La migración de Supabase aún no está aplicada. Ejecuta supabase/migrations/20260804_secure_brillara.sql en Supabase SQL Editor." },
      { status: 503 },
    );
  }

  const databaseMessage = typeof error === "object" && error !== null && "message" in error
    ? String(error.message)
    : "";

  if (process.env.NODE_ENV === "development" && /invalid api key|jwt|unauthorized/i.test(databaseMessage)) {
    console.error("Supabase authentication error");
    return NextResponse.json(
      { error: "Supabase rechazó la configuración. Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local." },
      { status: 503 },
    );
  }

  console.error("Unexpected API error", error);
  return NextResponse.json(
    { error: "Ocurrió un error inesperado. Intenta de nuevo." },
    { status: 500 },
  );
}

export function assert(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) throw new ApiError(message, status);
}

export function isMissingTable(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "42P01";
}

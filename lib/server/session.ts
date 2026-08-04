import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ServerConfigurationError } from "./configuration";

export interface VisitorSession {
  id: string;
  name: string;
  ticketIds: string[];
}

export interface AdminSession {
  role: "admin";
}

export interface AdvisorSession {
  id: string;
  code: string;
  name: string;
}

type SessionCookie = "brillara_visitor" | "brillara_admin" | "brillara_advisor";

const ONE_YEAR = 60 * 60 * 24 * 365;
const ONE_DAY = 60 * 60 * 24;
const DEVELOPMENT_SESSION_SECRET = "brillara-development-only-session-secret-change-before-production";
let hasWarnedAboutDevelopmentSecret = false;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();

  if (secret && secret.length >= 32) {
    return secret;
  }

  // El entorno local debe permitir probar el flujo visual sin una configuración
  // previa. Nunca se usa este valor al construir o ejecutar producción.
  if (process.env.NODE_ENV === "development") {
    if (!hasWarnedAboutDevelopmentSecret) {
      console.warn(
        "[BRILLARA] SESSION_SECRET no está configurado. Se usa una clave temporal solo para desarrollo local.",
      );
      hasWarnedAboutDevelopmentSecret = true;
    }
    return DEVELOPMENT_SESSION_SECRET;
  }

  throw new ServerConfigurationError("SESSION_SECRET");
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encode(value: object): string {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode<T>(value: string | undefined): T | null {
  if (!value) return null;

  const [payload, signature, ...rest] = value.split(".");
  if (!payload || !signature || rest.length > 0) return null;

  const expectedSignature = sign(payload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

async function getSession<T>(cookieName: SessionCookie): Promise<T | null> {
  const cookieStore = await cookies();
  return decode<T>(cookieStore.get(cookieName)?.value);
}

function setSession<T>(
  response: NextResponse,
  cookieName: SessionCookie,
  session: T,
  maxAge: number,
): void {
  response.cookies.set(cookieName, encode(session as object), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

function clearSession(response: NextResponse, cookieName: SessionCookie): void {
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function createVisitorSession(name: string): VisitorSession {
  return { id: randomUUID(), name, ticketIds: [] };
}

export async function getVisitorSession(): Promise<VisitorSession | null> {
  const session = await getSession<VisitorSession>("brillara_visitor");

  if (!session || !session.id || !session.name || !Array.isArray(session.ticketIds)) {
    return null;
  }

  return session;
}

export function setVisitorSession(response: NextResponse, session: VisitorSession): void {
  setSession(response, "brillara_visitor", session, ONE_YEAR);
}

export function addTicketToVisitorSession(session: VisitorSession, ticketId: string): VisitorSession {
  const ticketIds = [...new Set([...session.ticketIds, ticketId])].slice(-50);
  return { ...session, ticketIds };
}

export function clearVisitorSession(response: NextResponse): void {
  clearSession(response, "brillara_visitor");
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getSession<AdminSession>("brillara_admin");
  return session?.role === "admin" ? session : null;
}

export function setAdminSession(response: NextResponse): void {
  setSession(response, "brillara_admin", { role: "admin" }, ONE_DAY);
}

export function clearAdminSession(response: NextResponse): void {
  clearSession(response, "brillara_admin");
}

export async function getAdvisorSession(): Promise<AdvisorSession | null> {
  const session = await getSession<AdvisorSession>("brillara_advisor");

  if (!session || !session.id || !session.code || !session.name) {
    return null;
  }

  return session;
}

export function setAdvisorSession(response: NextResponse, session: AdvisorSession): void {
  setSession(response, "brillara_advisor", session, ONE_DAY);
}

export function clearAdvisorSession(response: NextResponse): void {
  clearSession(response, "brillara_advisor");
}

export function passwordsMatch(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  return inputBuffer.length === expectedBuffer.length && timingSafeEqual(inputBuffer, expectedBuffer);
}

import "server-only";

import { ApiError } from "./api";

interface Bucket {
  attempts: number;
  resetAt: number;
}

const loginBuckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1_000;
const MAX_ATTEMPTS = 6;

function cleanup(now: number): void {
  if (loginBuckets.size < 500) return;
  for (const [key, bucket] of loginBuckets) {
    if (bucket.resetAt <= now) loginBuckets.delete(key);
  }
}

/**
 * A lightweight server-side guard for credential stuffing. It deliberately
 * keys on both address and submitted code and does not reveal whether the
 * code belongs to a real user. Production deployments with multiple server
 * instances can replace this with a shared edge limiter without API changes.
 */
export function assertPartnerLoginRateLimit(address: string, code: string): void {
  const now = Date.now();
  cleanup(now);
  const key = `${address}:${code.toLowerCase()}`;
  const current = loginBuckets.get(key);
  if (current && current.resetAt > now && current.attempts >= MAX_ATTEMPTS) {
    throw new ApiError("Demasiados intentos de acceso. Espera unos minutos e inténtalo de nuevo.", 429);
  }
}

export function recordPartnerLoginAttempt(address: string, code: string, successful: boolean): void {
  const now = Date.now();
  const key = `${address}:${code.toLowerCase()}`;
  if (successful) {
    loginBuckets.delete(key);
    return;
  }
  const current = loginBuckets.get(key);
  if (!current || current.resetAt <= now) {
    loginBuckets.set(key, { attempts: 1, resetAt: now + WINDOW_MS });
    return;
  }
  current.attempts += 1;
}

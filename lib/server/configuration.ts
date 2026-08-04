import "server-only";

export class ServerConfigurationError extends Error {
  constructor(public readonly variable: string) {
    super(`${variable} is not configured correctly.`);
    this.name = "ServerConfigurationError";
  }
}

export function getRequiredServerEnvironment(
  name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY",
): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new ServerConfigurationError(name);
  }

  return value;
}

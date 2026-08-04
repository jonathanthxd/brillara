import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.cwd(), ".env.local");
const values = { ...process.env };

if (existsSync(file)) {
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    values[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

const checks = [
  ["SESSION_SECRET", (value) => Boolean(value && value.length >= 32), "Debe tener al menos 32 caracteres."],
  ["SUPABASE_URL", (value) => Boolean(value && /^https:\/\/.+\.supabase\.co$/i.test(value)), "Usa la URL HTTPS de tu proyecto Supabase."],
  ["SUPABASE_SERVICE_ROLE_KEY", (value) => Boolean(value && !value.includes("your-service-role-key")), "Copia la clave service_role de Supabase, no la anon key."],
  ["ADMIN_PASSWORD", (value) => Boolean(value && value.length >= 12 && !value.includes("replace-with")), "Usa una contraseña nueva de al menos 12 caracteres."],
];

let hasProblem = false;
console.log("\nComprobación de configuración BRILLARA\n");

for (const [name, valid, hint] of checks) {
  const value = values[name];
  if (valid(value)) {
    console.log(`✓ ${name}`);
  } else {
    hasProblem = true;
    console.log(`✗ ${name} — ${hint}`);
  }
}

if (hasProblem) {
  console.log("\nCrea o completa .env.local usando .env.example. No subas ese archivo a GitHub.\n");
  process.exitCode = 1;
} else {
  console.log("\nTodo listo para ejecutar pnpm dev o desplegar.\n");
}

import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getRequiredServerEnvironment } from "./configuration";

/**
 * Este cliente solo se usa dentro de rutas del servidor. Nunca debe llegar al
 * navegador: el service role evita que un visitante pueda leer todos los tickets.
 */
export function getSupabaseAdmin() {
  return createClient(
    getRequiredServerEnvironment("SUPABASE_URL"),
    getRequiredServerEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

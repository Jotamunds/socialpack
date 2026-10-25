import "server-only";
import { createClient } from "@supabase/supabase-js";
import { validateEnv } from "@/lib/env";

/**
 * Cliente Supabase com privilégios administrativos (service_role).
 * Uso estrito no backend para bypass de RLS e orquestração de cotas/storage.
 * NUNCA importar ou referenciar no cliente.
 */
export function createAdminClient() {
  const env = validateEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

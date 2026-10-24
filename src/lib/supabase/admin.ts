import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com privilégios administrativos (service_role).
 * Uso estrito no backend para bypass de RLS e orquestração de cotas/storage.
 * NUNCA importar ou referenciar no cliente.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Configuração administrativa incompleta: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

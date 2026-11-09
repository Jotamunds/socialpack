import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso exclusivo no lado do cliente (navegador).
 * Utiliza apenas variáveis públicas: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing public Supabase keys in the client (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Utilitário de conexão com Supabase seguindo OWASP e Next.js Server Components.
 * As chaves e requisições sensíveis ficam estritamente no ambiente do servidor.
 */

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  return Boolean(
    url &&
      key &&
      url.startsWith("http") &&
      !url.includes("your-project-url") &&
      !key.includes("your-anon-key"),
  );
}

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!;
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  )!;

  try {
    cachedClient = createSupabaseClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedClient;
  } catch (error) {
    console.warn("[SocialPack] Falha ao inicializar cliente Supabase:", error);
    return null;
  }
}

/**
 * Alias de conveniência para obter a instância do cliente Supabase no servidor.
 */
export function createClient(): SupabaseClient | null {
  return getSupabaseServerClient();
}


import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateEnv } from "@/lib/env";

/**
 * Cliente Supabase com contexto de sessão do usuário no Next.js App Router.
 * Lê e propaga cookies HttpOnly de autenticação com segurança.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = validateEnv();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Chamada a partir de Server Component: cookies são somente leitura.
          // O middleware cuida da sincronização da sessão.
        }
      },
    },
  });
}

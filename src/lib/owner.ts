import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * O dono é só quem tem linha em public.app_owners.
 * userId tem de ser o id de auth.getUser() nesta requisição.
 * Erro, tabela ausente ou linha de outra pessoa devolve false: o gate atual continua.
 */
export async function isAppOwner(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from("app_owners")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data?.user_id) return false;
    return data.user_id.toLowerCase() === userId.toLowerCase();
  } catch {
    return false;
  }
}

import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./server";

/**
 * Sessão obrigatória para páginas privadas.
 * Sem usuário autenticado, redireciona para o login.
 * Não consulta plano nem status de assinatura.
 */
export async function requirePageAccess(redirectTo: string): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return { userId: user.id };
}

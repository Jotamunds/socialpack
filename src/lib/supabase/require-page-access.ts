import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./server";
import {
  requireValidSubscription,
  type SubscriptionGuardResult,
} from "./subscription-guard";

export type PageAccessResult =
  | { ok: true; userId: string; subscription: NonNullable<SubscriptionGuardResult["subscription"]> }
  | { ok: false; userId: string; error: string; code: "SUBSCRIPTION_REQUIRED" };

/**
 * Autenticação + assinatura válida para páginas privadas.
 * Sem sessão → redirect login. Sem assinatura válida → ok:false para UI de bloqueio.
 */
export async function requirePageAccess(redirectTo: string): Promise<PageAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const sub = await requireValidSubscription(user.id);
  if (!sub.isValid || !sub.subscription) {
    return {
      ok: false,
      userId: user.id,
      code: "SUBSCRIPTION_REQUIRED",
      error: sub.error || "É necessária uma assinatura ativa para acessar esta área.",
    };
  }

  return {
    ok: true,
    userId: user.id,
    subscription: sub.subscription,
  };
}

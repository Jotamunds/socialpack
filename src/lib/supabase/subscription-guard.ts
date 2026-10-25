import "server-only";
import { createAdminClient } from "./admin";
import { createClient } from "./server";

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | string;
  plan: "starter" | "pro" | string;
  current_period_end: string;
  current_period_start?: string | null;
  cancel_at_period_end?: boolean;
  company_quota?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface SubscriptionGuardResult {
  isValid: boolean;
  subscription: SubscriptionRecord | null;
  error?: string;
}

function hasValidPeriod(periodEndRaw: string | null | undefined): boolean {
  if (!periodEndRaw) return false;
  const periodEnd = new Date(periodEndRaw);
  return !isNaN(periodEnd.getTime()) && periodEnd.getTime() > Date.now();
}

/**
 * Assinatura com acesso: active/trialing com período vigente,
 * ou canceled com cancel_at_period_end e período ainda vigente.
 */
export function subscriptionGrantsAccess(
  subscription: Pick<
    SubscriptionRecord,
    "status" | "current_period_end" | "cancel_at_period_end"
  >
): boolean {
  if (!hasValidPeriod(subscription.current_period_end)) {
    return false;
  }

  if (subscription.status === "active" || subscription.status === "trialing") {
    return true;
  }

  if (subscription.status === "canceled" && subscription.cancel_at_period_end === true) {
    return true;
  }

  return false;
}

/**
 * Valida no servidor se o usuário possui assinatura com direito de uso.
 */
export async function requireValidSubscription(
  userId: string
): Promise<SubscriptionGuardResult> {
  if (!userId) {
    return {
      isValid: false,
      subscription: null,
      error: "ID de usuário obrigatório para validação de assinatura.",
    };
  }

  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : await createClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        isValid: false,
        subscription: null,
        error: `Falha ao consultar assinatura: ${error.message}`,
      };
    }

    if (!data) {
      return {
        isValid: false,
        subscription: null,
        error: "Nenhum registro de assinatura encontrado para este usuário.",
      };
    }

    const subscription = data as SubscriptionRecord;

    if (subscription.status === "incomplete") {
      return {
        isValid: false,
        subscription,
        error: "Assinatura incompleta. Conclua a ativação do plano para continuar.",
      };
    }

    if (!subscriptionGrantsAccess(subscription)) {
      if (!hasValidPeriod(subscription.current_period_end)) {
        return {
          isValid: false,
          subscription,
          error: "Período da assinatura expirado.",
        };
      }
      return {
        isValid: false,
        subscription,
        error: `Status da assinatura (${subscription.status}) não permite operação.`,
      };
    }

    return {
      isValid: true,
      subscription,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro desconhecido ao verificar assinatura.";
    return {
      isValid: false,
      subscription: null,
      error: message,
    };
  }
}

/**
 * Lança exceção caso a assinatura não seja válida.
 */
export async function assertValidSubscription(
  userId: string
): Promise<SubscriptionRecord> {
  const result = await requireValidSubscription(userId);
  if (!result.isValid || !result.subscription) {
    throw new Error(result.error || "Acesso negado: assinatura inativa ou expirada.");
  }
  return result.subscription;
}

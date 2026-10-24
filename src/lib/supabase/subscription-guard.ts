import "server-only";
import { createAdminClient } from "./admin";
import { createClient } from "./server";

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | string;
  plan: "starter" | "pro" | string;
  current_period_end: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface SubscriptionGuardResult {
  isValid: boolean;
  subscription: SubscriptionRecord | null;
  error?: string;
}

/**
 * Valida no servidor se o usuário possui uma assinatura válida em public.subscriptions
 * com status "active" ou "trialing" e data de expiração (current_period_end) maior que agora.
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

    const isActiveStatus = data.status === "active" || data.status === "trialing";
    const periodEnd = new Date(data.current_period_end);
    const isPeriodValid = !isNaN(periodEnd.getTime()) && periodEnd.getTime() > Date.now();

    if (!isActiveStatus) {
      return {
        isValid: false,
        subscription: data as SubscriptionRecord,
        error: `Status da assinatura (${data.status}) não permite operação. Requer active ou trialing.`,
      };
    }

    if (!isPeriodValid) {
      return {
        isValid: false,
        subscription: data as SubscriptionRecord,
        error: "Período da assinatura expirado.",
      };
    }

    return {
      isValid: true,
      subscription: data as SubscriptionRecord,
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
 * Útil para chamadas de Server Action que exigem assinatura válida como pré-condição.
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

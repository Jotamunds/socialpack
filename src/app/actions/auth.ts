"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizePublicErrorMessage } from "@/lib/public-error";

export type AuthActionResponse = {
  ok: boolean;
  error?: string;
  message?: string;
  code?: "UNAUTHORIZED" | "ACTIVATION_ERROR";
};

function planQuota(plan: "starter" | "pro"): number {
  return plan === "pro" ? 3 : 1;
}

function periodBounds(days = 30) {
  const start = new Date();
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return {
    current_period_start: start.toISOString(),
    current_period_end: end.toISOString(),
  };
}

/**
 * Ativa a assinatura incomplete do usuário autenticado com o plano escolhido (MVP).
 * Quem se cadastra só via Auth anon e não chama esta action permanece incomplete.
 */
export async function activateChosenPlanAction(
  planInput?: "starter" | "pro" | string
): Promise<AuthActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        ok: false,
        code: "UNAUTHORIZED",
        error: "Sessão necessária para ativar a assinatura.",
      };
    }

    const metadataPlan = user.user_metadata?.selected_plan;
    const rawPlan = planInput || metadataPlan || "starter";
    const plan: "starter" | "pro" = rawPlan === "pro" ? "pro" : "starter";

    const admin = createAdminClient();

    // O trigger handle_new_user pode ainda não ter commitado a linha incomplete
    let subscription: {
      id: string;
      status: string;
      plan: string;
      current_period_end: string | null;
      cancel_at_period_end: boolean | null;
    } | null = null;

    for (let attempt = 0; attempt < 6; attempt++) {
      const { data, error: subError } = await admin
        .from("subscriptions")
        .select("id, status, plan, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subError) {
        return {
          ok: false,
          code: "ACTIVATION_ERROR",
          error: "Não foi possível consultar a assinatura.",
        };
      }

      if (data) {
        subscription = data;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }

    if (!subscription) {
      return {
        ok: false,
        code: "ACTIVATION_ERROR",
        error: "Assinatura não encontrada. Tente novamente em instantes.",
      };
    }

    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;
    const periodValid =
      periodEnd !== null && !isNaN(periodEnd.getTime()) && periodEnd.getTime() > Date.now();

    // Já ativo (ou trial legado) com período válido — idempotente
    if (
      (subscription.status === "active" || subscription.status === "trialing") &&
      periodValid
    ) {
      return {
        ok: true,
        message: "Assinatura já está ativa.",
      };
    }

    // Cancelado com acesso até o fim do ciclo — não reativa pelo cadastro
    if (
      subscription.status === "canceled" &&
      subscription.cancel_at_period_end &&
      periodValid
    ) {
      return {
        ok: true,
        message: "Assinatura cancelada com acesso até o fim do período atual.",
      };
    }

    if (subscription.status !== "incomplete" && subscription.status !== "canceled") {
      return {
        ok: false,
        code: "ACTIVATION_ERROR",
        error: "Esta assinatura não pode ser ativada automaticamente.",
      };
    }

    const bounds = periodBounds(30);
    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        plan,
        status: "active",
        company_quota: planQuota(plan),
        cancel_at_period_end: false,
        current_period_start: bounds.current_period_start,
        current_period_end: bounds.current_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("id", subscription.id);

    if (updateError) {
      return {
        ok: false,
        code: "ACTIVATION_ERROR",
        error: "Falha ao ativar a assinatura. Tente novamente.",
      };
    }

    return {
      ok: true,
      message:
        plan === "pro"
          ? "Plano Pro ativado por 30 dias."
          : "Plano Starter ativado por 30 dias.",
    };
  } catch (err: unknown) {
    return {
      ok: false,
      code: "ACTIVATION_ERROR",
      error: sanitizePublicErrorMessage(err),
    };
  }
}

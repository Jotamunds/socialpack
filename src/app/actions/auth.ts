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
 * Desativada: Assinaturas são ativadas EXCLUSIVAMENTE via confirmação de pagamento do gateway (Asaas).
 * Qualquer tentativa de ativação direta sem pagamento é rejeitada por segurança.
 */
export async function activateChosenPlanAction(): Promise<AuthActionResponse> {
  return {
    ok: false,
    code: "ACTIVATION_ERROR",
    error: "A ativação de plano exige confirmação de pagamento via gateway de cobrança.",
  };
}

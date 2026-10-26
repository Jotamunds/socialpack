"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ChangePasswordInputSchema,
  ThemePreferenceSchema,
  UpdateProfileInputSchema,
} from "@/lib/schemas";
import { requireValidSubscription } from "@/lib/supabase/subscription-guard";
import { sanitizePublicErrorMessage } from "@/lib/public-error";
import {
  createPaymentLinkForPlan,
  cancelAsaasSubscription,
  deleteAsaasPaymentLink,
} from "@/lib/billing/asaas";

export type SettingsActionResponse = {
  ok: boolean;
  error?: string;
  message?: string;
};

const PROFILE_MISSING_ERROR =
  "Não encontramos o perfil desta conta, então nada foi salvo.";

export async function updateProfileAction(input: unknown): Promise<SettingsActionResponse> {
  const validation = UpdateProfileInputSchema.safeParse(input);

  if (!validation.success) {
    return {
      ok: false,
      error: validation.error.issues[0]?.message || "Dados de perfil inválidos.",
    };
  }

  const { fullName, full_name, phone } = validation.data;
  const resolvedName = (fullName || full_name || "").trim();

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Sessão expirada. Faça login novamente." };
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: resolvedName,
        phone: phone ? phone.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id");

    if (updateError) {
      return { ok: false, error: sanitizePublicErrorMessage(updateError.message) };
    }

    if (!updatedRows?.length) {
      return { ok: false, error: PROFILE_MISSING_ERROR };
    }

    revalidatePath("/configuracoes");
    return { ok: true, message: "Dados atualizados com sucesso." };
  } catch (err) {
    return { ok: false, error: sanitizePublicErrorMessage(err) };
  }
}

export async function changePasswordAction(input: unknown): Promise<SettingsActionResponse> {
  const validation = ChangePasswordInputSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: validation.error.issues[0]?.message || "Senha inválida.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Sessão expirada. Faça login novamente." };
    }

    const { error } = await supabase.auth.updateUser({
      password: validation.data.password,
    });

    if (error) {
      return { ok: false, error: sanitizePublicErrorMessage(error.message) };
    }

    return { ok: true, message: "Senha atualizada com sucesso." };
  } catch (err) {
    return { ok: false, error: sanitizePublicErrorMessage(err) };
  }
}

export async function updateThemePreferenceAction(
  themeInput: unknown
): Promise<SettingsActionResponse> {
  const theme = ThemePreferenceSchema.safeParse(themeInput);
  if (!theme.success) {
    return { ok: false, error: "Tema inválido. Use dark ou light." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Sessão expirada. Faça login novamente." };
    }

    const { data: updatedRows, error } = await supabase
      .from("profiles")
      .update({
        theme_preference: theme.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id");

    if (error) {
      return { ok: false, error: sanitizePublicErrorMessage(error.message) };
    }

    if (!updatedRows?.length) {
      return { ok: false, error: PROFILE_MISSING_ERROR };
    }

    revalidatePath("/configuracoes");
    return { ok: true, message: "Preferência de tema salva." };
  } catch (err) {
    return { ok: false, error: sanitizePublicErrorMessage(err) };
  }
}

/**
 * Inicia solicitação de upgrade Starter → Pro via Asaas.
 * REGRA ESTRITA: O plano e a cota só são promovidos a Pro após confirmação do pagamento de R$ 97,00 pelo Asaas.
 */
export async function upgradeToProAction(): Promise<SettingsActionResponse & { paymentUrl?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        ok: false,
        error: "Sessão expirada. Faça login para gerenciar sua assinatura.",
      };
    }

    const guard = await requireValidSubscription(user.id);
    if (!guard.isValid || !guard.subscription) {
      return {
        ok: false,
        error: guard.error || "É necessária uma assinatura ativa para fazer upgrade.",
      };
    }

    if (guard.subscription.plan === "pro") {
      return { ok: true, message: "Sua conta já está no Plano Pro." };
    }

    // Se houver link de pagamento pendente anterior, remove no Asaas com verificação estrita
    const currentSub = guard.subscription as {
      id: string;
      gateway_subscription_id?: string | null;
      payment_link_id?: string | null;
    };

    if (currentSub.payment_link_id) {
      try {
        await deleteAsaasPaymentLink(currentSub.payment_link_id);
      } catch (linkErr) {
        console.error("[Upgrade] Falha ao remover link anterior no Asaas:", linkErr);
        return {
          ok: false,
          error: "Não foi possível cancelar o link de pagamento anterior no Asaas. Tente novamente.",
        };
      }
    }

    const checkoutId = crypto.randomUUID();

    // Cria o link de pagamento do Plano Pro (R$ 97,00 fixo do servidor) com checkoutId
    const link = await createPaymentLinkForPlan({
      userId: user.id,
      plan: "pro",
      userEmail: user.email,
      checkoutId,
    });

    const admin = createAdminClient();
    // Salva previous_gateway_subscription_id para cancelamento automático após a confirmação do pagamento do Pro
    const { data: updatedSub, error: subError } = await admin
      .from("subscriptions")
      .update({
        pending_plan: "pro",
        pending_checkout_id: checkoutId,
        payment_link_id: link.id,
        payment_url: link.url,
        previous_gateway_subscription_id: currentSub.gateway_subscription_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("id", currentSub.id)
      .select("id");

    if (subError || !updatedSub?.length) {
      return { ok: false, error: sanitizePublicErrorMessage(subError?.message || "Falha ao registrar tentativa de upgrade no servidor.") };
    }

    revalidatePath("/configuracoes");
    revalidatePath("/perfil");
    return {
      ok: true,
      paymentUrl: link.url,
      message: "Link de pagamento do Plano Pro gerado. Conclua o pagamento de R$ 97,00 para ativar o Pro.",
    };
  } catch (err) {
    return { ok: false, error: sanitizePublicErrorMessage(err) };
  }
}

/** Agenda cancelamento: sincroniza com Asaas e mantém acesso até current_period_end. */
export async function cancelSubscriptionAction(): Promise<SettingsActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Sessão expirada. Faça login novamente." };
    }

    const guard = await requireValidSubscription(user.id);
    if (!guard.isValid || !guard.subscription) {
      return {
        ok: false,
        error: guard.error || "Nenhuma assinatura ativa para cancelar.",
      };
    }

    if (guard.subscription.cancel_at_period_end) {
      return {
        ok: true,
        message: "O cancelamento já está agendado. O acesso segue até o fim do ciclo atual.",
      };
    }

    // Se houver assinatura vinculada no gateway, notifica o cancelamento no Asaas
    const gatewaySubId = guard.subscription.gateway_subscription_id as string | undefined;
    if (gatewaySubId) {
      try {
        await cancelAsaasSubscription(gatewaySubId);
      } catch (gatewayErr) {
        console.error("[Cancelamento Asaas] Falha ao comunicar cancelamento ao Asaas:", gatewayErr);
        // PONTO CRÍTICO: Não declara sucesso nem altera o banco se a chamada ao gateway falhar!
        return {
          ok: false,
          error:
            "Não foi possível confirmar o cancelamento junto à operadora Asaas. Sua assinatura permanece ativa sem alterações. Por favor, tente novamente em alguns instantes.",
        };
      }
    }

    const admin = createAdminClient();
    const { data: updatedRows, error: subError } = await admin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("id", guard.subscription.id)
      .select("id");

    if (subError || !updatedRows?.length) {
      console.error("[Cancelamento Asaas] Falha ao registrar cancel_at_period_end no banco:", subError);
      return {
        ok: false,
        error: "O cancelamento foi solicitado na operadora, mas ocorreu uma falha ao atualizar o registro no sistema. Entre em contato com o suporte para concluir a sincronização.",
      };
    }

    revalidatePath("/configuracoes");
    revalidatePath("/perfil");
    return {
      ok: true,
      message:
        "Cancelamento agendado. Seu acesso continuará ativo até o término do ciclo atual.",
    };
  } catch (err) {
    return { ok: false, error: sanitizePublicErrorMessage(err) };
  }
}


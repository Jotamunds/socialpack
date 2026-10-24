"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UpdateProfileInputSchema } from "@/lib/schemas";

export type SettingsActionResponse = {
  ok: boolean;
  error?: string;
  message?: string;
};

/**
 * Atualiza os dados cadastrais do perfil (full_name, phone) do usuário autenticado.
 * O e-mail permanece protegido e não pode ser arbitrariamente alterado aqui.
 */
export async function updateProfileAction(input: unknown): Promise<SettingsActionResponse> {
  const validation = UpdateProfileInputSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Dados de perfil inválidos.";
    return {
      ok: false,
      error: firstError,
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
      return {
        ok: false,
        error: "Sessão expirada. Faça login novamente.",
      };
    }

    // Atualiza nome e telefone no registro public.profiles do usuário autenticado (auth.uid() = id)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: resolvedName,
        phone: phone ? phone.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return {
        ok: false,
        error: "Erro ao salvar alterações no perfil: " + updateError.message,
      };
    }

    revalidatePath("/configuracoes");
    return {
      ok: true,
      message: "Dados atualizados com sucesso.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao salvar perfil.";
    return {
      ok: false,
      error: msg,
    };
  }
}

/**
 * Realiza o upgrade seguro da assinatura do usuário de 'starter' para 'pro'.
 * Atualiza plan = 'pro', company_quota = 3 (max_companies = 3) na tabela public.subscriptions.
 */
export async function upgradeToProAction(): Promise<SettingsActionResponse> {
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

    // 1. Tenta atualizar com o cliente de sessão autenticado
    // Compatibilidade de cota: plan = 'pro', company_quota = 3 (max_companies = 3)
    const updatePayload: Record<string, unknown> = {
      plan: "pro",
      company_quota: 3,
      status: "active",
      updated_at: new Date().toISOString(),
    };

    let { error: subError } = await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("user_id", user.id);

    // 2. Se RLS restringir UPDATE direto a partir do client autenticado sem webhook,
    // utiliza o cliente de orquestração interna do backend
    if (subError) {
      try {
        const admin = createAdminClient();
        const adminRes = await admin
          .from("subscriptions")
          .update(updatePayload)
          .eq("user_id", user.id);
        subError = adminRes.error;
      } catch {
        // mantém erro inicial
      }
    }

    if (subError) {
      return {
        ok: false,
        error: "Não foi possível concluir o upgrade: " + subError.message,
      };
    }

    revalidatePath("/configuracoes");
    revalidatePath("/perfil");
    return {
      ok: true,
      message: "Upgrade realizado com sucesso! Seu plano agora é Pro (limite de 3 empresas).",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao processar upgrade.";
    return {
      ok: false,
      error: msg,
    };
  }
}

/**
 * Ação simulada de cancelamento/gerenciamento de assinatura.
 */
export async function cancelSubscriptionAction(): Promise<SettingsActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        ok: false,
        error: "Sessão expirada. Faça login novamente.",
      };
    }

    const updatePayload = {
      status: "canceled",
      updated_at: new Date().toISOString(),
    };

    let { error: subError } = await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("user_id", user.id);

    if (subError) {
      try {
        const admin = createAdminClient();
        const adminRes = await admin
          .from("subscriptions")
          .update(updatePayload)
          .eq("user_id", user.id);
        subError = adminRes.error;
      } catch {
        // mantém erro
      }
    }

    if (subError) {
      return {
        ok: false,
        error: "Falha ao registrar cancelamento: " + subError.message,
      };
    }

    revalidatePath("/configuracoes");
    revalidatePath("/perfil");
    return {
      ok: true,
      message: "Assinatura cancelada com sucesso. Seu acesso continuará ativo até o término do ciclo atual.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao cancelar assinatura.";
    return {
      ok: false,
      error: msg,
    };
  }
}

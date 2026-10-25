"use server";

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

export type SettingsActionResponse = {
  ok: boolean;
  error?: string;
  message?: string;
};

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

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: resolvedName,
        phone: phone ? phone.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return { ok: false, error: sanitizePublicErrorMessage(updateError.message) };
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

    const { error } = await supabase
      .from("profiles")
      .update({
        theme_preference: theme.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return { ok: false, error: sanitizePublicErrorMessage(error.message) };
    }

    revalidatePath("/configuracoes");
    return { ok: true, message: "Preferência de tema salva." };
  } catch (err) {
    return { ok: false, error: sanitizePublicErrorMessage(err) };
  }
}

/** Upgrade MVP Starter → Pro (temporário até a onda do gateway). */
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

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const admin = createAdminClient();
    const { error: subError } = await admin
      .from("subscriptions")
      .update({
        plan: "pro",
        company_quota: 3,
        status: "active",
        cancel_at_period_end: false,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("user_id", user.id)
      .eq("id", guard.subscription.id);

    if (subError) {
      return { ok: false, error: sanitizePublicErrorMessage(subError.message) };
    }

    revalidatePath("/configuracoes");
    revalidatePath("/perfil");
    return {
      ok: true,
      message: "Upgrade realizado com sucesso! Seu plano agora é Pro (limite de 3 empresas).",
    };
  } catch (err) {
    return { ok: false, error: sanitizePublicErrorMessage(err) };
  }
}

/** Agenda cancelamento: mantém acesso até current_period_end. */
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

    const admin = createAdminClient();
    const { error: subError } = await admin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("id", guard.subscription.id);

    if (subError) {
      return { ok: false, error: sanitizePublicErrorMessage(subError.message) };
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

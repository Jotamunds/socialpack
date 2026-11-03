"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ChangePasswordInputSchema,
  ThemePreferenceSchema,
  UpdateProfileInputSchema,
} from "@/lib/schemas";
import { sanitizePublicErrorMessage } from "@/lib/public-error";

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

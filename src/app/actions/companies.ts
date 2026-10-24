"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateCompanyInputSchema, normalizeCompanyInput } from "@/lib/schemas";

export type CompanyActionResponse = {
  ok: boolean;
  code?: "QUOTA_EXCEEDED" | "SUBSCRIPTION_REQUIRED" | "UNAUTHORIZED" | "VALIDATION_ERROR" | "DATABASE_ERROR";
  message?: string;
  company?: {
    id: string;
    user_id: string;
    name: string;
    category_id: string;
    niche_id: string;
    city: string;
    state: string;
    instagram: string | null;
    tone_id: string;
    colors: { primary: string; secondary: string; accent: string };
    created_at: string;
  };
};

/**
 * Cria uma nova empresa garantindo validação de entrada, tenant isolation (RLS)
 * e captura do trigger atômico de cotas (P0003 / P0002).
 */
export async function createCompanyAction(input: unknown): Promise<CompanyActionResponse> {
  const validation = CreateCompanyInputSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Dados de empresa inválidos.";
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: firstError,
    };
  }

  const normalized = normalizeCompanyInput(validation.data);

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
        message: "Você precisa estar conectado para cadastrar uma empresa.",
      };
    }

    const { data, error } = await supabase
      .from("companies")
      .insert({
        user_id: user.id,
        name: normalized.name,
        category_id: normalized.categoryId,
        niche_id: normalized.nicheId,
        city: normalized.city,
        state: normalized.state,
        instagram: normalized.instagram || null,
        tone_id: normalized.toneId,
        colors: normalized.colors,
      })
      .select()
      .single();

    if (error) {
      // Captura do erro P0003 emitido pelo trigger enforce_company_quota
      if (
        error.code === "P0003" ||
        error.message?.includes("P0003") ||
        error.message?.toLowerCase().includes("limite de empresas")
      ) {
        return {
          ok: false,
          code: "QUOTA_EXCEEDED",
          message:
            "Limite de empresas atingido para o seu plano. Faça upgrade para o Plano Pro para cadastrar mais empresas.",
        };
      }

      // Captura do erro P0002 emitido quando não há assinatura ativa
      if (
        error.code === "P0002" ||
        error.message?.includes("P0002") ||
        error.message?.toLowerCase().includes("assinatura")
      ) {
        return {
          ok: false,
          code: "SUBSCRIPTION_REQUIRED",
          message: "É necessária uma assinatura ativa ou em período de testes para cadastrar empresas.",
        };
      }

      return {
        ok: false,
        code: "DATABASE_ERROR",
        message: error.message || "Erro ao salvar a empresa no banco de dados.",
      };
    }

    revalidatePath("/perfil");

    return {
      ok: true,
      company: data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro inesperado ao processar solicitação.";
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message,
    };
  }
}

/**
 * Exclui uma empresa pertencente ao usuário autenticado (protegido por RLS).
 */
export async function deleteCompanyAction(companyId: string): Promise<{ ok: boolean; message?: string }> {
  if (!companyId) {
    return { ok: false, message: "ID da empresa obrigatório." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Acesso não autorizado." };
    }

    const { error } = await supabase.from("companies").delete().eq("id", companyId);

    if (error) {
      return { ok: false, message: `Erro ao excluir empresa: ${error.message}` };
    }

    revalidatePath("/perfil");
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro inesperado ao excluir empresa.";
    return { ok: false, message };
  }
}

/**
 * Encerra a sessão do usuário autenticado e redireciona para a tela de login.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}


"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateCompanyInputSchema, normalizeCompanyInput } from "@/lib/schemas";
import { sanitizePublicErrorMessage } from "@/lib/public-error";
import { assertOwnedStoragePath, getOwnedStoragePathOrNull } from "@/lib/storage-path";
import { assertValidSubscription } from "@/lib/supabase/subscription-guard";

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

    // Validação estrita no servidor: assinatura ativa obrigatória para criar empresa
    await assertValidSubscription(user.id);

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

      if (
        error.code === "P0002" ||
        error.message?.includes("P0002") ||
        error.message?.toLowerCase().includes("assinatura")
      ) {
        return {
          ok: false,
          code: "SUBSCRIPTION_REQUIRED",
          message: "É necessária uma assinatura ativa para cadastrar empresas.",
        };
      }

      return {
        ok: false,
        code: "DATABASE_ERROR",
        message: sanitizePublicErrorMessage(error.message || "Erro ao salvar a empresa."),
      };
    }

    revalidatePath("/perfil");

    return {
      ok: true,
      company: data,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: sanitizePublicErrorMessage(err),
    };
  }
}

/**
 * Exclusão coordenada: remove PNGs do Storage e só então a empresa (cascade nos posts).
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

    // Validação estrita no servidor: assinatura ativa obrigatória para deletar empresa
    await assertValidSubscription(user.id);

    const admin = createAdminClient();

    const { data: company, error: companyError } = await admin
      .from("companies")
      .select("id, user_id")
      .eq("id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (companyError || !company) {
      return { ok: false, message: "Empresa não encontrada ou acesso negado." };
    }

    const { data: posts } = await admin
      .from("posts")
      .select("id, storage_path, image_storage_path")
      .eq("company_id", companyId)
      .eq("user_id", user.id);

    const paths = (posts || [])
      .map((p) => getOwnedStoragePathOrNull(user.id, p.image_storage_path || p.storage_path))
      .filter((p): p is string => Boolean(p));

    if (paths.length > 0) {
      // Validação explícita de prefixo antes do remove em lote
      const ownedPaths = paths.map((p) => assertOwnedStoragePath(user.id, p));
      const { error: storageError } = await admin.storage.from("generated-arts").remove(ownedPaths);
      if (storageError) {
        return {
          ok: false,
          message: sanitizePublicErrorMessage(
            `Falha ao excluir artes no Storage: ${storageError.message}`
          ),
        };
      }
    }

    const { error } = await admin
      .from("companies")
      .delete()
      .eq("id", companyId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, message: sanitizePublicErrorMessage(error.message) };
    }

    revalidatePath("/perfil");
    revalidatePath("/geracao/historico/instagram");
    revalidatePath("/geracao/instagram/posts");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, message: sanitizePublicErrorMessage(err) };
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertOwnedStoragePath,
  getOwnedStoragePathOrNull,
} from "@/lib/storage-path";
import { sanitizePublicErrorMessage } from "@/lib/public-error";

export interface HistoryPostItem {
  id: string;
  user_id: string;
  company_id: string;
  day: string;
  date: string | null;
  theme: string;
  headline: string;
  subheadline: string | null;
  cta: string;
  caption: string;
  hashtags: string[];
  layout: number;
  status: "completed" | "failed" | "processing" | "pending";
  storage_path: string | null;
  image_storage_path: string | null;
  image_url: string | null;
  signedUrl: string | null;
  created_at: string;
  company_name?: string;
}

export interface HistoryFilterParams {
  companyId?: string;
  search?: string;
  period?: "7days" | "30days" | "all" | string;
  startDate?: string;
  endDate?: string;
}

/**
 * Consulta postagens salvas com status 'completed' pertencentes ao usuário autenticado (RLS).
 * URLs assinadas são geradas na hora; image_url persistida não é usada como fallback.
 */
export async function getHistoryPostsAction(filters?: HistoryFilterParams): Promise<{
  ok: boolean;
  posts: HistoryPostItem[];
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, posts: [], message: "Não autorizado. Faça login para acessar o histórico." };
    }

    let query = supabase
      .from("posts")
      .select("*, companies(name)")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (filters?.companyId && filters.companyId !== "all") {
      query = query.eq("company_id", filters.companyId);
    }

    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`headline.ilike.${term},theme.ilike.${term},caption.ilike.${term}`);
    }

    if (filters?.period === "7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte("created_at", sevenDaysAgo.toISOString());
    } else if (filters?.period === "30days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte("created_at", thirtyDaysAgo.toISOString());
    }

    if (filters?.startDate) {
      query = query.gte("date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("date", filters.endDate);
    }

    const { data: posts, error: queryError } = await query;

    if (queryError) {
      return { ok: false, posts: [], message: sanitizePublicErrorMessage(queryError.message) };
    }

    const adminSupabase = createAdminClient();
    const postsWithSignedUrls: HistoryPostItem[] = await Promise.all(
      (posts || []).map(async (p) => {
        const filePath = getOwnedStoragePathOrNull(
          user.id,
          p.image_storage_path || p.storage_path
        );
        let signedUrl: string | null = null;

        if (filePath) {
          const { data: sData } = await adminSupabase.storage
            .from("generated-arts")
            .createSignedUrl(filePath, 3600);
          signedUrl = sData?.signedUrl || null;
        }

        const comp = p.companies as { name?: string } | null;

        return {
          id: p.id,
          user_id: p.user_id,
          company_id: p.company_id as string,
          day: p.day,
          date: p.date,
          theme: p.theme,
          headline: p.headline,
          subheadline: p.subheadline,
          cta: p.cta,
          caption: p.caption,
          hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
          layout: p.layout ?? 0,
          status: p.status,
          storage_path: p.storage_path,
          image_storage_path: p.image_storage_path,
          image_url: null,
          signedUrl,
          created_at: p.created_at,
          company_name: comp?.name || "Empresa",
        };
      })
    );

    return { ok: true, posts: postsWithSignedUrls };
  } catch (err: unknown) {
    return { ok: false, posts: [], message: sanitizePublicErrorMessage(err) };
  }
}

/**
 * Exclusão coordenada: valida sessão, prefixo {userId}/, remove o PNG e só então a linha.
 */
export async function deletePostOrchestratedAction(postId: string): Promise<{
  ok: boolean;
  message?: string;
}> {
  if (!postId) {
    return { ok: false, message: "ID do post obrigatório para exclusão." };
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

    const adminSupabase = createAdminClient();

    const { data: post, error: findError } = await adminSupabase
      .from("posts")
      .select("id, user_id, storage_path, image_storage_path")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (findError || !post) {
      return { ok: false, message: "Post não encontrado ou você não tem permissão para excluí-lo." };
    }

    const rawPath = post.image_storage_path || post.storage_path;

    if (rawPath) {
      let filePath: string;
      try {
        filePath = assertOwnedStoragePath(user.id, rawPath);
      } catch {
        return {
          ok: false,
          message: "Caminho de arquivo inválido. O registro no banco foi preservado.",
        };
      }

      const { error: storageError } = await adminSupabase.storage
        .from("generated-arts")
        .remove([filePath]);

      if (storageError) {
        return {
          ok: false,
          message: sanitizePublicErrorMessage(
            `Falha ao excluir arquivo no Storage: ${storageError.message}. O registro no banco foi preservado.`
          ),
        };
      }
    }

    const { error: deleteDbError } = await adminSupabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);

    if (deleteDbError) {
      return {
        ok: false,
        message: sanitizePublicErrorMessage(deleteDbError.message),
      };
    }

    revalidatePath("/geracao/historico/instagram");
    revalidatePath("/geracao/instagram/posts");

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, message: sanitizePublicErrorMessage(err) };
  }
}

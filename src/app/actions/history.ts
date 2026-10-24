"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface HistoryPostItem {
  id: string;
  user_id: string;
  company_id: string | null;
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
 * Gera URLs assinadas temporárias para exibição segura de miniaturas sem expor o bucket privado.
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

    // 1. Filtro por Empresa
    if (filters?.companyId && filters.companyId !== "all") {
      query = query.eq("company_id", filters.companyId);
    }

    // 2. Filtro por Busca Textual (Tema ou Headline)
    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`headline.ilike.${term},theme.ilike.${term},caption.ilike.${term}`);
    }

    // 3. Filtro por Período
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
      return { ok: false, posts: [], message: queryError.message };
    }

    // Gera URLs assinadas temporárias para as miniaturas
    const adminSupabase = createAdminClient();
    const postsWithSignedUrls: HistoryPostItem[] = await Promise.all(
      (posts || []).map(async (p) => {
        const filePath = p.image_storage_path || p.storage_path;
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
          company_id: p.company_id,
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
          image_url: p.image_url,
          signedUrl: signedUrl || p.image_url,
          created_at: p.created_at,
          company_name: comp?.name || "Empresa",
        };
      })
    );

    return { ok: true, posts: postsWithSignedUrls };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido ao carregar histórico.";
    return { ok: false, posts: [], message: msg };
  }
}

/**
 * Exclusão Coordenada de Postagem (Invariante 5: Prevenção de Arquivos Órfãos):
 * 1. Valida sessão e posse do registro pelo solicitante (user_id = auth.uid()).
 * 2. Deleta primeiro o arquivo físico no Supabase Storage (generated-arts).
 * 3. Apenas após a confirmação de exclusão do storage, deleta a linha no banco.
 * 4. Se o Storage falhar, a linha do banco NÃO é apagada.
 */
export async function deletePostOrchestratedAction(postId: string): Promise<{
  ok: boolean;
  message?: string;
}> {
  if (!postId) {
    return { ok: false, message: "ID do post obrigatório para exclusão." };
  }

  try {
    // 1. Validar sessão autenticada do usuário
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Acesso não autorizado." };
    }

    const adminSupabase = createAdminClient();

    // 2. Verificar posse do registro e obter caminho do arquivo no Storage
    const { data: post, error: findError } = await adminSupabase
      .from("posts")
      .select("id, user_id, storage_path, image_storage_path")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (findError || !post) {
      return { ok: false, message: "Post não encontrado ou você não tem permissão para excluí-lo." };
    }

    const filePath = post.image_storage_path || post.storage_path;

    // 3. Deletar primeiro o arquivo físico no Storage antes de remover a linha no banco
    if (filePath) {
      const { error: storageError } = await adminSupabase.storage
        .from("generated-arts")
        .remove([filePath]);

      if (storageError) {
        // Se a exclusão no Storage falhar, NÃO apaga a linha no banco para evitar arquivo órfão
        return {
          ok: false,
          message: `Falha ao excluir arquivo no Storage: ${storageError.message}. O registro no banco foi preservado.`,
        };
      }
    }

    // 4. Deletar a linha correspondente em public.posts
    const { error: deleteDbError } = await adminSupabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);

    if (deleteDbError) {
      return {
        ok: false,
        message: `Falha ao remover registro no banco: ${deleteDbError.message}`,
      };
    }

    // 5. Revalidar rotas afetadas
    revalidatePath("/geracao/historico/instagram");
    revalidatePath("/geracao/instagram/posts");

    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao excluir postagem.";
    return { ok: false, message: msg };
  }
}

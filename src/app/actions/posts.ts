"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SignedUrlResponse {
  ok: boolean;
  signedUrl?: string;
  message?: string;
}

/**
 * Gera uma URL assinada temporária (120 segundos) para download seguro de uma arte gerada.
 * Garante tenant isolation validando que o post pertence ao usuário autenticado.
 */
export async function getSignedPostDownloadUrlAction(postId: string): Promise<SignedUrlResponse> {
  if (!postId) {
    return { ok: false, message: "ID do post obrigatório." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Não autorizado." };
    }

    // Busca o post garantindo que pertence ao usuário autenticado (RLS)
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, company_id, storage_path, image_storage_path, status")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (postError || !post) {
      return { ok: false, message: "Post não encontrado ou acesso não autorizado." };
    }

    const path = post.image_storage_path || post.storage_path;
    if (!path) {
      return { ok: false, message: "Arquivo de imagem ainda não disponível para este post." };
    }

    // Usar cliente admin para gerar URL assinada no bucket privado generated-arts
    const adminSupabase = createAdminClient();
    const { data, error: signedError } = await adminSupabase.storage
      .from("generated-arts")
      .createSignedUrl(path, 120, {
        download: true,
      });

    if (signedError || !data?.signedUrl) {
      return { ok: false, message: signedError?.message || "Falha ao gerar link de download." };
    }

    return {
      ok: true,
      signedUrl: data.signedUrl,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao gerar URL assinada.";
    return { ok: false, message: msg };
  }
}

/**
 * Consulta os posts da empresa para uma determinada data de início de semana.
 */
export async function getWeeklyPostsAction(companyId: string, startDate?: string) {
  if (!companyId) {
    return { ok: false, posts: [] };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Não autorizado.", posts: [] };
    }

    let query = supabase
      .from("posts")
      .select("*")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (startDate) {
      query = query.gte("date", startDate);
    }

    const { data, error } = await query.limit(7);

    if (error) {
      return { ok: false, message: error.message, posts: [] };
    }

    // Gera URLs assinadas para os posts concluídos
    const adminSupabase = createAdminClient();
    const postsWithSignedUrls = await Promise.all(
      (data || []).map(async (post) => {
        const path = post.image_storage_path || post.storage_path;
        let signedUrl: string | null = null;
        if (path && post.status === "completed") {
          const { data: sData } = await adminSupabase.storage
            .from("generated-arts")
            .createSignedUrl(path, 3600); // 1 hora para visualização na galeria
          signedUrl = sData?.signedUrl || null;
        }
        return {
          ...post,
          signedUrl: signedUrl || post.image_url,
        };
      })
    );

    return { ok: true, posts: postsWithSignedUrls };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar posts semanais.";
    return { ok: false, message: msg, posts: [] };
  }
}

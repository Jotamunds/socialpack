"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertOwnedStoragePath,
  getOwnedStoragePathOrNull,
} from "@/lib/storage-path";
import { sanitizePublicErrorMessage } from "@/lib/public-error";
import { assertValidSubscription } from "@/lib/supabase/subscription-guard";

export interface SignedUrlResponse {
  ok: boolean;
  signedUrl?: string;
  message?: string;
}

/**
 * Gera uma URL assinada temporária (120 segundos) para download seguro de uma arte gerada.
 * Garante tenant isolation validando posse do post, assinatura ativa e prefixo {userId}/ no storage path.
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

    // Validação estrita no servidor: assinatura ativa obrigatória para download de artes
    await assertValidSubscription(user.id);

    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, company_id, storage_path, image_storage_path, status")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (postError || !post) {
      return { ok: false, message: "Post não encontrado ou acesso não autorizado." };
    }

    const rawPath = post.image_storage_path || post.storage_path;
    if (!rawPath) {
      return { ok: false, message: "Arquivo de imagem ainda não disponível para este post." };
    }

    let path: string;
    try {
      path = assertOwnedStoragePath(user.id, rawPath);
    } catch {
      return { ok: false, message: "Caminho de arquivo inválido para este usuário." };
    }

    const adminSupabase = createAdminClient();
    const { data, error: signedError } = await adminSupabase.storage
      .from("generated-arts")
      .createSignedUrl(path, 120, {
        download: true,
      });

    if (signedError || !data?.signedUrl) {
      return { ok: false, message: "Falha ao gerar link de download." };
    }

    return {
      ok: true,
      signedUrl: data.signedUrl,
    };
  } catch (err: unknown) {
    return { ok: false, message: sanitizePublicErrorMessage(err) };
  }
}

/**
 * Consulta os posts da empresa para uma determinada data de início de semana.
 * URLs assinadas são geradas na hora; image_url persistida não é usada como fallback.
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

    // Validação estrita no servidor: assinatura ativa obrigatória para consultar posts
    await assertValidSubscription(user.id);

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
      return { ok: false, message: sanitizePublicErrorMessage(error.message), posts: [] };
    }

    const adminSupabase = createAdminClient();
    const postsWithSignedUrls = await Promise.all(
      (data || []).map(async (post) => {
        const path = getOwnedStoragePathOrNull(
          user.id,
          post.image_storage_path || post.storage_path
        );
        let signedUrl: string | null = null;
        if (path && post.status === "completed") {
          const { data: sData } = await adminSupabase.storage
            .from("generated-arts")
            .createSignedUrl(path, 3600);
          signedUrl = sData?.signedUrl || null;
        }
        return {
          ...post,
          image_url: null,
          signedUrl,
        };
      })
    );

    return { ok: true, posts: postsWithSignedUrls };
  } catch (err: unknown) {
    return { ok: false, message: sanitizePublicErrorMessage(err), posts: [] };
  }
}

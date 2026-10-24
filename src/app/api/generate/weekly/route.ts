import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireValidSubscription } from "@/lib/supabase/subscription-guard";
import { generateWeek } from "@/lib/generator";
import { renderPostToPngBuffer, sanitizePublicErrorMessage } from "@/lib/rendering/satori-renderer";
import type { CompanyProfile } from "@/lib/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface GenerateWeeklyBody {
  companyId: string;
  startDate?: string;
}

export async function POST(request: Request) {
  try {
    // 1. Validar sessão autenticada do usuário (RLS)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Acesso não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    // 2. Validar assinatura do usuário (requireValidSubscription)
    const subCheck = await requireValidSubscription(user.id);
    if (!subCheck.isValid || !subCheck.subscription) {
      return NextResponse.json(
        {
          ok: false,
          code: "SUBSCRIPTION_REQUIRED",
          error: subCheck.error || "É necessária uma assinatura ativa para gerar artes.",
        },
        { status: 403 }
      );
    }

    // 3. Validar payload de entrada
    const body: GenerateWeeklyBody = await request.json().catch(() => ({ companyId: "" }));
    const { companyId, startDate } = body;

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "O ID da empresa é obrigatório." },
        { status: 400 }
      );
    }

    // 4. Validar se a empresa informada pertence ao usuário autenticado (Tenant Isolation)
    const { data: companyRecord, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .eq("user_id", user.id)
      .single();

    if (companyError || !companyRecord) {
      return NextResponse.json(
        { ok: false, error: "Empresa não encontrada ou não pertence ao seu usuário." },
        { status: 404 }
      );
    }

    // Normalizar objeto CompanyProfile para o motor determinístico
    const companyProfile: CompanyProfile = {
      id: companyRecord.id,
      name: companyRecord.name,
      categoryId: companyRecord.category_id,
      nicheId: companyRecord.niche_id,
      city: companyRecord.city,
      state: companyRecord.state,
      instagram: companyRecord.instagram || "",
      toneId: companyRecord.tone_id,
      colors: companyRecord.colors || {
        primary: "#5e6ad2",
        secondary: "#7170ff",
        accent: "#828fff",
      },
    };

    // 5. Gerar pacote determinístico dos 7 posts semanais
    const weekData = generateWeek(companyProfile, startDate);
    const { posts: planPosts } = weekData;

    // 6. Criar os 7 registros em public.posts com status = 'pending' via createAdminClient
    const adminSupabase = createAdminClient();

    const insertPayload = planPosts.map((post) => ({
      user_id: user.id,
      company_id: companyRecord.id,
      day: post.day,
      date: post.date || null,
      theme: post.theme,
      headline: post.headline,
      subheadline: post.subheadline || "",
      cta: post.cta,
      caption: post.caption,
      caption_copy: post.caption,
      hashtags: post.hashtags || [],
      layout: post.layout,
      status: "pending",
    }));

    const { data: createdPosts, error: insertError } = await adminSupabase
      .from("posts")
      .insert(insertPayload)
      .select();

    if (insertError || !createdPosts || createdPosts.length !== 7) {
      return NextResponse.json(
        {
          ok: false,
          error: sanitizePublicErrorMessage(insertError?.message || "Falha ao inicializar registros de posts."),
        },
        { status: 500 }
      );
    }

    const finalResults = [];

    // 7. Iterar sequencialmente sobre cada post respeitando a máquina de estados
    for (let i = 0; i < 7; i++) {
      const postRecord = createdPosts[i];
      const planItem = planPosts[i];
      const storagePath = `${user.id}/${companyRecord.id}/${postRecord.id}.png`;

      try {
        // Transição 1: pending ➔ processing
        const { error: procError } = await adminSupabase
          .from("posts")
          .update({ status: "processing" })
          .eq("id", postRecord.id);

        if (procError) {
          throw new Error(`Erro na transição para processing: ${procError.message}`);
        }

        // Renderização server-side via Satori + Resvg (1080x1080px)
        const pngBuffer = await renderPostToPngBuffer(planItem, companyProfile);

        // Upload no bucket privado generated-arts
        const { error: uploadError } = await adminSupabase.storage
          .from("generated-arts")
          .upload(storagePath, pngBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Erro no upload da arte: ${uploadError.message}`);
        }

        // URL assinada para visualização imediata no cliente
        const { data: signedData } = await adminSupabase.storage
          .from("generated-arts")
          .createSignedUrl(storagePath, 3600);

        const signedUrl = signedData?.signedUrl || null;

        // Transição 2: processing ➔ completed (preenchendo todos os campos da constraint posts_completed_integrity)
        const { error: completeError } = await adminSupabase
          .from("posts")
          .update({
            status: "completed",
            storage_path: storagePath,
            image_storage_path: storagePath,
            image_url: signedUrl,
            caption: planItem.caption,
            caption_copy: planItem.caption,
            generation_config: {
              layout: planItem.layout,
              theme: planItem.theme,
              colors: companyProfile.colors,
              imageUrl: planItem.imageUrl,
            },
            completed_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", postRecord.id);

        if (completeError) {
          // Rollback compensatório de arquivo órfão no Storage conforme Invariante 1.3
          await adminSupabase.storage.from("generated-arts").remove([storagePath]);
          throw new Error(`Falha ao concluir post no banco: ${completeError.message}`);
        }

        finalResults.push({
          id: postRecord.id,
          day: planItem.day,
          date: planItem.date,
          dayOfWeek: planItem.dayOfWeek,
          formattedDate: planItem.formattedDate,
          theme: planItem.theme,
          headline: planItem.headline,
          subheadline: planItem.subheadline,
          cta: planItem.cta,
          caption: planItem.caption,
          hashtags: planItem.hashtags,
          layout: planItem.layout,
          status: "completed",
          imageUrl: signedUrl,
          signedUrl,
        });
      } catch (postErr) {
        // Transição de falha: processing ➔ failed (preenchendo error_message conforme posts_failed_integrity)
        const sanitizedMsg = sanitizePublicErrorMessage(postErr);
        await adminSupabase
          .from("posts")
          .update({
            status: "failed",
            error_message: sanitizedMsg,
          })
          .eq("id", postRecord.id);

        finalResults.push({
          id: postRecord.id,
          day: planItem.day,
          date: planItem.date,
          theme: planItem.theme,
          headline: planItem.headline,
          subheadline: planItem.subheadline,
          cta: planItem.cta,
          caption: planItem.caption,
          hashtags: planItem.hashtags,
          layout: planItem.layout,
          status: "failed",
          errorMessage: sanitizedMsg,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      weekRangeLabel: weekData.weekRangeLabel,
      startDate: weekData.startDate,
      endDate: weekData.endDate,
      posts: finalResults,
    });
  } catch (err: unknown) {
    const errorMsg = sanitizePublicErrorMessage(err);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}

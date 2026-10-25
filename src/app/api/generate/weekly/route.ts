import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireValidSubscription } from "@/lib/supabase/subscription-guard";
import { generateWeek } from "@/lib/generator";
import { renderPostToPngBuffer, sanitizePublicErrorMessage } from "@/lib/rendering/satori-renderer";
import { assertOwnedStoragePath } from "@/lib/storage-path";
import {
  GenerateWeeklyBodySchema,
  MAX_WEEKLY_PACKS_PER_COMPANY_PER_DAY,
  POSTS_PER_WEEKLY_PACK,
  PostGenerationConfigSchema,
} from "@/lib/schemas";
import type { CompanyProfile } from "@/lib/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function POST(request: Request) {
  try {
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

    const rawBody = await request.json().catch(() => null);
    const bodyValidation = GenerateWeeklyBodySchema.safeParse(rawBody);
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "VALIDATION_ERROR",
          error: bodyValidation.error.issues[0]?.message || "Payload de geração inválido.",
        },
        { status: 400 }
      );
    }

    const { companyId, startDate } = bodyValidation.data;

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

    const adminSupabase = createAdminClient();

    // Teto MVP: 4 pacotes/empresa/dia (28 posts criados no dia UTC)
    const { count: postsToday, error: countError } = await adminSupabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyRecord.id)
      .eq("user_id", user.id)
      .gte("created_at", startOfUtcDayIso());

    if (countError) {
      return NextResponse.json(
        { ok: false, error: "Não foi possível verificar o limite diário de geração." },
        { status: 500 }
      );
    }

    const packsToday = Math.floor((postsToday || 0) / POSTS_PER_WEEKLY_PACK);
    if (packsToday >= MAX_WEEKLY_PACKS_PER_COMPANY_PER_DAY) {
      return NextResponse.json(
        {
          ok: false,
          code: "DAILY_PACK_LIMIT",
          error: `Limite diário atingido: no máximo ${MAX_WEEKLY_PACKS_PER_COMPANY_PER_DAY} pacotes por empresa por dia.`,
        },
        { status: 429 }
      );
    }

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

    let weekData;
    try {
      weekData = generateWeek(companyProfile, startDate);
    } catch (genErr) {
      return NextResponse.json(
        { ok: false, error: sanitizePublicErrorMessage(genErr) },
        { status: 500 }
      );
    }

    const { posts: planPosts } = weekData;

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
          error: sanitizePublicErrorMessage(
            insertError?.message || "Falha ao inicializar registros de posts."
          ),
        },
        { status: 500 }
      );
    }

    const handle = companyProfile.instagram
      ? `@${companyProfile.instagram.replace(/^@+/, "")}`
      : companyProfile.name;

    const finalResults = [];

    for (let i = 0; i < 7; i++) {
      const postRecord = createdPosts[i];
      const planItem = planPosts[i];
      const storagePath = assertOwnedStoragePath(
        user.id,
        `${user.id}/${companyRecord.id}/${postRecord.id}.png`
      );

      // Onda 5: render só depois de processing; falha de render atualiza processing → failed
      const { error: procError } = await adminSupabase
        .from("posts")
        .update({ status: "processing" })
        .eq("id", postRecord.id)
        .eq("status", "pending");

      if (procError) {
        const sanitizedMsg = sanitizePublicErrorMessage(procError.message);
        await adminSupabase
          .from("posts")
          .update({ status: "failed", error_message: sanitizedMsg })
          .eq("id", postRecord.id)
          .eq("status", "pending");

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
        continue;
      }

      try {
        const pngBuffer = await renderPostToPngBuffer(planItem, companyProfile);

        const { error: uploadError } = await adminSupabase.storage
          .from("generated-arts")
          .upload(storagePath, pngBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Erro no upload da arte: ${uploadError.message}`);
        }

        const { data: signedData } = await adminSupabase.storage
          .from("generated-arts")
          .createSignedUrl(storagePath, 3600);

        const signedUrl = signedData?.signedUrl || null;

        const generationConfig = PostGenerationConfigSchema.parse({
          templateSlug: planItem.templateSlug || `week/${planItem.theme}`,
          templateVersion: planItem.templateVersion || 1,
          resolvedColors: companyProfile.colors,
          renderedSlots: {
            badge: planItem.badgeText || planItem.theme,
            headline: planItem.headline,
            subheadline: planItem.subheadline,
            cta: planItem.cta,
            handle,
          },
          theme: planItem.theme,
          layout: planItem.layout,
          imageUrl: planItem.imageUrl,
        });

        const { error: completeError } = await adminSupabase
          .from("posts")
          .update({
            status: "completed",
            storage_path: storagePath,
            image_storage_path: storagePath,
            image_url: null,
            caption: planItem.caption,
            caption_copy: planItem.caption,
            generation_config: generationConfig,
            completed_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", postRecord.id)
          .eq("status", "processing");

        if (completeError) {
          const rollbackPath = assertOwnedStoragePath(user.id, storagePath);
          await adminSupabase.storage.from("generated-arts").remove([rollbackPath]);
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
        const sanitizedMsg = sanitizePublicErrorMessage(postErr);
        await adminSupabase
          .from("posts")
          .update({
            status: "failed",
            error_message: sanitizedMsg,
          })
          .eq("id", postRecord.id)
          .eq("status", "processing");

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

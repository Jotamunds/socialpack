import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { deletePack, listPacks, savePack, updatePackPosts } from "@/lib/pack-store";
import { getSessionEmail } from "@/lib/session";
import { checkQuota, incrementQuota } from "@/lib/subscription-store";
import type { SavedPack } from "@/lib/types";


export async function GET(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const result = await listPacks(email, { search, startDate, endDate });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Validação de cota e plano antes de salvar novo pack
  const quotaCheck = await checkQuota(email);
  if (!quotaCheck.allowed) {
    return NextResponse.json(
      {
        error:
          quotaCheck.errorMessage ||
          (quotaCheck.sub.status !== "active"
            ? "Assinatura ativa necessária. Escolha o plano Starter ou Pro para gerar novos packs."
            : "Limite de packs atingido. Faça upgrade para o plano Pro"),
        code:
          quotaCheck.sub.status !== "active"
            ? "SUBSCRIPTION_REQUIRED"
            : quotaCheck.sub.planId === "starter"
            ? "STARTER_LIMIT_REACHED"
            : "QUOTA_EXCEEDED",
        quota: quotaCheck.sub.generationQuota,
        used: Math.max(quotaCheck.sub.usedGenerations || 0, quotaCheck.sub.packsCreatedCount || 0),
        planId: quotaCheck.sub.planId,
      },
      { status: quotaCheck.status || 403 },
    );
  }

  try {
    const body = await request.json();
    if (!body || !Array.isArray(body.posts)) {
      return NextResponse.json(
        { error: "Dados inválidos para criação do pack. 'posts' é obrigatório." },
        { status: 400 },
      );
    }

    const packToSave: SavedPack = {
      id: body.id || randomUUID(),
      createdAt: body.createdAt || new Date().toISOString(),
      userEmail: email.toLowerCase().trim(),
      clientName: body.clientName || "Cliente",
      categoryId: body.categoryId || "alimentacao",
      nicheId: body.nicheId || "restaurante",
      nicheLabel: body.nicheLabel || "Restaurante",
      city: body.city || "",
      instagram: body.instagram || "",
      toneId: body.toneId || "profissional",
      brandColors: body.brandColors || {
        primary: "#000000",
        secondary: "#6e6e73",
        accent: "#0071e3",
      },
      posts: body.posts,
      source: body.source || "niche",
      startDate: body.startDate,
      endDate: body.endDate,
    };

    const saved = await savePack(packToSave);
    const updatedSub = await incrementQuota(email);

    return NextResponse.json(
      {
        ok: true,
        pack: saved,
        quotaRemaining: Math.max(0, quotaCheck.remaining - 1),
        usedGenerations: updatedSub.usedGenerations,
        packsCreatedCount: updatedSub.packsCreatedCount,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[SocialPack] Erro ao salvar pack via POST:", err);
    return NextResponse.json({ error: "Erro ao salvar pack." }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, posts } = body;

    if (!id || !Array.isArray(posts)) {
      return NextResponse.json(
        { error: "Dados inválidos. Envie 'id' e 'posts' (array)." },
        { status: 400 },
      );
    }

    const updated = await updatePackPosts(id, email, posts);
    if (!updated) {
      return NextResponse.json({ error: "Pack não encontrado ou não autorizado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, pack: updated });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar pack." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID do pack ausente." }, { status: 400 });
  }

  const deleted = await deletePack(id, email);
  return NextResponse.json({ ok: deleted });
}


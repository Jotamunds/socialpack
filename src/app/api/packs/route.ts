import { NextResponse, type NextRequest } from "next/server";
import { deletePack, listPacks, updatePackPosts } from "@/lib/pack-store";
import { getSessionEmail } from "@/lib/session";

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


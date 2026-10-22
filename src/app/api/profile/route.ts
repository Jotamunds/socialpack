import { NextResponse } from "next/server";
import { parseProfile } from "@/lib/catalog";
import { getProfile, saveProfile } from "@/lib/profile-store";
import { getSessionEmail } from "@/lib/session";

const unauthorized = () => NextResponse.json({ error: "Não autenticado." }, { status: 401 });

export async function GET() {
  try {
    const email = await getSessionEmail();
    if (!email) return unauthorized();
    return NextResponse.json({ profile: await getProfile(email) });
  } catch (err: unknown) {
    console.error("[Profile API GET] Erro:", err);
    const msg = err instanceof Error ? err.message : "Erro ao carregar perfil.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const email = await getSessionEmail();
    if (!email) return unauthorized();

    const profile = parseProfile(await request.json().catch(() => null));
    if (!profile) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios corretamente." },
        { status: 400 },
      );
    }

    await saveProfile(email, profile);
    return NextResponse.json({ profile });
  } catch (err: unknown) {
    console.error("[Profile API PUT] Erro:", err);
    const msg = err instanceof Error ? err.message : "Erro ao salvar perfil.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

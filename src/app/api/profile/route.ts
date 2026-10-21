import { NextResponse } from "next/server";
import { parseProfile } from "@/lib/catalog";
import { getProfile, saveProfile } from "@/lib/profile-store";
import { getSessionEmail } from "@/lib/session";

const unauthorized = () => NextResponse.json({ error: "Não autenticado." }, { status: 401 });

export async function GET() {
  const email = await getSessionEmail();
  if (!email) return unauthorized();
  return NextResponse.json({ profile: await getProfile(email) });
}

export async function PUT(request: Request) {
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
}

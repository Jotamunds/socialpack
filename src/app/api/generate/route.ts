import { NextResponse } from "next/server";
import { parseProfile } from "@/lib/catalog";
import { generateWeek } from "@/lib/generator";
import { getProfile, saveProfile } from "@/lib/profile-store";
import { getSessionEmail } from "@/lib/session";

export async function POST(request: Request) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Tenta ler perfil salvo; se ainda não houver, aceita do body ou inicializa padrão
  let profile = await getProfile(email);
  if (!profile) {
    const fromBody = parseProfile(await request.json().catch(() => null));
    if (fromBody) {
      profile = fromBody;
      await saveProfile(email, profile);
    } else {
      profile = {
        name: "Minha Empresa",
        categoryId: "alimentacao",
        nicheId: "restaurante",
        city: "Minha Cidade",
        instagram: "minhaempresa",
        toneId: "descontraido",
        colors: {
          primary: "#8b5cf6",
          secondary: "#d946ef",
          accent: "#fbbf24",
        },
      };
      await saveProfile(email, profile);
    }
  }

  const week = await generateWeek(profile);
  if (week.posts.length === 0) {
    return NextResponse.json(
      { error: "Nenhum texto disponível para este nicho e tom de voz." },
      { status: 422 },
    );
  }
  return NextResponse.json(week);
}

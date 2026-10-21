import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { parseProfile } from "@/lib/catalog";
import { generateWeek } from "@/lib/generator";
import { savePack } from "@/lib/pack-store";
import { getProfile, saveProfile } from "@/lib/profile-store";
import { getSessionEmail } from "@/lib/session";

export async function POST(request: Request) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Extrai body e verifica se veio startDate
  const body = await request.json().catch(() => null);
  const startDate =
    typeof body?.startDate === "string" && body.startDate.trim().length > 0
      ? body.startDate.trim()
      : undefined;

  // Se vier perfil no body, prioriza e atualiza; senão usa o salvo ou padrão
  const fromBody = parseProfile(body?.profile || body);
  let profile = fromBody || (await getProfile(email));

  if (fromBody) {
    await saveProfile(email, fromBody);
  } else if (!profile) {
    profile = {
      name: "Minha Empresa",
      categoryId: "alimentacao",
      nicheId: "restaurante",
      city: "Minha Cidade",
      instagram: "minhaempresa",
      toneId: "descontraido",
      colors: {
        primary: "#1d1d1f",
        secondary: "#6e6e73",
        accent: "#0071e3",
      },
    };
    await saveProfile(email, profile);
  }

  const week = await generateWeek(profile, startDate);
  if (week.posts.length === 0) {
    return NextResponse.json(
      { error: "Nenhum texto disponível para este nicho e tom de voz." },
      { status: 422 },
    );
  }

  // Persiste o pack no histórico (Supabase com fallback seguro)
  const packId = randomUUID();
  const createdAt = new Date().toISOString();

  const saved = await savePack({
    id: packId,
    createdAt,
    userEmail: email,
    clientName: profile.name,
    categoryId: profile.categoryId,
    nicheId: profile.nicheId,
    nicheLabel: week.nicheLabel,
    city: profile.city,
    instagram: profile.instagram,
    toneId: profile.toneId,
    brandColors: profile.colors,
    posts: week.posts,
    source: week.source,
    startDate: week.startDate,
    endDate: week.endDate,
  });

  return NextResponse.json({
    ...week,
    packId: saved.id,
    createdAt: saved.createdAt,
  });
}


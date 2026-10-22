import "server-only";
import { readDataFile, writeDataFile } from "./storage-dir";
import { getSupabaseServerClient } from "./supabase";
import type { CompanyProfile } from "./types";

const FILENAME = "profiles.json";

type Store = Record<string, CompanyProfile>;

async function readStore(): Promise<Store> {
  try {
    const raw = await readDataFile(FILENAME);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

export async function getProfile(email: string): Promise<CompanyProfile | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_email", normalizedEmail)
        .maybeSingle();

      if (!error && data) {
        return {
          name: String(data.name || ""),
          categoryId: String(data.category_id || ""),
          nicheId: String(data.niche_id || ""),
          city: String(data.city || ""),
          instagram: String(data.instagram || ""),
          toneId: String(data.tone_id || ""),
          colors: (data.colors || {
            primary: "#000000",
            secondary: "#6e6e73",
            accent: "#0071e3",
          }) as CompanyProfile["colors"],
        };
      }
    } catch (err) {
      console.warn("[SocialPack] Erro ao buscar perfil no Supabase:", err);
    }
  }

  const store = await readStore();
  return store[normalizedEmail] ?? null;
}

export async function saveProfile(email: string, profile: CompanyProfile) {
  const normalizedEmail = email.toLowerCase().trim();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_email: normalizedEmail,
          name: profile.name,
          category_id: profile.categoryId,
          niche_id: profile.nicheId,
          city: profile.city,
          instagram: profile.instagram,
          tone_id: profile.toneId,
          colors: profile.colors,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_email" }
      );

      if (!error) {
        // Tenta sincronizar em cache local silenciosamente sem travar em serverless
        try {
          const store = await readStore();
          store[normalizedEmail] = profile;
          await writeDataFile(FILENAME, JSON.stringify(store, null, 2));
        } catch {
          // Fallback seguro se filesystem estiver restrito
        }
        return;
      }
      console.warn("[SocialPack] Erro ao salvar perfil no Supabase (usando fallback):", error.message);
    } catch (err) {
      console.warn("[SocialPack] Exceção ao salvar perfil no Supabase:", err);
    }
  }

  // Fallback para desenvolvimento local ou caso o Supabase não esteja configurado
  const store = await readStore();
  store[normalizedEmail] = profile;
  await writeDataFile(FILENAME, JSON.stringify(store, null, 2));
}


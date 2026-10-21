import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseServerClient, isSupabaseConfigured } from "./supabase";
import type { GeneratedPost, SavedPack } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "packs.json");

type LocalPacksStore = Record<string, SavedPack[]>; // email -> packs array

async function readLocalStore(): Promise<LocalPacksStore> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as LocalPacksStore;
  } catch {
    return {};
  }
}

async function writeLocalStore(store: LocalPacksStore) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await rename(tmp, FILE);
}

/**
 * Mapeia campos do Supabase (snake_case) para nosso modelo em TypeScript (camelCase).
 */
function mapFromSupabase(row: Record<string, unknown>): SavedPack {
  return {
    id: String(row.id),
    createdAt: String(row.created_at || new Date().toISOString()),
    userEmail: String(row.user_email || ""),
    clientName: String(row.client_name || ""),
    categoryId: String(row.category_id || ""),
    nicheId: String(row.niche_id || ""),
    nicheLabel: String(row.niche_label || ""),
    city: String(row.city || ""),
    instagram: String(row.instagram || ""),
    toneId: String(row.tone_id || ""),
    brandColors: (row.brand_colors || {
      primary: "#000000",
      secondary: "#6e6e73",
      accent: "#0071e3",
    }) as SavedPack["brandColors"],
    posts: (row.posts || []) as SavedPack["posts"],
    source: (row.source || "generic") as SavedPack["source"],
    startDate: row.start_date ? String(row.start_date) : undefined,
    endDate: row.end_date ? String(row.end_date) : undefined,
  };
}

/**
 * Salva um pack de posts gerados no Supabase (com fallback seguro local).
 */
export async function savePack(pack: SavedPack): Promise<SavedPack> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("post_packs")
        .insert({
          id: pack.id,
          created_at: pack.createdAt,
          user_email: pack.userEmail.toLowerCase(),
          client_name: pack.clientName,
          category_id: pack.categoryId,
          niche_id: pack.nicheId,
          niche_label: pack.nicheLabel,
          city: pack.city,
          instagram: pack.instagram,
          tone_id: pack.toneId,
          brand_colors: pack.brandColors,
          posts: pack.posts,
          source: pack.source,
          start_date: pack.startDate || null,
          end_date: pack.endDate || null,
        })
        .select()
        .single();

      if (!error && data) {
        return mapFromSupabase(data);
      }
      console.warn(
        "[SocialPack] Erro ao salvar no Supabase (usando fallback local):",
        error?.message,
      );
    } catch (err) {
      console.warn("[SocialPack] Exceção no Supabase (usando fallback local):", err);
    }
  }

  // Fallback Local
  const store = await readLocalStore();
  const emailKey = pack.userEmail.toLowerCase();
  if (!store[emailKey]) {
    store[emailKey] = [];
  }
  // Insere no início (mais recente primeiro)
  store[emailKey].unshift(pack);
  await writeLocalStore(store);
  return pack;
}

export type PackFilters = {
  search?: string;
  startDate?: string;
  endDate?: string;
};

/**
 * Lista o histórico de packs gerados para o usuário autenticado.
 */
export async function listPacks(
  userEmail: string,
  filters?: PackFilters,
): Promise<{ packs: SavedPack[]; isCloud: boolean }> {
  const supabase = getSupabaseServerClient();
  const normalizedEmail = userEmail.toLowerCase();

  if (supabase) {
    try {
      let query = supabase
        .from("post_packs")
        .select("*")
        .eq("user_email", normalizedEmail)
        .order("created_at", { ascending: false });

      if (filters?.search) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(
          `client_name.ilike.${term},niche_label.ilike.${term},city.ilike.${term}`,
        );
      }

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const { data, error } = await query;
      if (!error && data) {
        return {
          packs: data.map(mapFromSupabase),
          isCloud: true,
        };
      }
      console.warn(
        "[SocialPack] Erro ao listar do Supabase (lendo local):",
        error?.message,
      );
    } catch (err) {
      console.warn("[SocialPack] Exceção ao ler do Supabase:", err);
    }
  }

  // Fallback Local
  const store = await readLocalStore();
  let list = store[normalizedEmail] || [];

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.clientName.toLowerCase().includes(q) ||
        p.nicheLabel.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q),
    );
  }

  if (filters?.startDate) {
    list = list.filter((p) => p.createdAt >= filters.startDate!);
  }

  if (filters?.endDate) {
    list = list.filter((p) => p.createdAt <= filters.endDate!);
  }

  return {
    packs: list,
    isCloud: isSupabaseConfigured(),
  };
}

/**
 * Remove um pack do histórico pelo ID (com autorização por usuário).
 */
export async function deletePack(
  id: string,
  userEmail: string,
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const normalizedEmail = userEmail.toLowerCase();

  if (supabase) {
    try {
      const { error } = await supabase
        .from("post_packs")
        .delete()
        .eq("id", id)
        .eq("user_email", normalizedEmail);

      if (!error) return true;
    } catch {
      // continua para fallback se falhar
    }
  }

  const store = await readLocalStore();
  const userPacks = store[normalizedEmail] || [];
  const initialLength = userPacks.length;
  store[normalizedEmail] = userPacks.filter((p) => p.id !== id);

  if (store[normalizedEmail].length !== initialLength) {
    await writeLocalStore(store);
    return true;
  }
  return false;
}

/**
 * Busca um pack pelo ID e valida o usuário.
 */
export async function getPackById(
  id: string,
  userEmail: string,
): Promise<SavedPack | null> {
  const supabase = getSupabaseServerClient();
  const normalizedEmail = userEmail.toLowerCase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("post_packs")
        .select("*")
        .eq("id", id)
        .eq("user_email", normalizedEmail)
        .maybeSingle();

      if (!error && data) {
        return mapFromSupabase(data);
      }
    } catch {
      // continua para fallback
    }
  }

  const store = await readLocalStore();
  const userPacks = store[normalizedEmail] || [];
  return userPacks.find((p) => p.id === id) || null;
}

/**
 * Atualiza os posts de um pack salvo (incluindo imagens e textos personalizados).
 */
export async function updatePackPosts(
  id: string,
  userEmail: string,
  posts: GeneratedPost[],
): Promise<SavedPack | null> {
  const supabase = getSupabaseServerClient();
  const normalizedEmail = userEmail.toLowerCase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("post_packs")
        .update({ posts })
        .eq("id", id)
        .eq("user_email", normalizedEmail)
        .select()
        .single();

      if (!error && data) {
        return mapFromSupabase(data);
      }
    } catch {
      // continua para fallback
    }
  }

  const store = await readLocalStore();
  const userPacks = store[normalizedEmail] || [];
  const index = userPacks.findIndex((p) => p.id === id);

  if (index !== -1) {
    userPacks[index].posts = posts;
    await writeLocalStore(store);
    return userPacks[index];
  }

  return null;
}

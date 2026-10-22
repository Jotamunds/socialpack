import "server-only";
import { randomUUID } from "node:crypto";
import { readDataFile, writeDataFile } from "./storage-dir";
import { getSupabaseServerClient, isSupabaseConfigured } from "./supabase";
import type { GeneratedPost, SavedPack } from "./types";

const FILENAME = "packs.json";

type LocalPacksStore = Record<string, SavedPack[]>; // email -> packs array

async function readLocalStore(): Promise<LocalPacksStore> {
  try {
    const raw = await readDataFile(FILENAME);
    return raw ? (JSON.parse(raw) as LocalPacksStore) : {};
  } catch {
    return {};
  }
}

async function writeLocalStore(store: LocalPacksStore) {
  try {
    await writeDataFile(FILENAME, JSON.stringify(store, null, 2));
  } catch {
    // Ignora erro em ambientes de produção restritos
  }
}

/**
 * Mapeia campos do Supabase (snake_case) para nosso modelo em TypeScript (camelCase).
 * Normaliza os posts garantindo que imagem, legenda e textos estejam preservados.
 */
function mapFromSupabase(row: Record<string, unknown>): SavedPack {
  const rawPosts = Array.isArray(row.posts)
    ? (row.posts as Record<string, unknown>[])
    : typeof row.posts === "string"
    ? (JSON.parse(row.posts) as Record<string, unknown>[])
    : [];

  const posts: GeneratedPost[] = rawPosts.map((p, idx) => ({
    id: String(p.id || randomUUID()),
    day: String(p.day || ""),
    date: p.date ? String(p.date) : undefined,
    dayOfWeek: p.dayOfWeek ? String(p.dayOfWeek) : undefined,
    formattedDate: p.formattedDate ? String(p.formattedDate) : undefined,
    theme: String(p.theme || ""),
    headline: String(p.headline || ""),
    subheadline: String(p.subheadline || ""),
    cta: String(p.cta || ""),
    caption: String(p.caption || ""),
    hashtags: Array.isArray(p.hashtags) ? (p.hashtags as string[]) : [],
    layout: typeof p.layout === "number" ? p.layout : idx % 7,
    imageUrl: p.imageUrl ? String(p.imageUrl) : p.image_url ? String(p.image_url) : undefined,
    customHeadline: p.customHeadline
      ? String(p.customHeadline)
      : p.custom_headline
      ? String(p.custom_headline)
      : undefined,
    customSubheadline: p.customSubheadline
      ? String(p.customSubheadline)
      : p.custom_subheadline
      ? String(p.custom_subheadline)
      : undefined,
    customCta: p.customCta
      ? String(p.customCta)
      : p.custom_cta
      ? String(p.custom_cta)
      : undefined,
    customCaption: p.customCaption
      ? String(p.customCaption)
      : p.custom_caption
      ? String(p.custom_caption)
      : undefined,
    customHandle: p.customHandle
      ? String(p.customHandle)
      : p.custom_handle
      ? String(p.custom_handle)
      : undefined,
    isCustomized: Boolean(p.isCustomized || p.is_customized),
  }));

  return {
    id: String(row.id),
    createdAt: String(row.created_at || new Date().toISOString()),
    userEmail: String(row.user_email || row.user_id || ""),
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
    posts,
    source: (row.source || "generic") as SavedPack["source"],
    startDate: row.start_date ? String(row.start_date) : undefined,
    endDate: row.end_date ? String(row.end_date) : undefined,
  };
}

/**
 * Salva um pack de posts gerados diretamente no Supabase com suporte a post_packs, packs e posts.
 */
export async function savePack(pack: SavedPack): Promise<SavedPack> {
  const supabase = getSupabaseServerClient();
  const normalizedEmail = pack.userEmail.toLowerCase().trim();

  if (supabase) {
    let savedRow: Record<string, unknown> | null = null;

    const packPayload = {
      id: pack.id,
      created_at: pack.createdAt,
      user_email: normalizedEmail,
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
    };

    // 1. Grava na tabela post_packs
    try {
      const { data, error } = await supabase
        .from("post_packs")
        .upsert(packPayload, { onConflict: "id" })
        .select()
        .single();

      if (!error && data) {
        savedRow = data;
      }
    } catch (err) {
      console.warn("[SocialPack] Exceção ao gravar em post_packs:", err);
    }

    // 2. Se post_packs falhou ou não existe, grava na tabela packs
    if (!savedRow) {
      try {
        const { data, error } = await supabase
          .from("packs")
          .upsert(packPayload, { onConflict: "id" })
          .select()
          .single();

        if (!error && data) {
          savedRow = data;
        }
      } catch (err) {
        console.warn("[SocialPack] Exceção ao gravar em packs:", err);
      }
    }

    // 3. Grava cada post individual na tabela posts (histórico granular de mensagens e imagens)
    try {
      const postRows = pack.posts.map((p) => ({
        id: p.id,
        pack_id: pack.id,
        created_at: pack.createdAt,
        user_email: normalizedEmail,
        day: p.day,
        date: p.date || null,
        theme: p.theme,
        headline: p.customHeadline || p.headline,
        subheadline: p.customSubheadline || p.subheadline,
        cta: p.customCta || p.cta,
        caption: p.customCaption || p.caption,
        hashtags: p.hashtags,
        layout: p.layout,
        image_url: p.imageUrl || null,
      }));

      await supabase.from("posts").upsert(postRows, { onConflict: "id" });
    } catch {
      // Ignora silenciosamente caso a tabela posts ainda não exista no Supabase
    }

    if (savedRow) {
      // Sincroniza silenciosamente em cache local
      try {
        const store = await readLocalStore();
        if (!store[normalizedEmail]) store[normalizedEmail] = [];
        store[normalizedEmail] = store[normalizedEmail].filter((p) => p.id !== pack.id);
        store[normalizedEmail].unshift(pack);
        await writeLocalStore(store);
      } catch {}

      return mapFromSupabase(savedRow);
    }
  }

  // Fallback Local exclusivamente se Supabase não configurado ou inacessível
  const store = await readLocalStore();
  if (!store[normalizedEmail]) {
    store[normalizedEmail] = [];
  }
  store[normalizedEmail] = store[normalizedEmail].filter((p) => p.id !== pack.id);
  store[normalizedEmail].unshift(pack);
  await writeLocalStore(store);
  return pack;
}

export type PackFilters = {
  search?: string;
  startDate?: string;
  endDate?: string;
};

/**
 * Lista o histórico de packs gerados para o usuário autenticado diretamente do Supabase.
 */
export async function listPacks(
  userEmail: string,
  filters?: PackFilters,
): Promise<{ packs: SavedPack[]; isCloud: boolean }> {
  const supabase = getSupabaseServerClient();
  const normalizedEmail = userEmail.toLowerCase().trim();

  if (supabase) {
    // 1. Tenta consultar a tabela post_packs
    try {
      let query = supabase
        .from("post_packs")
        .select("*")
        .or(`user_email.ilike.${normalizedEmail},user_email.eq.${normalizedEmail}`)
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
      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          return {
            packs: data.map(mapFromSupabase),
            isCloud: true,
          };
        }
      }
    } catch (err) {
      console.warn("[SocialPack] Falha ao consultar post_packs:", err);
    }

    // 2. Se post_packs não retornou linhas ou falhou, tenta a tabela packs
    try {
      let query = supabase
        .from("packs")
        .select("*")
        .or(`user_email.ilike.${normalizedEmail},user_email.eq.${normalizedEmail}`)
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
      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          packs: data.map(mapFromSupabase),
          isCloud: true,
        };
      }
    } catch (err) {
      console.warn("[SocialPack] Falha ao consultar packs:", err);
    }

    // Se Supabase está configurado e respondeu com lista vazia, retorna vazio confirmado na nuvem
    return {
      packs: [],
      isCloud: true,
    };
  }

  // Fallback Local exclusivamente se Supabase não configurado
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
 * Remove um pack do histórico pelo ID (com autorização por usuário no Supabase).
 */
export async function deletePack(
  id: string,
  userEmail: string,
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const normalizedEmail = userEmail.toLowerCase().trim();

  if (supabase) {
    try {
      await supabase
        .from("post_packs")
        .delete()
        .eq("id", id)
        .or(`user_email.ilike.${normalizedEmail},user_email.eq.${normalizedEmail}`);
    } catch {}

    try {
      await supabase
        .from("packs")
        .delete()
        .eq("id", id)
        .or(`user_email.ilike.${normalizedEmail},user_email.eq.${normalizedEmail}`);
    } catch {}

    try {
      await supabase
        .from("posts")
        .delete()
        .eq("pack_id", id)
        .or(`user_email.ilike.${normalizedEmail},user_email.eq.${normalizedEmail}`);
    } catch {}

    // Limpa do cache local
    try {
      const store = await readLocalStore();
      const userPacks = store[normalizedEmail] || [];
      store[normalizedEmail] = userPacks.filter((p) => p.id !== id);
      await writeLocalStore(store);
    } catch {}

    return true;
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
  const normalizedEmail = userEmail.toLowerCase().trim();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("post_packs")
        .select("*")
        .eq("id", id)
        .or(`user_email.ilike.${normalizedEmail},user_email.eq.${normalizedEmail}`)
        .maybeSingle();

      if (!error && data) {
        return mapFromSupabase(data);
      }
    } catch {}

    try {
      const { data, error } = await supabase
        .from("packs")
        .select("*")
        .eq("id", id)
        .or(`user_email.ilike.${normalizedEmail},user_email.eq.${normalizedEmail}`)
        .maybeSingle();

      if (!error && data) {
        return mapFromSupabase(data);
      }
    } catch {}
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
  const normalizedEmail = userEmail.toLowerCase().trim();

  if (supabase) {
    let updatedData: Record<string, unknown> | null = null;

    try {
      const { data, error } = await supabase
        .from("post_packs")
        .update({ posts })
        .eq("id", id)
        .or(`user_email.ilike.${normalizedEmail},user_email.eq.${normalizedEmail}`)
        .select()
        .single();

      if (!error && data) {
        updatedData = data;
      }
    } catch {}

    if (!updatedData) {
      try {
        const { data, error } = await supabase
          .from("packs")
          .update({ posts })
          .eq("id", id)
          .or(`user_email.ilike.${normalizedEmail},user_email.eq.${normalizedEmail}`)
          .select()
          .single();

        if (!error && data) {
          updatedData = data;
        }
      } catch {}
    }

    // Atualiza também na tabela individual posts
    try {
      const postRows = posts.map((p) => ({
        id: p.id,
        pack_id: id,
        user_email: normalizedEmail,
        day: p.day,
        date: p.date || null,
        theme: p.theme,
        headline: p.customHeadline || p.headline,
        subheadline: p.customSubheadline || p.subheadline,
        cta: p.customCta || p.cta,
        caption: p.customCaption || p.caption,
        hashtags: p.hashtags,
        layout: p.layout,
        image_url: p.imageUrl || null,
      }));

      await supabase.from("posts").upsert(postRows, { onConflict: "id" });
    } catch {}

    if (updatedData) {
      return mapFromSupabase(updatedData);
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

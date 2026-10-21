import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseServerClient } from "./supabase";
import type { PostTemplate, TemplateModel } from "./types";

const TEMPLATES_DIR = path.join(process.cwd(), "content", "templates");

function mapFromSupabase(row: Record<string, unknown>): TemplateModel {
  return {
    id: String(row.id),
    categoryId: String(row.category_id || "geral"),
    nicheId: String(row.niche_id || "geral"),
    theme: String(row.theme || ""),
    headline: String(row.headline || ""),
    subheadline: String(row.subheadline || ""),
    cta: String(row.cta || ""),
    caption: String(row.caption || ""),
    hashtags: Array.isArray(row.hashtags) ? (row.hashtags as string[]) : [],
    tones: Array.isArray(row.tones) ? (row.tones as string[]) : undefined,
    layout: typeof row.layout === "number" ? row.layout : 0,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

/**
 * Lê recursivamente todos os templates locais em JSON caso o Supabase não esteja conectado.
 */
async function loadLocalTemplates(): Promise<TemplateModel[]> {
  const templates: TemplateModel[] = [];

  try {
    const entries = await readdir(TEMPLATES_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "README.md") continue;

      if (entry.isFile() && entry.name.endsWith(".json")) {
        const filePath = path.join(TEMPLATES_DIR, entry.name);
        try {
          const content = JSON.parse(await readFile(filePath, "utf8"));
          const posts: PostTemplate[] = Array.isArray(content?.posts) ? content.posts : [];
          posts.forEach((p, idx) => {
            templates.push({
              id: `local-generic-${idx}`,
              categoryId: "geral",
              nicheId: "geral",
              theme: p.theme || "Conteúdo",
              headline: p.headline || "",
              subheadline: p.subheadline || "",
              cta: p.cta || "",
              caption: p.caption || "",
              hashtags: p.hashtags || [],
              tones: p.tones,
              layout: idx % 7,
            });
          });
        } catch {
          // ignora arquivo mal formatado
        }
      } else if (entry.isDirectory()) {
        const categoryId = entry.name;
        const subDir = path.join(TEMPLATES_DIR, categoryId);
        try {
          const subEntries = await readdir(subDir, { withFileTypes: true });
          for (const sub of subEntries) {
            if (sub.isFile() && sub.name.endsWith(".json")) {
              const nicheId = sub.name.replace(".json", "");
              const filePath = path.join(subDir, sub.name);
              try {
                const content = JSON.parse(await readFile(filePath, "utf8"));
                const posts: PostTemplate[] = Array.isArray(content?.posts) ? content.posts : [];
                posts.forEach((p, idx) => {
                  templates.push({
                    id: `local-${categoryId}-${nicheId}-${idx}`,
                    categoryId,
                    nicheId,
                    theme: p.theme || "Conteúdo",
                    headline: p.headline || "",
                    subheadline: p.subheadline || "",
                    cta: p.cta || "",
                    caption: p.caption || "",
                    hashtags: p.hashtags || [],
                    tones: p.tones,
                    layout: idx % 7,
                  });
                });
              } catch {
                // ignora
              }
            }
          }
        } catch {
          // ignora
        }
      }
    }
  } catch (err) {
    console.warn("[SocialPack] Erro ao carregar templates locais:", err);
  }

  return templates;
}

/**
 * Lista todos os templates disponíveis com paginação opcional.
 */
export async function listTemplates(limit = 50): Promise<TemplateModel[]> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data.map(mapFromSupabase);
      }
    } catch (err) {
      console.warn("[SocialPack] Falha na consulta de templates Supabase, usando local:", err);
    }
  }

  const local = await loadLocalTemplates();
  return local.slice(0, limit);
}

/**
 * Busca um template específico por seu ID único.
 */
export async function getTemplateById(id: string): Promise<TemplateModel | null> {
  const supabase = getSupabaseServerClient();

  if (supabase && !id.startsWith("local-")) {
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return mapFromSupabase(data);
      }
    } catch (err) {
      console.warn("[SocialPack] Falha ao buscar template por ID no Supabase:", err);
    }
  }

  const local = await loadLocalTemplates();
  return local.find((t) => t.id === id) || null;
}

/**
 * Filtra templates por categoria e opcionalmente por nicho.
 */
export async function filterByCategory(
  categoryId: string,
  nicheId?: string,
): Promise<TemplateModel[]> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      let query = supabase.from("templates").select("*").eq("category_id", categoryId);
      if (nicheId) {
        query = query.eq("niche_id", nicheId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(mapFromSupabase);
      }
    } catch (err) {
      console.warn("[SocialPack] Falha ao filtrar templates no Supabase:", err);
    }
  }

  const local = await loadLocalTemplates();
  return local.filter((t) => {
    if (t.categoryId !== categoryId && t.categoryId !== "geral") return false;
    if (nicheId && t.nicheId !== nicheId && t.nicheId !== "geral") return false;
    return true;
  });
}

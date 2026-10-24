/* eslint-disable @typescript-eslint/no-explicit-any */
import Module from "node:module";

// Interceptar server-only para execução segura em scripts CLI/Node
const originalLoad = (Module as any)._load;
(Module as any)._load = function (request: string, ...args: unknown[]) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.apply(this, args);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

import fs from "node:fs";
import path from "node:path";
import { TemplateLayoutStructureSchema } from "../src/lib/schemas";

// Carregar variáveis de ambiente de .env.local ou .env se existirem
for (const envPath of [".env.local", ".env"]) {
  const fullPath = path.resolve(process.cwd(), envPath);
  if (fs.existsSync(fullPath)) {
    try {
      process.loadEnvFile(fullPath);
      console.log(`[Seed] Variáveis carregadas de ${envPath}`);
      break;
    } catch {
      // Ignorar caso não consiga carregar diretamente
    }
  }
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

interface RawPost {
  theme: string;
  headline: string;
  subheadline?: string;
  cta: string;
  caption: string;
  hashtags?: string[];
  tones?: string[];
  imageUrl?: string;
}

interface RawTemplateFile {
  label?: string;
  posts?: RawPost[];
}

interface TemplateRecord {
  slug: string;
  title: string;
  version: string;
  category: string;
  platform: string;
  format: string;
  aspect_ratio: string;
  layout_structure: unknown;
  is_active: boolean;
}

function findJsonFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function runSeed() {
  console.log("=== INICIANDO SEED AUTOMATIZADO DO CATÁLOGO DE TEMPLATES (FASE 2) ===");

  const templatesDir = path.resolve(process.cwd(), "content", "templates");
  const catalogPath = path.resolve(process.cwd(), "content", "catalog.json");

  if (!fs.existsSync(templatesDir)) {
    throw new Error(`Diretório de templates não encontrado em: ${templatesDir}`);
  }

  // Carregar catálogo para nomes amigáveis
  const catalogNiches: Record<string, { label: string; category: string }> = {};
  if (fs.existsSync(catalogPath)) {
    try {
      const catalogContent = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
      for (const cat of catalogContent.categories || []) {
        for (const niche of cat.niches || []) {
          catalogNiches[niche.id] = { label: niche.label, category: cat.id };
        }
      }
    } catch (e) {
      console.warn("[Seed] Aviso ao carregar catalog.json:", e);
    }
  }

  const jsonFiles = findJsonFiles(templatesDir);
  console.log(`[Seed] Encontrados ${jsonFiles.length} arquivos JSON de templates.`);

  const recordsToInsert: TemplateRecord[] = [];
  const seenSlugs = new Set<string>();
  let validationErrorsCount = 0;

  for (const file of jsonFiles) {
    const relative = path.relative(templatesDir, file);
    const parsedPath = path.parse(relative);

    let category = "geral";
    let nicheId = parsedPath.name;
    let nicheLabel = "Geral";

    if (parsedPath.dir) {
      category = parsedPath.dir.split(path.sep)[0];
      nicheId = parsedPath.name;
      nicheLabel = catalogNiches[nicheId]?.label || parsedPath.name;
    } else if (nicheId === "_generic") {
      category = "geral";
      nicheId = "generico";
      nicheLabel = "Genérico";
    }

    try {
      const rawContent = fs.readFileSync(file, "utf-8");
      const data: RawTemplateFile = JSON.parse(rawContent);

      let postsToProcess: RawPost[] = Array.isArray(data.posts) ? data.posts : [];

      // Se o nicho ainda não possui posts exclusivos, adaptar os primeiros 5 de _generic.json
      if (postsToProcess.length === 0 && nicheId !== "generico") {
        const genericFilePath = path.join(templatesDir, "_generic.json");
        if (fs.existsSync(genericFilePath)) {
          const genericData: RawTemplateFile = JSON.parse(fs.readFileSync(genericFilePath, "utf-8"));
          if (Array.isArray(genericData.posts)) {
            postsToProcess = genericData.posts.slice(0, 5).map((gp) => ({
              ...gp,
              hashtags: [...(gp.hashtags || []), `#${slugify(nicheLabel)}`],
            }));
          }
        }
      }

      if (postsToProcess.length === 0) {
        continue;
      }

      postsToProcess.forEach((post, index) => {
        const themeSlug = slugify(post.theme || `post-${index + 1}`);
        const baseSlug = `${category}-${nicheId}-${themeSlug}-v1`;
        let uniqueSlug = baseSlug;
        let suffix = 1;

        while (seenSlugs.has(uniqueSlug)) {
          suffix++;
          uniqueSlug = `${category}-${nicheId}-${themeSlug}-${suffix}-v1`;
        }
        seenSlugs.add(uniqueSlug);

        const layoutStructure = {
          layout: index % 7,
          theme: post.theme || "Tema Geral",
          headline: post.headline || "Headline",
          subheadline: post.subheadline || "",
          cta: post.cta || "Confira",
          caption: post.caption || "",
          hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
          tones: Array.isArray(post.tones) ? post.tones : [],
          slots: {
            badge: post.theme || "",
            headline: post.headline || "",
            subheadline: post.subheadline || "",
            cta: post.cta || "",
            handle: "{instagram}",
          },
          typography: {
            fontFamily: "Inter Variable, sans-serif",
            headlineWeight: 600,
            bodyWeight: 400,
          },
          colors: {
            "brand.primary": "#5E6AD2",
            "brand.secondary": "#7170FF",
            "text.onDark": "#F7F8F8",
            "text.secondary": "#D0D6E0",
            "text.muted": "#8A8F98",
          },
          fallbackCopy: {
            headline: post.headline,
            subheadline: post.subheadline || "",
            cta: post.cta,
            caption: post.caption || "",
          },
        };

        // Validação estrita via Zod
        const validation = TemplateLayoutStructureSchema.safeParse(layoutStructure);
        if (!validation.success) {
          console.error(`[Seed] Erro de validação Zod no template ${uniqueSlug}:`, validation.error.format());
          validationErrorsCount++;
          return;
        }

        const title = `${nicheLabel} — ${post.theme || `Post ${index + 1}`}`;

        recordsToInsert.push({
          slug: uniqueSlug,
          title,
          version: "1.0",
          category,
          platform: "instagram",
          format: "feed_post",
          aspect_ratio: "1:1",
          layout_structure: layoutStructure,
          is_active: true,
        });
      });
    } catch (err) {
      console.error(`[Seed] Erro ao ler arquivo ${file}:`, err);
      validationErrorsCount++;
    }
  }

  console.log(`[Seed] Total de templates processados e validados: ${recordsToInsert.length}`);
  if (validationErrorsCount > 0) {
    console.warn(`[Seed] Houve ${validationErrorsCount} erros de validação.`);
  }

  // Verificar credenciais do Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isPlaceholder = !supabaseUrl || supabaseUrl.includes("seu-projeto.supabase.co") || !serviceRoleKey || serviceRoleKey.includes("sua-chave");

  if (isPlaceholder) {
    console.log("\n⚠️ [Seed] Supabase com credenciais padrão/placeholder detectadas.");
    console.log("   Validação de estrutura concluída com sucesso offline!");
    console.log("   Para sincronizar com o banco remoto, preencha SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL válidos no .env.local.");
    return {
      totalParsed: recordsToInsert.length,
      syncedToDb: 0,
      validationErrors: validationErrorsCount,
      offlineSuccess: true,
    };
  }

  console.log("\n[Seed] Sincronizando com o Supabase via createAdminClient...");
  const { createAdminClient } = await import("../src/lib/supabase/admin");
  const supabase = createAdminClient();

  // Inserção em lotes de 50
  const BATCH_SIZE = 50;
  let totalInserted = 0;

  for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
    const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("templates").upsert(batch, { onConflict: "slug" });

    if (error) {
      console.error(`[Seed] Erro ao inserir lote ${i} a ${i + batch.length}:`, error.message);
      throw error;
    }

    totalInserted += batch.length;
    console.log(`[Seed] Lote inserido com sucesso: ${totalInserted}/${recordsToInsert.length}`);
  }

  console.log(`\n🎉 [Seed] Concluído com sucesso! Total sincronizado no Supabase: ${totalInserted} templates.`);
  return {
    totalParsed: recordsToInsert.length,
    syncedToDb: totalInserted,
    validationErrors: 0,
    offlineSuccess: true,
  };
}

runSeed().catch((err) => {
  console.error("[Seed] Falha na execução do seed:", err);
  process.exit(1);
});

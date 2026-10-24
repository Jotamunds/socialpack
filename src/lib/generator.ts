import fs from "node:fs";
import path from "node:path";
import { calculateWeekSchedule, formatWeekRange } from "./date-utils";
import { getCuratedPhoto } from "./curated-images";
import { findNiche } from "./catalog";
import type {
  CompanyProfile,
  GeneratedPost,
  GenerateResponse,
  PostTemplate,
  ContentSource,
} from "./types";

interface TemplateJsonFile {
  label?: string;
  posts: PostTemplate[];
}

function interpolate(text: string, vars: Record<string, string>): string {
  if (!text) return "";
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

function loadGenericTemplates(): PostTemplate[] {
  try {
    const genericPath = path.join(process.cwd(), "content", "templates", "_generic.json");
    if (fs.existsSync(genericPath)) {
      const raw = fs.readFileSync(genericPath, "utf-8");
      const parsed: TemplateJsonFile = JSON.parse(raw);
      return parsed.posts || [];
    }
  } catch (err) {
    console.error("Falha ao carregar _generic.json:", err);
  }
  return [];
}

function loadNicheTemplates(categoryId?: string, nicheId?: string): { posts: PostTemplate[]; source: ContentSource } {
  if (!nicheId) {
    return { posts: loadGenericTemplates(), source: "generic" };
  }

  const templatesDir = path.join(process.cwd(), "content", "templates");

  // 1. Tentar caminho direto: category/niche.json
  if (categoryId) {
    const directPath = path.join(templatesDir, categoryId, `${nicheId}.json`);
    if (fs.existsSync(directPath)) {
      try {
        const raw = fs.readFileSync(directPath, "utf-8");
        const parsed: TemplateJsonFile = JSON.parse(raw);
        return { posts: parsed.posts || [], source: "niche" };
      } catch (err) {
        console.error(`Erro ao ler template ${directPath}:`, err);
      }
    }
  }

  // 2. Busca recursiva por nicheId.json caso a categoria informada seja diferente
  try {
    const categories = fs.readdirSync(templatesDir);
    for (const cat of categories) {
      const catPath = path.join(templatesDir, cat);
      if (fs.statSync(catPath).isDirectory()) {
        const candidate = path.join(catPath, `${nicheId}.json`);
        if (fs.existsSync(candidate)) {
          const raw = fs.readFileSync(candidate, "utf-8");
          const parsed: TemplateJsonFile = JSON.parse(raw);
          return { posts: parsed.posts || [], source: "niche" };
        }
      }
    }
  } catch {
    // Ignora e faz fallback para generic
  }

  return { posts: loadGenericTemplates(), source: "generic" };
}

/**
 * Motor determinístico de geração semanal (7 posts)
 * Combina templates de nicho, _generic.json, imagens curadas Unsplash e cronograma semanal.
 */
export function generateWeek(company: CompanyProfile, startDate?: string): GenerateResponse {
  const schedule = calculateWeekSchedule(startDate);
  const nicheLabel = findNiche(company.categoryId, company.nicheId)?.label || company.nicheId || "Geral";

  const { posts: nichePosts, source: initialSource } = loadNicheTemplates(company.categoryId, company.nicheId);
  const genericPosts = loadGenericTemplates();

  const handle = company.instagram
    ? `@${company.instagram.replace(/^@+/, "")}`
    : company.name;

  const vars: Record<string, string> = {
    nome: company.name,
    cidade: company.city,
    estado: company.state || "Brasil",
    instagram: handle,
    handle,
    nicho: nicheLabel,
  };

  const selectedPosts: GeneratedPost[] = [];
  let source: ContentSource = initialSource;

  for (let i = 0; i < 7; i++) {
    const daySchedule = schedule[i];
    let template: PostTemplate | undefined = nichePosts[i];

    if (!template) {
      template = genericPosts[i % genericPosts.length];
      if (source === "niche") {
        source = "mixed";
      }
    }

    if (!template) {
      // Fallback de emergência caso nenhum arquivo exista
      template = {
        theme: "Destaque",
        headline: `{nome} em {cidade}`,
        subheadline: "Qualidade, dedicação e o melhor atendimento para você.",
        cta: "Saiba mais",
        caption: `Conheça a {nome} em {cidade}! Atendimento diferenciado e soluções completas para você.\n\nFale conosco pelo direct!`,
        hashtags: ["#novidade", "#destaque", "#qualidade"],
      };
    }

    const headline = interpolate(template.headline, vars);
    const subheadline = interpolate(template.subheadline, vars);
    const cta = interpolate(template.cta, vars);
    const caption = interpolate(template.caption, vars);
    const hashtags = (template.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`));

    // Foto curada por nicho garantida
    const imageUrl = getCuratedPhoto(company.nicheId, company.categoryId, i);

    selectedPosts.push({
      id: `post-${i}-${daySchedule.isoDate}`,
      day: daySchedule.fullDayLabel,
      date: daySchedule.isoDate,
      dayOfWeek: daySchedule.dayOfWeek,
      formattedDate: daySchedule.formattedDate,
      theme: template.theme,
      headline,
      subheadline,
      cta,
      caption,
      hashtags,
      layout: i % 7,
      imageUrl,
    });
  }

  return {
    posts: selectedPosts,
    source,
    nicheLabel,
    startDate: schedule[0].isoDate,
    endDate: schedule[6].isoDate,
    weekRangeLabel: formatWeekRange(startDate),
    createdAt: new Date().toISOString(),
  };
}

import fs from "node:fs";
import path from "node:path";
import { calculateWeekSchedule, formatWeekRange } from "./date-utils";
import { getCuratedPhoto } from "./curated-images";
import { findCategory, findNiche, findTone } from "./catalog";
import { WeeklyPackContentSchema } from "./schemas";
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

interface RankedTemplate extends PostTemplate {
  pool: "niche" | "generic";
  slugBase: string;
  slug: string;
}

/**
 * Histórico recente da empresa, usado para evitar repetição entre pacotes.
 * - recentTemplateSlugs: slugs dos posts anteriores, do mais recente para o mais antigo.
 * - previousLayouts: layouts do último pacote, na ordem dos dias (0–6).
 */
export interface GenerationHistory {
  recentTemplateSlugs?: string[];
  previousLayouts?: number[];
}

export const POSTS_PER_PACK = 7;
export const LAYOUT_COUNT = 7;

export function buildTemplateSlug(slugBase: string, theme: string): string {
  return `${slugBase}/${slugTag(theme.trim()) || "sem-tema"}`;
}

function interpolate(text: string, vars: Record<string, string>): string {
  if (!text) return "";
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

/** Remove emojis e pictogramas quando o tom não permite. */
export function stripEmojis(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\uFE0F/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Normaliza texto para hashtag local sem acentos. */
export function slugTag(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32);
}

export function matchesTone(template: PostTemplate, toneId: string): boolean {
  if (!template.tones || template.tones.length === 0) return true;
  return template.tones.includes(toneId);
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function clampText(value: string, min: number, max: number, fallback: string): string {
  let text = (value || "").trim().replace(/\s+/g, " ");
  if (text.length > max) {
    text = text.slice(0, max).trim();
  }
  if (text.length < min) {
    const padded = `${text} ${fallback}`.trim();
    text = padded.slice(0, max).trim();
  }
  if (text.length < min) {
    text = fallback.slice(0, max);
  }
  return text;
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

function loadNicheTemplates(
  categoryId?: string,
  nicheId?: string
): { posts: PostTemplate[]; source: ContentSource; slugBase: string } {
  if (!nicheId) {
    return { posts: loadGenericTemplates(), source: "generic", slugBase: "_generic" };
  }

  const templatesDir = path.join(process.cwd(), "content", "templates");

  if (categoryId) {
    const directPath = path.join(templatesDir, categoryId, `${nicheId}.json`);
    if (fs.existsSync(directPath)) {
      try {
        const raw = fs.readFileSync(directPath, "utf-8");
        const parsed: TemplateJsonFile = JSON.parse(raw);
        return {
          posts: parsed.posts || [],
          source: "niche",
          slugBase: `${categoryId}/${nicheId}`,
        };
      } catch (err) {
        console.error(`Erro ao ler template ${directPath}:`, err);
      }
    }
  }

  try {
    const categories = fs.readdirSync(templatesDir);
    for (const cat of categories) {
      const catPath = path.join(templatesDir, cat);
      if (fs.statSync(catPath).isDirectory()) {
        const candidate = path.join(catPath, `${nicheId}.json`);
        if (fs.existsSync(candidate)) {
          const raw = fs.readFileSync(candidate, "utf-8");
          const parsed: TemplateJsonFile = JSON.parse(raw);
          return {
            posts: parsed.posts || [],
            source: "niche",
            slugBase: `${cat}/${nicheId}`,
          };
        }
      }
    }
  } catch {
    // fallback generic
  }

  return { posts: loadGenericTemplates(), source: "generic", slugBase: "_generic" };
}

function buildLocalHashtags(
  templateTags: string[],
  nicheLabel: string,
  city: string,
  companyName: string
): string[] {
  const tags = new Set<string>();

  for (const raw of templateTags || []) {
    const cleaned = raw.startsWith("#") ? raw : `#${raw}`;
    const body = slugTag(cleaned.replace(/^#/, ""));
    if (body) tags.add(`#${body}`);
  }

  const nicheTag = slugTag(nicheLabel);
  const cityTag = slugTag(city);
  const nameTag = slugTag(companyName);

  if (nicheTag) tags.add(`#${nicheTag}`);
  if (cityTag) tags.add(`#${cityTag}`);
  if (nameTag) tags.add(`#${nameTag}`);

  const list = Array.from(tags);
  while (list.length < 3) {
    list.push(`#${["local", "negocio", "semana"][list.length]}`);
  }
  return list.slice(0, 8);
}

/**
 * Seleção "menos usado primeiro" (LRU) em vez de sorteio puro:
 * 1. Templates nunca usados pela empresa vêm primeiro (nicho antes do genérico),
 *    embaralhados só entre si para manter variedade.
 * 2. Depois vêm os já usados, do uso mais antigo para o mais recente.
 * 3. Continua evitando tema repetido dentro da mesma semana.
 * Resultado: um template só volta quando todos os outros compatíveis já saíram,
 * e nunca volta no pacote seguinte se houver pelo menos 7 alternativas.
 */
function selectWeeklyTemplates(
  nichePosts: PostTemplate[],
  genericPosts: PostTemplate[],
  toneId: string,
  nicheSlugBase: string,
  recentTemplateSlugs: string[] = []
): { selected: RankedTemplate[]; source: ContentSource } {
  // slug -> posição no histórico (0 = mais recente). Só a primeira ocorrência conta.
  const lastUse = new Map<string, number>();
  recentTemplateSlugs.forEach((slug, idx) => {
    if (slug && !lastUse.has(slug)) lastUse.set(slug, idx);
  });

  const toRanked = (
    posts: PostTemplate[],
    pool: "niche" | "generic",
    slugBase: string
  ): RankedTemplate[] =>
    posts
      .filter((p) => matchesTone(p, toneId))
      .map((p) => ({ ...p, pool, slugBase, slug: buildTemplateSlug(slugBase, p.theme) }));

  const niche = toRanked(nichePosts, "niche", nicheSlugBase);
  const generic = toRanked(genericPosts, "generic", "_generic");

  const unused = (list: RankedTemplate[]) => shuffle(list.filter((t) => !lastUse.has(t.slug)));
  const used = [...niche, ...generic]
    .filter((t) => lastUse.has(t.slug))
    // maior índice = uso mais antigo = vem primeiro
    .sort((a, b) => (lastUse.get(b.slug) ?? 0) - (lastUse.get(a.slug) ?? 0));

  const ordered: RankedTemplate[] = [...unused(niche), ...unused(generic), ...used];

  const selected: RankedTemplate[] = [];
  const usedThemes = new Set<string>();
  const usedSlugs = new Set<string>();

  for (const candidate of ordered) {
    if (selected.length >= POSTS_PER_PACK) break;
    const key = candidate.theme.trim().toLowerCase();
    if (usedThemes.has(key) || usedSlugs.has(candidate.slug)) continue;
    usedThemes.add(key);
    usedSlugs.add(candidate.slug);
    selected.push(candidate);
  }

  // Fallback de emergência se pools forem insuficientes.
  // (Corrige loop infinito da versão anterior: o tema agora muda a cada tentativa.)
  for (let attempt = 1; selected.length < POSTS_PER_PACK && attempt <= 50; attempt++) {
    const theme = `Destaque ${attempt}`;
    if (usedThemes.has(theme.toLowerCase())) continue;
    usedThemes.add(theme.toLowerCase());
    selected.push({
      theme,
      headline: `{nome} em {cidade}`,
      subheadline: "Qualidade, dedicação e o melhor atendimento para você.",
      cta: "Saiba mais",
      caption:
        "Conheça a {nome} em {cidade}! Atendimento diferenciado e soluções completas para você.\n\nFale conosco pelo direct!",
      hashtags: ["#novidade", "#destaque", "#qualidade"],
      pool: "generic",
      slugBase: "_generic",
      slug: buildTemplateSlug("_generic", theme),
    });
  }

  const usedNiche = selected.some((s) => s.pool === "niche");
  const usedGeneric = selected.some((s) => s.pool === "generic");
  const source: ContentSource =
    usedNiche && usedGeneric ? "mixed" : usedNiche ? "niche" : "generic";

  return { selected: selected.slice(0, POSTS_PER_PACK), source };
}

/**
 * Permutação dos 7 layouts sem repetição na semana (shuffle sem reposição) e,
 * quando há pacote anterior, sem repetir o mesmo layout no mesmo dia (derangement).
 */
export function pickLayouts(previousLayouts: number[] = []): number[] {
  const base = Array.from({ length: LAYOUT_COUNT }, (_, i) => i);
  const prev = previousLayouts.slice(0, LAYOUT_COUNT);
  if (prev.length === 0) return shuffle(base);

  const clashes = (perm: number[]) => perm.some((layout, day) => prev[day] === layout);
  for (let tries = 0; tries < 30; tries++) {
    const perm = shuffle(base);
    if (!clashes(perm)) return perm;
  }
  // Garantido: rotacionar a sequência anterior em 1 posição.
  if (prev.length === LAYOUT_COUNT && new Set(prev).size === LAYOUT_COUNT) {
    return prev.map((_, day) => prev[(day + 1) % LAYOUT_COUNT]);
  }
  return shuffle(base);
}

/**
 * Motor determinístico de geração semanal (7 posts).
 * Filtra tom, prioriza templates menos usados pela empresa (nicho→genérico),
 * evita tema repetido, injeta signoff, aplica regra de emoji, monta hashtags
 * locais e distribui layouts 0–6 sem repetir o dia do pacote anterior.
 */
export function generateWeek(
  company: CompanyProfile,
  startDate?: string,
  history: GenerationHistory = {}
): GenerateResponse {
  const schedule = calculateWeekSchedule(startDate);
  const nicheMeta = findNiche(company.categoryId, company.nicheId);
  const categoryMeta = findCategory(company.categoryId);
  const tone = findTone(company.toneId);
  const nicheLabel = nicheMeta?.label || company.nicheId || "Geral";
  const tipoLabel = (categoryMeta?.label || company.categoryId || "servicos").toLowerCase();

  const {
    posts: nichePosts,
    source: _initialSource,
    slugBase,
  } = loadNicheTemplates(company.categoryId, company.nicheId);
  const genericPosts = loadGenericTemplates();

  const { selected, source } = selectWeeklyTemplates(
    nichePosts,
    genericPosts,
    company.toneId,
    slugBase,
    history.recentTemplateSlugs ?? []
  );

  const handle = company.instagram
    ? `@${company.instagram.replace(/^@+/, "")}`
    : company.name;

  const vars: Record<string, string> = {
    nome: company.name,
    cidade: company.city,
    estado: company.state || "Brasil",
    instagram: handle,
    handle,
    nicho: nicheLabel.toLowerCase(),
    tipo: tipoLabel,
  };

  const layouts = pickLayouts(history.previousLayouts);
  const allowEmojis = Boolean(tone?.emojis);
  const signoff = tone?.signoff?.trim() || "";

  const selectedPosts: GeneratedPost[] = [];

  for (let i = 0; i < POSTS_PER_PACK; i++) {
    const daySchedule = schedule[i];
    const template = selected[i];
    if (!template) {
      throw new Error("Pacote semanal incompleto: não há templates suficientes.");
    }

    let headline = interpolate(template.headline, vars);
    let subheadline = interpolate(template.subheadline, vars);
    let cta = interpolate(template.cta, vars);
    let caption = interpolate(template.caption, vars);

    if (signoff && !caption.includes(signoff)) {
      caption = `${caption.trim()}\n\n${signoff}`;
    }

    if (!allowEmojis) {
      headline = stripEmojis(headline);
      subheadline = stripEmojis(subheadline);
      cta = stripEmojis(cta);
      caption = stripEmojis(caption);
    }

    headline = clampText(headline, 10, 68, `${company.name} em ${company.city}`);
    subheadline = clampText(
      subheadline,
      15,
      120,
      `Atendimento de qualidade para você em ${company.city}.`
    );
    cta = clampText(cta, 4, 28, "Saiba mais");
    caption = clampText(
      caption,
      40,
      1200,
      `Conheça a ${company.name} em ${company.city}. Atendimento próximo e resultado de verdade.`
    );

    const hashtags = buildLocalHashtags(
      template.hashtags || [],
      nicheLabel,
      company.city,
      company.name
    );

    const badgeText = clampText(template.theme, 2, 24, daySchedule.shortDay);
    const themeKey = template.theme.trim();
    const templateSlug = template.slug;

    selectedPosts.push({
      id: `post-${i}-${daySchedule.isoDate}`,
      day: daySchedule.fullDayLabel,
      date: daySchedule.isoDate,
      dayOfWeek: daySchedule.dayOfWeek,
      formattedDate: daySchedule.formattedDate,
      theme: themeKey,
      badgeText,
      headline,
      subheadline,
      cta,
      caption,
      hashtags,
      layout: layouts[i],
      imageUrl: getCuratedPhoto(company.nicheId, company.categoryId, i),
      templateSlug,
      templateVersion: 1,
    });
  }

  const packValidation = WeeklyPackContentSchema.safeParse({
    posts: selectedPosts.map((post, dayIndex) => ({
      dayIndex,
      badgeText: post.badgeText || post.theme.slice(0, 24),
      headline: post.headline,
      subheadline: post.subheadline,
      ctaText: post.cta,
      captionCopy: post.caption,
      hashtags: post.hashtags,
      theme: post.theme,
      layout: post.layout,
      templateSlug: post.templateSlug || `pack/day-${dayIndex}`,
      templateVersion: post.templateVersion || 1,
    })),
  });

  if (!packValidation.success) {
    const first = packValidation.error.issues[0]?.message || "Pacote semanal inválido.";
    throw new Error(`Falha na validação do pacote semanal: ${first}`);
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

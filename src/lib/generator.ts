import fs from "node:fs";
import path from "node:path";
import { calculateWeekSchedule, formatWeekRange } from "./date-utils";
import { pickPackPhotos } from "./curated-images";
import { findCategory, findNiche, findTone } from "./catalog";
import { WeeklyPackContentSchema } from "./schemas";
import { CAMPAIGN_LAYOUTS, FIRST_CAMPAIGN_LAYOUT, type CampaignCategory } from "./campaign-layouts";
import { normalizePostFormat, type PostFormat } from "./post-format";
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
  /** Layouts recentes, em ordem do mais recente para o mais antigo. */
  recentLayoutIds?: number[];
}

export const POSTS_PER_PACK = 7;
/** Total dos layouts históricos L0–L6; permanece para compatibilidade de testes e posts antigos. */
export const LAYOUT_COUNT = 7;
export const CAMPAIGN_LAYOUT_COUNT = CAMPAIGN_LAYOUTS.length;

export type GenerationOptions = {
  /** Uma mesma seed + empresa + conteúdo produz a mesma seleção e ordem de layouts. */
  seed?: string;
  /** O formato é aplicado ao pacote inteiro, evitando arquivos mistos dentro do ZIP. */
  format?: PostFormat;
};

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

function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** PRNG pequeno e serializável; não depende de IA nem de estado global. */
function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    state ^= seed.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function defaultSeed(company: CompanyProfile, startDate?: string) {
  return [company.id || company.name, company.categoryId, company.nicheId, startDate || "semana-atual"].join("|");
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
export function selectWeeklyTemplates(
  nichePosts: PostTemplate[],
  genericPosts: PostTemplate[],
  toneId: string,
  nicheSlugBase: string,
  recentTemplateSlugs: string[] = [],
  random: () => number = Math.random
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

  const unused = (list: RankedTemplate[]) => shuffle(list.filter((t) => !lastUse.has(t.slug)), random);
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

  // Sem reposição: tema e slug já usados neste pacote ficam de fora.
  // Se o catálogo não cobre os 7 dias, completa com temas de reserva únicos.
  if (selected.length < POSTS_PER_PACK) {
    console.warn(
      `[generateWeek] Templates distintos insuficientes para o pacote (${selected.length}/${POSTS_PER_PACK}). Completando com temas de reserva, sem repetir template.`
    );
  }

  let reserve = 0;
  while (selected.length < POSTS_PER_PACK) {
    reserve += 1;
    let theme = `Destaque ${reserve}`;
    let slug = buildTemplateSlug("_generic", theme);
    if (usedThemes.has(theme.toLowerCase()) || usedSlugs.has(slug)) {
      theme = `Reserva ${selected.length + 1}-${reserve}`;
      slug = buildTemplateSlug("_generic", theme);
    }
    if (usedThemes.has(theme.toLowerCase()) || usedSlugs.has(slug)) {
      if (reserve > 500) {
        console.warn(
          `[generateWeek] Tema de reserva "${theme}" já estava no pacote. A geração segue sem interromper.`
        );
        break;
      }
      continue;
    }
    usedThemes.add(theme.toLowerCase());
    usedSlugs.add(slug);
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
      slug,
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

const CATEGORY_KEYWORDS: Record<CampaignCategory, string[]> = {
  promotion: ["promo", "oferta", "desconto", "cupom", "preco", "preço", "liquid", "condicao", "condição", "frete"],
  launch: ["lancamento", "lançamento", "novidade", "novo", "nova", "chegou", "inaugur"],
  bundle: ["combo", "kit", "pacote", "selecao", "seleção", "juntos"],
  testimonial: ["depoimento", "avaliacao", "avaliação", "cliente", "experiencia", "experiência", "historia", "história"],
  institutional: ["valor", "proposito", "propósito", "historia", "história", "quem somos", "equipe", "missao", "missão"],
  education: ["dica", "mito", "verdade", "como", "passo", "guia", "duvida", "dúvida", "pergunta", "checklist"],
  catalog: ["catalogo", "catálogo", "colecao", "coleção", "produto", "servico", "serviço", "cardapio", "cardápio", "vitrine"],
  seasonal: ["natal", "ano novo", "dia das", "dia dos", "pascoa", "páscoa", "black friday", "feriado", "verao", "verão", "inverno", "especial"],
};

function normalizeForMatch(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function categoryForPost(post: Pick<PostTemplate, "theme" | "headline" | "subheadline">): CampaignCategory | undefined {
  const haystack = normalizeForMatch(`${post.theme} ${post.headline} ${post.subheadline}`);
  let best: CampaignCategory | undefined;
  let score = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [CampaignCategory, string[]][]) {
    const matches = keywords.reduce((count, keyword) => count + (haystack.includes(normalizeForMatch(keyword)) ? 1 : 0), 0);
    if (matches > score) {
      best = category;
      score = matches;
    }
  }
  return best;
}

/** Mesma conta de `CampaignPostCard`: L7–L30 viram 5 desenhos (Ledger, Poster, Tiles, Immersive, Board). */
function campaignDesign(layoutId: number): number {
  return (layoutId - FIRST_CAMPAIGN_LAYOUT) % 5;
}

/**
 * Escolhe pelo desenho visual, não pelo id. Os 5 desenhos entram antes de
 * qualquer repetição, e dias seguidos nunca compartilham desenho (inclusive
 * os dias 6 e 7, que ainda não têm desenho próprio). Categoria e histórico
 * só desempatam dentro dos desenhos permitidos.
 */
export function pickCampaignLayouts(
  posts: Pick<PostTemplate, "theme" | "headline" | "subheadline">[],
  company: CompanyProfile,
  history: GenerationHistory,
  seed: string
): { layouts: number[]; categories: CampaignCategory[] } {
  const random = seededRandom(`${seed}|${company.categoryId}|${company.nicheId}|${company.colors.primary}`);
  const categories = shuffle(Object.keys(CATEGORY_KEYWORDS) as CampaignCategory[], random);
  const recent = new Set(history.recentLayoutIds ?? []);
  const previous = history.previousLayouts ?? [];
  const used = new Set<number>();
  const uses = new Map<CampaignCategory, number>();
  const layouts: number[] = [];
  const selectedCategories: CampaignCategory[] = [];
  const designCount = 5;

  for (let index = 0; index < POSTS_PER_PACK; index++) {
    const post = posts[index];
    const preferred = post ? categoryForPost(post) : undefined;
    const orderedCategories = [
      ...(preferred ? [preferred] : []),
      ...categories.filter((category) => category !== preferred).sort((a, b) => (uses.get(a) ?? 0) - (uses.get(b) ?? 0)),
    ];
    const usedDesigns = new Set(layouts.map((id) => campaignDesign(id)));
    const previousDesign = index > 0 ? campaignDesign(layouts[index - 1]) : undefined;
    const designAllowed = (layoutId: number) => {
      const design = campaignDesign(layoutId);
      if (previousDesign !== undefined && design === previousDesign) return false;
      if (usedDesigns.size < designCount && usedDesigns.has(design)) return false;
      return true;
    };

    const eligible = CAMPAIGN_LAYOUTS.filter((layout) => !used.has(layout.id) && designAllowed(layout.id));
    const fresh = eligible.filter((layout) => !recent.has(layout.id) && previous[index] !== layout.id);
    const source = fresh.length > 0 ? fresh : eligible;

    let candidates = source;
    for (const category of orderedCategories) {
      const pool = source.filter((layout) => layout.category === category);
      if (pool.length > 0) {
        candidates = pool;
        break;
      }
    }
    if (candidates.length === 0) {
      const fallback = CAMPAIGN_LAYOUTS.filter(
        (layout) => !used.has(layout.id) && (previousDesign === undefined || campaignDesign(layout.id) !== previousDesign)
      );
      candidates = fallback.length > 0 ? fallback : CAMPAIGN_LAYOUTS.filter((layout) => !used.has(layout.id));
    }

    const choice = candidates[Math.floor(random() * candidates.length)] || CAMPAIGN_LAYOUTS[index % CAMPAIGN_LAYOUTS.length];
    used.add(choice.id);
    uses.set(choice.category, (uses.get(choice.category) ?? 0) + 1);
    layouts.push(choice.id);
    selectedCategories.push(choice.category);
  }

  return { layouts, categories: selectedCategories };
}

function reserveTemplate(index: number): RankedTemplate {
  const theme = `Reserva dia ${index + 1}`;
  console.warn(
    `[generateWeek] Post ${index + 1} sem template após a seleção. Usando texto de reserva para não interromper a geração.`
  );
  return {
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
  };
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
  history: GenerationHistory = {},
  options: GenerationOptions = {}
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

  const seed = options.seed?.trim() || defaultSeed(company, startDate);
  const format = normalizePostFormat(options.format);
  const { selected, source } = selectWeeklyTemplates(
    nichePosts,
    genericPosts,
    company.toneId,
    slugBase,
    history.recentTemplateSlugs ?? [],
    seededRandom(`${seed}|templates`)
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

  const layoutPlan = pickCampaignLayouts(selected, company, history, seed);
  const packPhotos = pickPackPhotos(company.nicheId, company.categoryId, POSTS_PER_PACK);
  const allowEmojis = Boolean(tone?.emojis);
  const signoff = tone?.signoff?.trim() || "";

  const selectedPosts: GeneratedPost[] = [];

  for (let i = 0; i < POSTS_PER_PACK; i++) {
    const daySchedule = schedule[i];
    const template = selected[i] ?? reserveTemplate(i);

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
      layout: layoutPlan.layouts[i],
      layoutCategory: layoutPlan.categories[i],
      format,
      generationSeed: seed,
      imageUrl: packPhotos[i] || packPhotos[0],
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
    seed,
    format,
  };
}

import "server-only";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { findCategory, findNiche, findTone, type Tone } from "./catalog";
import { calculateWeekSchedule, formatWeekRange } from "./date-utils";
import type {
  CompanyProfile,
  ContentSource,
  GenerateResponse,
  GeneratedPost,
  PostTemplate,
} from "./types";

const TEMPLATES_DIR = path.join(process.cwd(), "content", "templates");
const POSTS_PER_WEEK = 7;
const LAYOUT_COUNT = 5;

function isValidTemplate(t: unknown): t is PostTemplate {
  if (!t || typeof t !== "object") return false;
  const p = t as Record<string, unknown>;
  return ["theme", "headline", "subheadline", "cta", "caption"].every(
    (key) => typeof p[key] === "string" && (p[key] as string).trim().length > 0,
  );
}

async function loadTemplates(relativeFile: string): Promise<PostTemplate[]> {
  try {
    const raw = JSON.parse(await readFile(path.join(TEMPLATES_DIR, relativeFile), "utf8"));
    return Array.isArray(raw?.posts) ? raw.posts.filter(isValidTemplate) : [];
  } catch {
    return [];
  }
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const matchesTone = (toneId: string) => (t: PostTemplate) =>
  !t.tones || t.tones.length === 0 || t.tones.includes(toneId);

function slugTag(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function stripEmojis(text: string) {
  return text
    .replace(/^[✔✅☑]\uFE0F?/gmu, "•") // mantém marcadores de lista legíveis
    .replace(/(\d)\uFE0F?\u20E3/gu, "$1.")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{20E3}]/gu, "")
    .replace(/^[ \t]+|[ \t]+$/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export async function generateWeek(
  profile: CompanyProfile,
  startDateInput?: string,
): Promise<GenerateResponse> {
  const category = findCategory(profile.categoryId)!;
  const niche = findNiche(profile.categoryId, profile.nicheId)!;
  const tone = findTone(profile.toneId) as Tone;

  const schedule = calculateWeekSchedule(startDateInput);

  const nichePool = (await loadTemplates(`${category.id}/${niche.id}.json`)).filter(
    matchesTone(tone.id),
  );
  const genericPool = (await loadTemplates("_generic.json")).filter(matchesTone(tone.id));

  // Prioriza textos do nicho; completa com os genéricos evitando temas repetidos.
  const picked: PostTemplate[] = [];
  const usedThemes = new Set<string>();
  for (const candidate of [...shuffle(nichePool), ...shuffle(genericPool)]) {
    if (picked.length === POSTS_PER_WEEK) break;
    const themeKey = candidate.theme.trim().toLowerCase();
    if (usedThemes.has(themeKey)) continue;
    usedThemes.add(themeKey);
    picked.push(candidate);
  }

  // Se ainda faltar algum para completar os 7 posts (ex: nicho muito enxuto):
  if (picked.length < POSTS_PER_WEEK) {
    for (const candidate of shuffle(genericPool)) {
      if (picked.length === POSTS_PER_WEEK) break;
      if (!picked.includes(candidate)) {
        picked.push(candidate);
      }
    }
  }

  const fromNiche = picked.filter((p) => nichePool.includes(p)).length;
  const source: ContentSource =
    fromNiche === picked.length ? "niche" : fromNiche === 0 ? "generic" : "mixed";

  const vars: Record<string, string> = {
    nome: profile.name,
    nicho: niche.label.toLowerCase(),
    tipo: category.label.toLowerCase(),
    cidade: profile.city,
    instagram: profile.instagram ? `@${profile.instagram}` : profile.name,
  };
  const fill = (text: string) =>
    text.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);

  const autoTags = [niche.label, profile.city, profile.name]
    .map(slugTag)
    .filter(Boolean)
    .map((t) => `#${t}`);

  const layouts = shuffle([...Array(LAYOUT_COUNT).keys()]);

  const posts: GeneratedPost[] = picked.map((template, index) => {
    let caption = `${fill(template.caption)}\n\n${tone.signoff}`;
    if (!tone.emojis) caption = stripEmojis(caption);

    const hashtags = [
      ...new Set(
        [...(template.hashtags ?? []).map(fill), ...autoTags].map((t) => `#${slugTag(t)}`),
      ),
    ].filter((t) => t.length > 1);

    const daySchedule = schedule[index];

    return {
      id: randomUUID(),
      day: daySchedule.fullDayLabel, // Ex: "Segunda, 26/10"
      date: daySchedule.isoDate, // Ex: "2026-10-26"
      dayOfWeek: daySchedule.dayOfWeek, // Ex: "Segunda"
      formattedDate: daySchedule.formattedDate, // Ex: "26/10"
      theme: template.theme,
      headline: fill(template.headline),
      subheadline: fill(template.subheadline),
      cta: fill(template.cta),
      caption,
      hashtags,
      layout: layouts[index % LAYOUT_COUNT],
    };
  });

  return {
    posts,
    source,
    nicheLabel: niche.label,
    startDate: schedule[0].isoDate,
    endDate: schedule[6].isoDate,
    weekRangeLabel: formatWeekRange(startDateInput),
  };
}

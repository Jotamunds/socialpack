import catalog from "../../content/catalog.json";
import type { CompanyProfile } from "./types";

export type Niche = { id: string; label: string };
export type Category = { id: string; label: string; niches: Niche[] };
export type Tone = {
  id: string;
  label: string;
  description: string;
  emojis: boolean;
  signoff: string;
};

export const categories: Category[] = catalog.categories;
export const tones: Tone[] = catalog.tones;

export function findCategory(categoryId: string) {
  return categories.find((c) => c.id === categoryId);
}

export function findNiche(categoryId: string, nicheId: string) {
  return findCategory(categoryId)?.niches.find((n) => n.id === nicheId);
}

export function findTone(toneId: string) {
  return tones.find((t) => t.id === toneId);
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Valida e normaliza um perfil vindo do cliente. Retorna `null` se inválido. */
export function parseProfile(input: unknown): CompanyProfile | null {
  if (!input || typeof input !== "object") return null;
  const p = input as Record<string, unknown>;
  const str = (v: unknown, max = 80) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

  const colors = (p.colors ?? {}) as Record<string, unknown>;
  const profile: CompanyProfile = {
    name: str(p.name, 60),
    categoryId: str(p.categoryId),
    nicheId: str(p.nicheId),
    city: str(p.city, 60),
    instagram: str(p.instagram, 40).replace(/^@+/, ""),
    toneId: str(p.toneId),
    colors: {
      primary: str(colors.primary, 7),
      secondary: str(colors.secondary, 7),
      accent: str(colors.accent, 7),
    },
  };

  const valid =
    profile.name.length > 0 &&
    profile.city.length > 0 &&
    !!findNiche(profile.categoryId, profile.nicheId) &&
    !!findTone(profile.toneId) &&
    Object.values(profile.colors).every((c) => HEX.test(c));

  return valid ? profile : null;
}

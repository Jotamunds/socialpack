export type BrandColors = {
  primary: string;
  secondary: string;
  accent: string;
};

export type CompanyProfile = {
  name: string;
  categoryId: string;
  nicheId: string;
  city: string;
  instagram: string;
  toneId: string;
  colors: BrandColors;
};

/** Formato de cada post dentro dos arquivos JSON em /content/templates. */
export type PostTemplate = {
  theme: string;
  tones?: string[];
  headline: string;
  subheadline: string;
  cta: string;
  caption: string;
  hashtags?: string[];
};

export type GeneratedPost = {
  id: string;
  day: string; // Ex: "Segunda, 26/10"
  date?: string; // Ex: "2026-10-26"
  dayOfWeek?: string; // Ex: "Segunda"
  formattedDate?: string; // Ex: "26/10"
  theme: string;
  headline: string;
  subheadline: string;
  cta: string;
  caption: string;
  hashtags: string[];
  /** Índice do template visual (0–4). */
  layout: number;
};

export type ContentSource = "niche" | "generic" | "mixed";

export type GenerateResponse = {
  posts: GeneratedPost[];
  source: ContentSource;
  nicheLabel: string;
  packId?: string;
  createdAt?: string;
  startDate?: string;
  endDate?: string;
  weekRangeLabel?: string;
};

export type SavedPack = {
  id: string;
  createdAt: string;
  userEmail: string;
  clientName: string;
  categoryId: string;
  nicheId: string;
  nicheLabel: string;
  city: string;
  instagram: string;
  toneId: string;
  brandColors: BrandColors;
  posts: GeneratedPost[];
  source: ContentSource;
  startDate?: string;
  endDate?: string;
};


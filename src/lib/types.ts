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
  day: string;
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
};

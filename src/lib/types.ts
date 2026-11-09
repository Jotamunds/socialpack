import type { PostFormat } from "./post-format";

export type BrandColors = {
  primary: string;
  secondary: string;
  accent: string;
};

export type CompanyProfile = {
  id?: string;
  name: string;
  categoryId: string;
  nicheId: string;
  city: string;
  state?: string;
  instagram: string;
  toneId: string;
  colors: BrandColors;
  /** URL pública ou Data URL do logotipo. Ausente em empresas cadastradas antes da migração. */
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
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
  /** Índice do template visual (L0–L30; os layouts antigos L0–L6 permanecem válidos). */
  layout: number;
  /** Formato final do PNG. Registros legados assumem square. */
  format?: PostFormat;
  /** Categoria usada pelo seletor de composição para auditoria e reprodução. */
  layoutCategory?: string;
  /** Seed persistida no generation_config para reproduzir uma escolha visual. */
  generationSeed?: string;
  badgeText?: string;
  templateSlug?: string;
  templateVersion?: number;
  /** Customizações do usuário */
  imageUrl?: string;
  customHeadline?: string;
  customSubheadline?: string;
  customCta?: string;
  customCaption?: string;
  customHandle?: string;
  isCustomized?: boolean;
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
  seed?: string;
  format?: PostFormat;
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

export type TemplateModel = {
  id: string;
  name?: string;
  categoryId: string;
  nicheId?: string;
  theme: string;
  headline: string;
  subheadline: string;
  cta: string;
  caption: string;
  hashtags?: string[];
  tones?: string[];
  layout: number;
  imageUrl?: string;
  createdAt?: string;
  description?: string;
};

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "none"
  | "free"
  | "incomplete";

export type PlanId = "starter" | "pro" | "none" | "free";

export type UserSubscription = {
  userEmail: string;
  status: SubscriptionStatus;
  planId: PlanId;
  generationQuota: number;
  usedGenerations: number;
  packsCreatedCount?: number;
  currentPeriodEnd: string;
  updatedAt: string;
};

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  quota: number;
  features: string[];
  isPopular?: boolean;
};

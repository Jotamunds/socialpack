import { z } from "zod";
import { categories } from "@/lib/catalog";

export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
export const UF_REGEX = /^[A-Z]{2}$/;

export const HexColorSchema = z
  .string()
  .regex(HEX_COLOR_REGEX, "Cor deve estar no formato hexadecimal #RRGGBB (ex: #5E6AD2)");

export const UfSchema = z
  .string()
  .toUpperCase()
  .regex(UF_REGEX, "UF deve conter exatamente 2 letras maiúsculas (ex: SP)");

export const BrandColorsSchema = z.object({
  primary: HexColorSchema,
  secondary: HexColorSchema,
  accent: HexColorSchema,
});

export const CreateCompanyInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nome da empresa deve ter pelo menos 2 caracteres")
      .max(120, "Máximo de 120 caracteres"),
    categoryId: z.string().trim().min(1).max(80).optional(),
    segment: z.string().trim().min(1).max(80).optional(),
    nicheId: z.string().trim().min(1).max(80).optional(),
    niche: z.string().trim().min(1).max(80).optional(),
    city: z.string().trim().min(1, "Cidade é obrigatória").max(100, "Máximo de 100 caracteres"),
    state: UfSchema,
    instagram: z
      .string()
      .trim()
      .transform((val) => (val ? val.replace(/^@+/, "") : ""))
      .pipe(
        z
          .string()
          .regex(/^[A-Za-z0-9._]{0,30}$/, "Instagram deve conter apenas letras, números, pontos e sublinhados")
      )
      .optional(),
    instagram_handle: z
      .string()
      .trim()
      .transform((val) => (val ? val.replace(/^@+/, "") : ""))
      .pipe(
        z
          .string()
          .regex(/^[A-Za-z0-9._]{0,30}$/, "Instagram deve conter apenas letras, números, pontos e sublinhados")
      )
      .optional(),
    toneId: z.string().optional(),
    primary_style: z
      .enum(["descontraido", "profissional", "elegante", "colorido", "acolhedor", "inspirador", "sofisticado", "divertido"])
      .optional(),
    colors: BrandColorsSchema.optional(),
    brand_colors: z
      .union([
        z.array(HexColorSchema).min(1, "Selecione ao menos 1 cor").max(6, "Máximo de 6 cores"),
        BrandColorsSchema,
      ])
      .optional(),
  })
  .refine((data) => Boolean(data.categoryId || data.segment), {
    message: "Categoria ou segmento é obrigatório",
    path: ["categoryId"],
  })
  .refine((data) => Boolean(data.nicheId || data.niche), {
    message: "Nicho é obrigatório",
    path: ["nicheId"],
  });

export type CreateCompanyInput = z.infer<typeof CreateCompanyInputSchema>;

export function normalizeCompanyInput(input: CreateCompanyInput) {
  const categoryId = input.categoryId || input.segment || "geral";
  const nicheId = input.nicheId || input.niche || "generico";
  const rawIg = input.instagram_handle || input.instagram || "";
  const instagram = rawIg.replace(/^@+/, "");
  const toneId = input.toneId || input.primary_style || "profissional";

  let colors: { primary: string; secondary: string; accent: string };
  if (Array.isArray(input.brand_colors)) {
    const c = input.brand_colors;
    colors = {
      primary: c[0] || "#5e6ad2",
      secondary: c[1] || c[0] || "#7170ff",
      accent: c[2] || c[1] || c[0] || "#828fff",
    };
  } else if (input.brand_colors && typeof input.brand_colors === "object" && "primary" in input.brand_colors) {
    colors = input.brand_colors as { primary: string; secondary: string; accent: string };
  } else if (input.colors) {
    colors = input.colors;
  } else {
    colors = { primary: "#5e6ad2", secondary: "#7170ff", accent: "#828fff" };
  }

  return {
    name: input.name,
    categoryId,
    nicheId,
    city: input.city,
    state: input.state.toUpperCase(),
    instagram,
    toneId,
    colors,
  };
}

export const TemplateLayoutStructureSchema = z
  .object({
    layout: z.number().int().min(0).max(6),
    theme: z.string().min(1),
    headline: z.string().min(1),
    subheadline: z.string().default(""),
    cta: z.string().min(1),
    caption: z.string().default(""),
    hashtags: z.array(z.string()).default([]),
    tones: z.array(z.string()).optional(),
    imageUrl: z.string().url().optional(),
    slots: z
      .object({
        badge: z.string().optional(),
        headline: z.string().optional(),
        subheadline: z.string().optional(),
        cta: z.string().optional(),
        handle: z.string().optional(),
      })
      .optional(),
    typography: z
      .object({
        fontFamily: z.string().optional(),
        headlineWeight: z.number().optional(),
        bodyWeight: z.number().optional(),
      })
      .optional(),
    colors: z.record(z.string()).optional(),
    fallbackCopy: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type TemplateLayoutStructure = z.infer<typeof TemplateLayoutStructureSchema>;

export const SignUpInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Nome completo deve ter pelo menos 3 caracteres")
    .max(80, "Nome muito longo"),
  phone: z
    .string()
    .trim()
    .min(10, "Telefone deve conter DDD + número (mínimo 10 dígitos)")
    .max(20, "Telefone inválido")
    .regex(/^[\d\s()+-]+$/, "Formato de telefone inválido"),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .toLowerCase(),
  password: z
    .string()
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
  plan: z.enum(["starter", "pro"]).default("starter"),
});

export type SignUpInput = z.infer<typeof SignUpInputSchema>;

export const SignInInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Digite sua senha"),
});

export type SignInInput = z.infer<typeof SignInInputSchema>;

export const UpdateProfileInputSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres")
      .optional(),
    full_name: z
      .string()
      .trim()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres")
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(/^(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4})?$/, "Telefone com formato inválido (ex: (11) 99999-9999)")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => Boolean((data.fullName && data.fullName.length >= 2) || (data.full_name && data.full_name.length >= 2)), {
    message: "Nome completo é obrigatório (mínimo 2 caracteres)",
    path: ["fullName"],
  });

export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

export const ChangePasswordInputSchema = z
  .object({
    password: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme a nova senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;

export const ThemePreferenceSchema = z.enum(["dark", "light"]);

export const GenerateWeeklyBodySchema = z.object({
  companyId: z.string().uuid("companyId deve ser um UUID válido"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate deve estar no formato YYYY-MM-DD")
    .optional(),
});

export type GenerateWeeklyBody = z.infer<typeof GenerateWeeklyBodySchema>;

export const WeeklyPackPostSchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  badgeText: z.string().min(2).max(24),
  headline: z.string().min(10).max(68),
  subheadline: z.string().min(15).max(120),
  ctaText: z.string().min(4).max(28),
  captionCopy: z.string().min(40).max(1200),
  hashtags: z.array(z.string().min(2)).min(3).max(8),
  theme: z.string().min(1),
  layout: z.number().int().min(0).max(6),
  templateSlug: z.string().min(1),
  templateVersion: z.number().int().positive(),
});

export const WeeklyPackContentSchema = z
  .object({
    posts: z.array(WeeklyPackPostSchema).length(7),
  })
  .refine(
    (data) => {
      const days = data.posts.map((p) => p.dayIndex);
      return new Set(days).size === 7;
    },
    { message: "O pacote deve conter exatamente os 7 dias (0–6) sem duplicatas." }
  )
  .refine(
    (data) => {
      const themes = data.posts.map((p) => p.theme);
      return new Set(themes).size === themes.length;
    },
    { message: "Temas do pacote semanal não podem se repetir." }
  );

export type WeeklyPackContent = z.infer<typeof WeeklyPackContentSchema>;

/** Alias documental da saída do motor determinístico (sem IA em runtime). */
export const AiWeeklyPackOutputSchema = WeeklyPackContentSchema;

export const PostGenerationConfigSchema = z.object({
  templateSlug: z.string().min(1),
  templateVersion: z.number().int().positive(),
  resolvedColors: BrandColorsSchema,
  renderedSlots: z.object({
    badge: z.string().optional(),
    headline: z.string().min(1),
    subheadline: z.string(),
    cta: z.string().min(1),
    handle: z.string().optional(),
  }),
  theme: z.string().optional(),
  layout: z.number().int().min(0).max(6).optional(),
  imageUrl: z.string().optional(),
});

export type PostGenerationConfig = z.infer<typeof PostGenerationConfigSchema>;

/** Limite MVP: no máximo 4 pacotes (28 posts) por empresa por dia UTC. */
export const MAX_WEEKLY_PACKS_PER_COMPANY_PER_DAY = 4;
export const POSTS_PER_WEEKLY_PACK = 7;

const CATALOG_NICHE_IDS = new Set(
  categories.flatMap((category) => category.niches.map((niche) => niche.id))
);

/** Presets de período do histórico. Ausente na URL = todo o período. */
export const HISTORY_PERIOD_VALUES = ["7d", "30d"] as const;

export const HistoryCompanyIdSchema = z.string().trim().uuid("empresa deve ser um UUID");

export const HistorySearchSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 80))
  .pipe(z.string().min(1).max(80));

export const HistoryPeriodSchema = z.enum(HISTORY_PERIOD_VALUES);

export const HistoryNicheIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((id) => CATALOG_NICHE_IDS.has(id), "Nicho desconhecido");

/**
 * Filtros normalizados do histórico.
 * Valores ausentes significam "sem restrição", exceto o status, que não entra
 * aqui: a consulta do acervo fixa `completed`.
 */
export const HistoryPostsFilterSchema = z.object({
  empresa: HistoryCompanyIdSchema.optional(),
  busca: HistorySearchSchema.optional(),
  periodo: HistoryPeriodSchema.optional(),
  nicho: HistoryNicheIdSchema.optional(),
});

export type HistoryPeriod = z.infer<typeof HistoryPeriodSchema>;
export type HistoryPostsFilter = z.infer<typeof HistoryPostsFilterSchema>;

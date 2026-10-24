import { z } from "zod";

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

export const CreateCompanyInputSchema = z.object({
  name: z.string().trim().min(1, "Nome da empresa é obrigatório").max(60, "Máximo de 60 caracteres"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  nicheId: z.string().min(1, "Nicho é obrigatório"),
  city: z.string().trim().min(1, "Cidade é obrigatória").max(60, "Máximo de 60 caracteres"),
  state: UfSchema,
  instagram: z
    .string()
    .trim()
    .max(40, "Máximo de 40 caracteres")
    .transform((val) => val.replace(/^@+/, "")),
  toneId: z.string().min(1, "Tom de voz é obrigatório"),
  colors: BrandColorsSchema,
});

export type CreateCompanyInput = z.infer<typeof CreateCompanyInputSchema>;

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

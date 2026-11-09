/** Formatos nativos aceitos pelo motor de composição e pelo exportador PNG. */
export const POST_FORMATS = ["square", "portrait", "story"] as const;

export type PostFormat = (typeof POST_FORMATS)[number];

export type PostDimensions = {
  width: number;
  height: number;
  label: string;
};

export const POST_FORMAT_DIMENSIONS: Record<PostFormat, PostDimensions> = {
  square: { width: 1080, height: 1080, label: "Quadrado · 1080 × 1080" },
  portrait: { width: 1080, height: 1350, label: "Feed vertical · 1080 × 1350" },
  story: { width: 1080, height: 1920, label: "Stories · 1080 × 1920" },
};

export function isPostFormat(value: unknown): value is PostFormat {
  return typeof value === "string" && POST_FORMATS.includes(value as PostFormat);
}

/** Mantém registros antigos (que não tinham formato) visualmente idênticos. */
export function normalizePostFormat(value: unknown): PostFormat {
  return isPostFormat(value) ? value : "square";
}

export function getPostDimensions(format?: PostFormat): PostDimensions {
  return POST_FORMAT_DIMENSIONS[normalizePostFormat(format)];
}

export type PostsViewMode = "gallery" | "list";

export const POSTS_VIEW_STORAGE_KEY = "socialpack_posts_view";

/** Modelo unificado para cards de geração e histórico. */
export interface DisplayPost {
  id: string;
  day: string;
  date?: string | null;
  theme: string;
  headline: string;
  subheadline?: string | null;
  cta: string;
  caption: string;
  hashtags?: string[];
  layout?: number;
  /** URL de exibição (signedUrl preferencial). */
  imageSrc?: string | null;
  companyName?: string;
  createdAt?: string | null;
}

export function parsePostsViewMode(raw: string | null | undefined): PostsViewMode {
  return raw === "list" ? "list" : "gallery";
}

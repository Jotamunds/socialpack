/** Catálogo puro (sem React) compartilhado pelo seletor e pelo renderer. */
export const FIRST_CAMPAIGN_LAYOUT = 7;
export const LAST_CAMPAIGN_LAYOUT = 30;

export type CampaignCategory =
  | "promotion"
  | "launch"
  | "bundle"
  | "testimonial"
  | "institutional"
  | "education"
  | "catalog"
  | "seasonal";

export type CampaignLayoutDefinition = {
  id: number;
  category: CampaignCategory;
  name: string;
  style: string;
};

export const CAMPAIGN_LAYOUTS: CampaignLayoutDefinition[] = [
  { id: 7, category: "promotion", name: "Promoção Ticket", style: "promocional" },
  { id: 8, category: "promotion", name: "Oferta Price Burst", style: "vibrante" },
  { id: 9, category: "promotion", name: "Cupom em Camadas", style: "comercial moderno" },
  { id: 10, category: "launch", name: "Lançamento Halo", style: "premium" },
  { id: 11, category: "launch", name: "Novidade Editorial", style: "editorial minimalista" },
  { id: 12, category: "launch", name: "Produto em Órbita", style: "geométrico" },
  { id: 13, category: "bundle", name: "Combo Trio", style: "comercial moderno" },
  { id: 14, category: "bundle", name: "Combo Lateral", style: "vibrante" },
  { id: 15, category: "bundle", name: "Combo Recibo", style: "elegante" },
  { id: 16, category: "testimonial", name: "Depoimento Imersivo", style: "premium" },
  { id: 17, category: "testimonial", name: "Avaliação em Janela", style: "moderno" },
  { id: 18, category: "testimonial", name: "Carta de Cliente", style: "editorial" },
  { id: 19, category: "institutional", name: "Manifesto da Marca", style: "institucional" },
  { id: 20, category: "institutional", name: "Pessoas & Propósito", style: "premium" },
  { id: 21, category: "institutional", name: "Jornada em Linha", style: "geométrico" },
  { id: 22, category: "education", name: "Dica Numerada", style: "educativo" },
  { id: 23, category: "education", name: "Mito ou Verdade", style: "contraste alto" },
  { id: 24, category: "education", name: "Checklist Prático", style: "minimalista" },
  { id: 25, category: "catalog", name: "Catálogo em Grade", style: "comercial" },
  { id: 26, category: "catalog", name: "Vitrine de Produto", style: "premium" },
  { id: 27, category: "catalog", name: "Índice de Coleção", style: "editorial" },
  { id: 28, category: "seasonal", name: "Calendário Sazonal", style: "vibrante" },
  { id: 29, category: "seasonal", name: "Tag de Presente", style: "elegante" },
  { id: 30, category: "seasonal", name: "Celebração Circular", style: "promocional" },
];

export const CAMPAIGN_LAYOUT_NAMES = CAMPAIGN_LAYOUTS.map((layout) => layout.name);

export function isCampaignLayout(layout: number): boolean {
  return Number.isInteger(layout) && layout >= FIRST_CAMPAIGN_LAYOUT && layout <= LAST_CAMPAIGN_LAYOUT;
}

/**
 * Identidade visual de um id. L0–L6 são um desenho cada; L7–L30 colapsam nos
 * 5 modos de campanha; qualquer id >= 31 é um desenho próprio, sem mudar o seletor.
 */
export function layoutDesignKey(layoutId: number): string {
  if (Number.isInteger(layoutId) && layoutId >= 0 && layoutId < FIRST_CAMPAIGN_LAYOUT) {
    return `legacy:${layoutId}`;
  }
  if (Number.isInteger(layoutId) && layoutId >= FIRST_CAMPAIGN_LAYOUT && layoutId <= LAST_CAMPAIGN_LAYOUT) {
    return `campaign:${(layoutId - FIRST_CAMPAIGN_LAYOUT) % 5}`;
  }
  return `layout:${layoutId}`;
}

export function campaignLayoutForId(layout: number) {
  return CAMPAIGN_LAYOUTS.find((item) => item.id === layout);
}

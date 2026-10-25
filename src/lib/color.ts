// Utilitários de cor usados pelos templates visuais dos cards.

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const int = parseInt(value.length === 3 ? value.replace(/./g, "$&$&") : value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function toHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const INK = "#0d0d14";

/** Cor de texto com melhor contraste (escuro ou branco) sobre o fundo informado. */
export function readableOn(background: string) {
  return luminance(background) > 0.42 ? INK : "#ffffff";
}

/** Contraste WCAG entre duas cores hex (`#RGB` ou `#RRGGBB`). */
export function contrastRatio(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Mantém a cor de marca quando ela já contrasta com o fundo.
 * Se não contrasta, mistura com o preto ou o branco de `readableOn`
 * até atingir `min` (padrão 3:1, texto grande).
 */
export function readableBrand(brand: string, background: string, min = 3) {
  if (contrastRatio(brand, background) >= min) return brand;
  const toward = readableOn(background);
  for (let step = 1; step <= 10; step++) {
    const next = mix(brand, toward, step / 10);
    if (contrastRatio(next, background) >= min) return next;
  }
  return toward;
}

export function alpha(hex: string, opacity: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Mistura duas cores (t = 0 → a, t = 1 → b). */
export function mix(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return toHex([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * t) as [number, number, number]);
}

export const darken = (hex: string, amount: number) => mix(hex, "#000000", amount);
export const lighten = (hex: string, amount: number) => mix(hex, "#ffffff", amount);

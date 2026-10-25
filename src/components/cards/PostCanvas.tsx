/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode, Ref } from "react";
import { alpha, contrastRatio, mix, readableBrand, readableOn } from "@/lib/color";
import { getCuratedPhoto } from "@/lib/curated-images";
import type { CompanyProfile, GeneratedPost } from "@/lib/types";

/**
 * Sete layouts 1080×1080 portados dos frames do Figma
 * (arquivo BIPHNOCOX0wUywJgXFeb6l, L0–L6).
 *
 * A paleta da empresa entra por papel, nunca por hex copiado do frame:
 *   primary / secondary / accent, com `readableOn` no texto que senta
 *   em cima de uma cor de marca e `readableBrand` quando a própria cor
 *   de marca é o texto e precisa continuar legível.
 *
 * Cores fixas de identidade (não vêm da paleta) — detalhe em docs/layouts.md:
 * - L0 papel `#f6f1e9` e tinta `#14141f`, mais os cinzas `#4a4a5a` e `#6b6b7b`.
 *   É a página de revista: o papel não pode virar a cor da marca.
 * - L1 polaroid branca, fita branca a 70% e sombra. O objeto físico é branco.
 * - L2 e L5 usam a tinta `#14141f` no véu sobre a foto. Sem escurecer, o
 *   texto branco deixa de ler em foto clara. O Satori não tem `backdrop-filter`.
 * - L3 preto `#000` das barras de cinema e `#ff4d4d` do REC (luz de gravação).
 * - L4 e L1 usam a tinta `#14141f` no botão-carimbo. Se a tinta sumir no
 *   painel, entra um fio da cor legível só para separar o botão.
 * - L6 amarelo `#f2ef4a` (fundo, fallback do CTA e marquee) e tinta `#14141f`.
 *   O código antigo usava `#ffe600`. Ficou o amarelo do Figma: é o cartaz
 *   desenhado, um pouco mais quente e menos neon, e é a cor que o frame
 *   aplica no fundo, no CTA e na faixa.
 *
 * L4 e L5 não têm lista no gerador. Os 3 passos / os 3 itens saem da
 * subheadline (frases, senão vírgulas, senão terços de palavras).
 */

export const CANVAS_SIZE = 1080;

export const LAYOUT_NAMES = [
  "Editorial Revista",
  "Polaroid Mural",
  "Frase & Foto",
  "Cinema Legenda",
  "Split Passo a passo",
  "Glass Valores",
  "Brutalista Manchete",
];

type CardProfile = Pick<CompanyProfile, "name" | "instagram" | "colors"> & {
  categoryId?: string;
  nicheId?: string;
};

type TemplateProps = {
  post: GeneratedPost;
  profile: CardProfile;
  index: number;
};

const DISPLAY = "Bricolage Grotesque";
const SERIF = "Playfair Display";
const SANS = "Plus Jakarta Sans";

const PAPER = "#f6f1e9";
const TINTA = "#14141f";
const YELLOW = "#f2ef4a";
const REC = "#ff4d4d";
const BODY = "#4a4a5a";
const MUTED = "#6b6b7b";
const MIST = "#e6e6f0";
const FOG = "#c8c8d8";
const CAPTION = "#d0d0dc";
const ITEM = "#f0f0f8";

const row: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "nowrap",
  alignItems: "center",
};

const col: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flexWrap: "nowrap",
};

function handleOf(profile: CardProfile) {
  if (!profile.instagram) return profile.name;
  return `@${profile.instagram.replace(/^@+/, "")}`;
}

function clean(value: string | undefined, fallback: string) {
  const text = (value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function editionOf(index: number) {
  return String((Math.abs(index) % 7) + 1).padStart(2, "0");
}

/** Foto curada por nicho quando o post ainda não tem imageUrl. */
export function getFallbackPhoto(nicheId?: string, categoryId?: string, index = 0) {
  return getCuratedPhoto(nicheId, categoryId, index);
}

function contentOf(post: GeneratedPost, profile: CardProfile, index: number) {
  return {
    headline: clean(post.customHeadline || post.headline, "—"),
    subheadline: clean(post.customSubheadline || post.subheadline, "—"),
    cta: clean(post.customCta || post.cta, "Saiba mais"),
    handle: clean(post.customHandle, handleOf(profile)),
    badge: clean(post.badgeText || post.theme, "Destaque").slice(0, 24),
    photo: post.imageUrl || getFallbackPhoto(profile.nicheId, profile.categoryId, index),
    edition: editionOf(index),
  };
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Três itens a partir da subheadline, porque o post não tem lista própria. */
function splitParts(text: string, count = 3) {
  const source = text.replace(/\s+/g, " ").trim();
  const tidy = (part: string) => capitalize(part.replace(/[.!?;:,]+$/g, "").trim());
  const sentences = source
    .split(/(?<=[.!?;])\s+/)
    .map(tidy)
    .filter(Boolean);
  if (sentences.length >= count) return sentences.slice(0, count);
  const clauses = source
    .split(/\s*,\s*/)
    .map(tidy)
    .filter(Boolean);
  if (clauses.length >= count) return clauses.slice(0, count);
  const words = source.split(" ").filter(Boolean);
  const size = Math.max(1, Math.ceil(words.length / count));
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(tidy(words.slice(i * size, (i + 1) * size).join(" ")) || source);
  }
  return parts;
}

function splitHeadline(text: string): [string, string] {
  const words = text.split(" ").filter(Boolean);
  if (words.length === 0) return ["—", "—"];
  if (words.length === 1) {
    const mid = Math.ceil(words[0].length / 2);
    return [words[0].slice(0, mid), words[0].slice(mid) || words[0]];
  }
  let bestAt = 1;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const score = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (score < best) {
      best = score;
      bestAt = i;
    }
  }
  return [words.slice(0, bestAt).join(" "), words.slice(bestAt).join(" ")];
}

function estimateLines(text: string, maxWidth: number, size: number, ratio: number) {
  const charW = Math.max(1, size * ratio);
  const space = charW * 0.4;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  let lines = 1;
  let used = 0;
  for (const word of words) {
    const width = word.length * charW;
    if (width > maxWidth) {
      if (used > 0) lines += 1;
      const perLine = Math.max(1, Math.floor(maxWidth / charW));
      const wordLines = Math.ceil(word.length / perLine);
      lines += wordLines - 1;
      const rest = word.length % perLine;
      used = (rest === 0 ? perLine : rest) * charW;
      continue;
    }
    if (used === 0) {
      used = width;
      continue;
    }
    if (used + space + width > maxWidth) {
      lines += 1;
      used = width;
    } else {
      used += space + width;
    }
  }
  return lines;
}

function fitBlock(
  text: string,
  opts: {
    maxWidth: number;
    maxHeight: number;
    maxSize: number;
    minSize: number;
    lineHeight: number;
    ratio: number;
  },
) {
  let size = opts.maxSize;
  while (size > opts.minSize) {
    const lines = estimateLines(text, opts.maxWidth, size, opts.ratio);
    if (lines * size * opts.lineHeight <= opts.maxHeight) return size;
    size -= 2;
  }
  return opts.minSize;
}

function fitLine(text: string, maxWidth: number, maxSize: number, minSize: number, ratio: number) {
  let size = maxSize;
  const longest = Math.max(...text.split(/\s+/).map((word) => word.length), 1);
  while (size > minSize && longest * size * ratio > maxWidth) size -= 1;
  while (size > minSize && text.length * size * ratio > maxWidth) size -= 1;
  return size;
}

function fitTracking(text: string, maxWidth: number, size: number, tracking: number, ratio: number) {
  const widthAt = (nextSize: number, nextTracking: number) =>
    text.length * nextSize * ratio + Math.max(0, text.length - 1) * nextTracking;
  let nextTracking = tracking;
  let nextSize = size;
  while (widthAt(nextSize, nextTracking) > maxWidth && nextTracking > 0) nextTracking -= 0.5;
  while (widthAt(nextSize, nextTracking) > maxWidth && nextSize > 14) nextSize -= 1;
  return { size: nextSize, tracking: Math.max(0, nextTracking) };
}

function Canvas({ style, children }: { style?: CSSProperties; children: ReactNode }) {
  return (
    <div
      lang="pt-BR"
      style={{
        ...col,
        position: "relative",
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        overflow: "hidden",
        fontFamily: SANS,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const abs = (style: CSSProperties): CSSProperties => ({
  position: "absolute",
  ...col,
  ...style,
});

function Photo({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <div style={{ ...row, width, height, overflow: "hidden", flexShrink: 0 }}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        crossOrigin="anonymous"
        style={{ width, height, objectFit: "cover" }}
      />
    </div>
  );
}

function Check({ color }: { color: string }) {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" style={{ width: 28, height: 28, flexShrink: 0 }}>
      <path d="M9.2 16.6 4.6 12l-1.4 1.4 6 6L21 7.6 19.6 6.2Z" fill={color} />
    </svg>
  );
}

function Star({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        color,
      }}
    >
      ★
    </div>
  );
}

/* =========================================================================
   0 — Editorial "Revista"
   ========================================================================= */
function EditorialTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const { headline, subheadline, cta, handle, badge, photo, edition } = contentOf(post, profile, index);
  const kicker = `EDIÇÃO DA SEMANA  ·  ${badge.toUpperCase()}`;
  const kickerFit = fitTracking(kicker, 900, 22, 4, 0.64);
  const headlineSize = fitBlock(headline, {
    maxWidth: 460,
    maxHeight: 420,
    maxSize: 84,
    minSize: 36,
    lineHeight: 1.05,
    ratio: 0.5,
  });
  const subSize = fitBlock(subheadline, {
    maxWidth: 450,
    maxHeight: 220,
    maxSize: 30,
    minSize: 22,
    lineHeight: 1.4,
    ratio: 0.5,
  });
  const ctaLabel = `${cta}  →`;
  const ctaSize = fitLine(ctaLabel, 880, 30, 20, 0.56);
  const kickerColor = readableBrand(primary, PAPER, 3);
  const ctaColor = readableBrand(primary, PAPER, 3);
  const rule = readableBrand(secondary, PAPER, 2.2);

  return (
    <Canvas style={{ backgroundColor: PAPER, color: TINTA }}>
      <div
        style={abs({
          top: 78,
          left: 80,
          width: 900,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: kickerFit.size,
          letterSpacing: kickerFit.tracking,
          textTransform: "uppercase",
          color: kickerColor,
          whiteSpace: "pre",
        })}
      >
        {kicker}
      </div>
      <div style={abs({ top: 128, left: 80, width: 920, height: 2, backgroundColor: rule })} />
      <div
        style={abs({
          top: 176,
          left: 80,
          width: 460,
          maxHeight: 430,
          overflow: "hidden",
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: headlineSize,
          lineHeight: 1.05,
          color: TINTA,
          wordBreak: "break-word",
        })}
      >
        {headline}
      </div>
      <div
        style={abs({
          top: 628,
          left: 80,
          width: 450,
          maxHeight: 230,
          overflow: "hidden",
          fontFamily: SANS,
          fontWeight: 400,
          fontSize: subSize,
          lineHeight: 1.4,
          color: BODY,
          wordBreak: "break-word",
        })}
      >
        {subheadline}
      </div>
      <div style={abs({ top: 176, left: 550, width: 450, height: 680 })}>
        <Photo src={photo} alt={headline} width={450} height={674} />
        <div style={{ width: 450, height: 6, backgroundColor: accent }} />
      </div>
      <div
        style={abs({
          top: 888,
          left: 80,
          width: 900,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: ctaSize,
          color: ctaColor,
          textDecoration: "underline",
          whiteSpace: "nowrap",
        })}
      >
        {ctaLabel}
      </div>
      <div
        style={abs({
          top: 984,
          left: 80,
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 24,
          color: MUTED,
          whiteSpace: "nowrap",
        })}
      >
        {handle}
      </div>
      <div
        style={abs({
          top: 980,
          right: 80,
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 28,
          color: TINTA,
          whiteSpace: "nowrap",
        })}
      >
        {`Nº ${edition}`}
      </div>
    </Canvas>
  );
}

/* =========================================================================
   1 — Polaroid "Mural"
   ========================================================================= */
function PolaroidTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const { headline, subheadline, cta, handle, badge, photo } = contentOf(post, profile, index);
  const onAccent = readableOn(accent);
  const bubble =
    contrastRatio(secondary, accent) >= 1.35 ? secondary : mix(secondary, onAccent, 0.45);
  const kicker = badge.toUpperCase();
  const kickerFit = fitTracking(kicker, 540, 20, 3, 0.64);
  const headlineSize = fitBlock(headline, {
    maxWidth: 540,
    maxHeight: 120,
    maxSize: 46,
    minSize: 26,
    lineHeight: 1.12,
    ratio: 0.56,
  });
  const headlineLines = estimateLines(headline, 540, headlineSize, 0.56);
  const headlineH = headlineLines * headlineSize * 1.12;
  const photoH = Math.min(500, Math.max(360, Math.round(640 - headlineH)));
  const ctaSize = 28;
  const ctaWidth = cta.length * ctaSize * 0.56 + 64;
  const sideBySide = ctaWidth + 520 < 900;
  const subWidth = sideBySide ? 520 : 900;
  const subSize = fitBlock(subheadline, {
    maxWidth: subWidth,
    maxHeight: sideBySide ? 110 : 72,
    maxSize: sideBySide ? 32 : 28,
    minSize: 20,
    lineHeight: 1.25,
    ratio: 0.54,
  });
  const pillSize = fitLine(cta, sideBySide ? 280 : 560, 28, 18, 0.56);
  const kickerColor = readableBrand(primary, "#ffffff", 3);
  const pillRing = contrastRatio(TINTA, accent) < 2 ? onAccent : "transparent";

  return (
    <Canvas style={{ backgroundColor: accent }}>
      <div
        style={abs({
          left: 600,
          top: -200,
          width: 700,
          height: 700,
          borderRadius: 350,
          backgroundColor: bubble,
        })}
      />
      <div
        style={abs({
          left: 205,
          top: 96,
          width: 620,
          height: 700,
          backgroundColor: "#ffffff",
          padding: 30,
          transform: "rotate(4deg)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
        })}
      >
        <Photo src={photo} alt={headline} width={560} height={photoH} />
        <div
          style={{
            ...col,
            width: 560,
            marginTop: 18,
            maxHeight: 130,
            overflow: "hidden",
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: headlineSize,
            lineHeight: 1.12,
            color: TINTA,
            wordBreak: "break-word",
          }}
        >
          {headline}
        </div>
        <div
          style={{
            ...row,
            marginTop: 12,
            width: 560,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: kickerFit.size,
            letterSpacing: kickerFit.tracking,
            textTransform: "uppercase",
            color: kickerColor,
            whiteSpace: "nowrap",
          }}
        >
          {kicker}
        </div>
      </div>
      <div
        style={abs({
          left: 466,
          top: 62,
          width: 150,
          height: 40,
          backgroundColor: "rgba(255,255,255,0.7)",
          transform: "rotate(-3deg)",
        })}
      />
      {sideBySide ? (
        <div style={abs({ left: 100, top: 852, width: 880, ...row, justifyContent: "space-between", alignItems: "flex-start" })}>
          <div
            style={{
              ...col,
              width: 520,
              maxHeight: 120,
              overflow: "hidden",
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: subSize,
              lineHeight: 1.25,
              color: onAccent,
              wordBreak: "break-word",
            }}
          >
            {subheadline}
          </div>
          <div
            style={{
              ...row,
              alignSelf: "flex-start",
              flexShrink: 0,
              backgroundColor: TINTA,
              borderRadius: 999,
              paddingTop: 16,
              paddingBottom: 16,
              paddingLeft: 28,
              paddingRight: 28,
              border: `3px solid ${pillRing}`,
            }}
          >
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: pillSize, color: "#ffffff", whiteSpace: "nowrap" }}>
              {cta}
            </div>
          </div>
        </div>
      ) : (
        <div style={abs({ left: 100, top: 856, width: 880 })}>
          <div
            style={{
              ...col,
              width: 880,
              maxHeight: 72,
              overflow: "hidden",
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: subSize,
              lineHeight: 1.25,
              color: onAccent,
              wordBreak: "break-word",
            }}
          >
            {subheadline}
          </div>
          <div
            style={{
              ...row,
              alignSelf: "flex-end",
              marginTop: 14,
              backgroundColor: TINTA,
              borderRadius: 999,
              paddingTop: 14,
              paddingBottom: 14,
              paddingLeft: 26,
              paddingRight: 26,
              border: `3px solid ${pillRing}`,
            }}
          >
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: pillSize, color: "#ffffff", whiteSpace: "nowrap" }}>
              {cta}
            </div>
          </div>
        </div>
      )}
      <div
        style={abs({
          left: 100,
          top: 1004,
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 24,
          color: onAccent,
          whiteSpace: "nowrap",
        })}
      >
        {handle}
      </div>
    </Canvas>
  );
}

/* =========================================================================
   2 — Frase & Foto "Citação"
   ========================================================================= */
function QuoteTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const { headline, subheadline, cta, handle, badge, photo } = contentOf(post, profile, index);
  const badgeLabel = badge.toUpperCase();
  const badgeFit = fitTracking(badgeLabel, 640, 20, 2, 0.64);
  const onBadge = readableOn(primary);
  const quote = readableBrand(accent, TINTA, 3);
  const rule = readableBrand(secondary, TINTA, 2.4);
  const headlineSize = fitBlock(headline, {
    maxWidth: 880,
    maxHeight: 230,
    maxSize: 88,
    minSize: 40,
    lineHeight: 1.05,
    ratio: 0.5,
  });
  const subSize = fitBlock(subheadline, {
    maxWidth: 880,
    maxHeight: 120,
    maxSize: 32,
    minSize: 22,
    lineHeight: 1.35,
    ratio: 0.5,
  });
  const ctaSize = fitLine(cta, 760, 28, 18, 0.56);

  return (
    <Canvas style={{ backgroundColor: TINTA }}>
      <div style={abs({ top: 0, left: 0, width: 1080, height: 1080 })}>
        <Photo src={photo} alt={headline} width={1080} height={1080} />
      </div>
      <div
        style={abs({
          top: 0,
          left: 0,
          width: 1080,
          height: 1080,
          backgroundImage:
            "linear-gradient(to bottom, rgba(20,20,31,0.18) 0%, rgba(20,20,31,0.5) 46%, rgba(20,20,31,0.92) 100%)",
        })}
      />
      <div
        style={abs({
          top: 80,
          left: 80,
          alignSelf: "flex-start",
          backgroundColor: primary,
          borderRadius: 999,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 22,
          paddingRight: 22,
        })}
      >
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: badgeFit.size,
            letterSpacing: badgeFit.tracking,
            color: onBadge,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}
        >
          {badgeLabel}
        </div>
      </div>
      <div style={abs({ left: 70, top: 236, width: 420, height: 210, overflow: "hidden" })}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 300,
            lineHeight: 0.7,
            color: quote,
            whiteSpace: "nowrap",
          }}
        >
          {"“"}
        </div>
      </div>
      <div
        style={abs({
          left: 80,
          top: 500,
          width: 880,
          maxHeight: 230,
          overflow: "hidden",
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: headlineSize,
          lineHeight: 1.05,
          color: "#ffffff",
          wordBreak: "break-word",
        })}
      >
        {headline}
      </div>
      <div
        style={abs({
          left: 80,
          top: 748,
          width: 880,
          maxHeight: 120,
          overflow: "hidden",
          fontFamily: SANS,
          fontWeight: 400,
          fontSize: subSize,
          lineHeight: 1.35,
          color: MIST,
          wordBreak: "break-word",
        })}
      >
        {subheadline}
      </div>
      <div style={abs({ left: 80, top: 892, width: 60, height: 4, backgroundColor: rule })} />
      <div
        style={abs({
          left: 160,
          top: 876,
          width: 780,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: ctaSize,
          color: "#ffffff",
          whiteSpace: "nowrap",
        })}
      >
        {cta}
      </div>
      <div
        style={abs({
          left: 80,
          top: 990,
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 24,
          color: FOG,
          whiteSpace: "nowrap",
        })}
      >
        {handle}
      </div>
    </Canvas>
  );
}

/* =========================================================================
   3 — Cinema "Legenda"
   ========================================================================= */
function CinemaTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const { headline, subheadline, cta, handle, badge, photo, edition } = contentOf(post, profile, index);
  const kicker = `CENA ${edition}  ·  ${badge.toUpperCase()}`;
  const kickerFit = fitTracking(kicker, 760, 22, 5, 0.64);
  const accentOnBlack = readableBrand(accent, "#000000", 3);
  const secondaryOnBlack = readableBrand(secondary, "#000000", 3);
  const stripe = readableBrand(primary, "#000000", 1.8);
  const headlineSize = fitBlock(headline, {
    maxWidth: 920,
    maxHeight: 140,
    maxSize: 60,
    minSize: 32,
    lineHeight: 1.12,
    ratio: 0.56,
  });
  const subSize = fitBlock(subheadline, {
    maxWidth: 860,
    maxHeight: 100,
    maxSize: 28,
    minSize: 20,
    lineHeight: 1.3,
    ratio: 0.5,
  });
  const ctaLabel = `${cta}  →`;
  const footerSize = fitLine(`${ctaLabel}   ${handle}`, 920, 24, 16, 0.56);

  return (
    <Canvas style={{ backgroundColor: "#000000" }}>
      <div style={abs({ top: 120, left: 0, width: 1080, height: 566 })}>
        <Photo src={photo} alt={headline} width={1080} height={566} />
      </div>
      <div style={abs({ top: 686, left: 0, width: 1080, height: 4, backgroundColor: stripe })} />
      <div style={abs({ top: 0, left: 0, width: 1080, height: 120, backgroundColor: "#000000" })} />
      <div style={abs({ top: 690, left: 0, width: 1080, height: 390, backgroundColor: "#000000" })} />
      <div
        style={abs({
          top: 46,
          left: 80,
          width: 760,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: kickerFit.size,
          letterSpacing: kickerFit.tracking,
          color: accentOnBlack,
          whiteSpace: "pre",
        })}
      >
        {kicker}
      </div>
      <div style={abs({ top: 46, right: 80, ...row, alignItems: "center" })}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 22,
            color: REC,
            whiteSpace: "nowrap",
            marginRight: 10,
          }}
        >
          REC
        </div>
        <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: REC }} />
      </div>
      <div
        style={abs({
          top: 724,
          left: 80,
          width: 920,
          maxHeight: 140,
          overflow: "hidden",
          textAlign: "center",
          alignItems: "center",
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: headlineSize,
          lineHeight: 1.12,
          color: "#ffffff",
          wordBreak: "break-word",
        })}
      >
        {headline}
      </div>
      <div
        style={abs({
          top: 876,
          left: 110,
          width: 860,
          maxHeight: 100,
          overflow: "hidden",
          textAlign: "center",
          alignItems: "center",
          fontFamily: SANS,
          fontWeight: 400,
          fontSize: subSize,
          lineHeight: 1.3,
          color: CAPTION,
          wordBreak: "break-word",
        })}
      >
        {subheadline}
      </div>
      <div
        style={abs({
          top: 996,
          left: 80,
          width: 920,
          ...row,
          justifyContent: "center",
        })}
      >
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: footerSize,
            color: accentOnBlack,
            whiteSpace: "nowrap",
          }}
        >
          {ctaLabel}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: footerSize,
            color: secondaryOnBlack,
            whiteSpace: "nowrap",
            marginLeft: 16,
          }}
        >
          {handle}
        </div>
      </div>
    </Canvas>
  );
}

/* =========================================================================
   4 — Split "Passo a passo"
   ========================================================================= */
function SplitTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const { headline, subheadline, cta, handle, badge, photo } = contentOf(post, profile, index);
  const onPrimary = readableOn(primary);
  const steps = splitParts(subheadline, 3);
  const kicker = badge.toUpperCase();
  const kickerFit = fitTracking(kicker, 420, 22, 4, 0.64);
  const rule = readableBrand(accent, primary, 2);
  const circle = contrastRatio(secondary, primary) >= 1.7 ? secondary : onPrimary;
  const onCircle = readableOn(circle);
  const headlineSize = fitBlock(headline, {
    maxWidth: 440,
    maxHeight: 320,
    maxSize: 64,
    minSize: 32,
    lineHeight: 1.02,
    ratio: 0.56,
  });
  const longest = steps.reduce((a, b) => (a.length > b.length ? a : b), "");
  const stepSize = fitBlock(longest, {
    maxWidth: 340,
    maxHeight: 68,
    maxSize: 26,
    minSize: 18,
    lineHeight: 1.15,
    ratio: 0.54,
  });
  const ctaLabel = `${cta}  →`;
  const ctaSize = fitLine(ctaLabel, 360, 28, 16, 0.56);
  const ring = contrastRatio(TINTA, primary) < 2.2;

  return (
    <Canvas style={{ backgroundColor: "#ffffff" }}>
      <div style={abs({ top: 0, left: 0, width: 520, height: 1080 })}>
        <Photo src={photo} alt={headline} width={520} height={1080} />
      </div>
      <div
        style={abs({
          top: 0,
          left: 520,
          width: 560,
          height: 1080,
          backgroundColor: primary,
          overflow: "hidden",
        })}
      >
        <div
          style={abs({
            top: 90,
            left: 60,
            width: 440,
            opacity: 0.8,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: kickerFit.size,
            letterSpacing: kickerFit.tracking,
            color: onPrimary,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          })}
        >
          {kicker}
        </div>
        <div style={abs({ top: 134, left: 60, width: 44, height: 4, backgroundColor: rule })} />
        <div
          style={abs({
            top: 168,
            left: 60,
            width: 440,
            maxHeight: 330,
            overflow: "hidden",
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: headlineSize,
            lineHeight: 1.02,
            color: onPrimary,
            wordBreak: "break-word",
          })}
        >
          {headline}
        </div>
        <div style={abs({ top: 520, left: 60, width: 440 })}>
          {steps.map((step, stepIndex) => (
            <div key={`${step}-${stepIndex}`} style={{ ...row, alignItems: "center", marginBottom: stepIndex === 2 ? 0 : 28, width: 440 }}>
              <div
                style={{
                  ...row,
                  justifyContent: "center",
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: circle,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", fontFamily: DISPLAY, fontWeight: 700, fontSize: 30, color: onCircle }}>
                  {String(stepIndex + 1)}
                </div>
              </div>
              <div
                style={{
                  ...col,
                  marginLeft: 20,
                  width: 340,
                  maxHeight: 70,
                  overflow: "hidden",
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: stepSize,
                  lineHeight: 1.15,
                  color: onPrimary,
                  wordBreak: "break-word",
                }}
              >
                {step}
              </div>
            </div>
          ))}
        </div>
        <div
          style={abs({
            top: 888,
            left: 60,
            alignSelf: "flex-start",
            backgroundColor: TINTA,
            borderRadius: 14,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 28,
            paddingRight: 28,
            border: ring ? `3px solid ${onPrimary}` : "3px solid transparent",
          })}
        >
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: ctaSize,
              color: "#ffffff",
              whiteSpace: "pre",
            }}
          >
            {ctaLabel}
          </div>
        </div>
        <div
          style={abs({
            top: 1004,
            left: 60,
            width: 440,
            opacity: 0.8,
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 22,
            color: onPrimary,
            whiteSpace: "nowrap",
          })}
        >
          {handle}
        </div>
      </div>
    </Canvas>
  );
}

/* =========================================================================
   5 — Glass "Valores"
   O cartão não usa backdrop-filter (o Satori não suporta). O vidro é um
   degradê escuro translúcido, borda clara e os blobs em degradê radial.
   ========================================================================= */
function GlassTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const { headline, subheadline, cta, handle, badge, photo } = contentOf(post, profile, index);
  const items = splitParts(subheadline, 3);
  const kicker = badge.toUpperCase();
  const kickerFit = fitTracking(kicker, 620, 22, 4, 0.64);
  const mark = readableBrand(accent, TINTA, 3);
  const headlineSize = fitBlock(headline, {
    maxWidth: 712,
    maxHeight: 210,
    maxSize: 68,
    minSize: 34,
    lineHeight: 1.02,
    ratio: 0.56,
  });
  const longest = items.reduce((a, b) => (a.length > b.length ? a : b), "");
  const itemSize = fitBlock(longest, {
    maxWidth: 640,
    maxHeight: 72,
    maxSize: 30,
    minSize: 18,
    lineHeight: 1.2,
    ratio: 0.52,
  });
  const ctaSize = fitLine(cta, 620, 26, 16, 0.56);

  return (
    <Canvas style={{ backgroundColor: TINTA }}>
      <div
        style={abs({
          left: -40,
          top: -40,
          width: 1160,
          height: 1160,
          filter: "blur(12px)",
        })}
      >
        <Photo src={photo} alt={headline} width={1160} height={1160} />
      </div>
      <div
        style={abs({
          top: 0,
          left: 0,
          width: 1080,
          height: 1080,
          backgroundImage:
            "linear-gradient(to bottom, rgba(20,20,31,0.28) 0%, rgba(20,20,31,0.4) 55%, rgba(20,20,31,0.78) 100%)",
        })}
      />
      <div
        style={abs({
          left: -180,
          top: 520,
          width: 760,
          height: 760,
          backgroundImage: `radial-gradient(circle at center, ${alpha(primary, 0.72)} 0%, ${alpha(primary, 0)} 68%)`,
        })}
      />
      <div
        style={abs({
          left: 600,
          top: -200,
          width: 700,
          height: 700,
          backgroundImage: `radial-gradient(circle at center, ${alpha(secondary, 0.7)} 0%, ${alpha(secondary, 0)} 68%)`,
        })}
      />
      <div
        style={abs({
          left: 120,
          top: 150,
          width: 840,
          borderRadius: 40,
          border: "2px solid rgba(255,255,255,0.35)",
          backgroundImage:
            "linear-gradient(168deg, rgba(255,255,255,0.28) 0%, rgba(28,28,46,0.72) 42%, rgba(12,12,22,0.88) 100%)",
          padding: 64,
        })}
      >
        <div style={{ ...row, alignItems: "center" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: mark, marginRight: 12 }} />
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: kickerFit.size,
              letterSpacing: kickerFit.tracking,
              color: "#ffffff",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </div>
        </div>
        <div
          style={{
            ...col,
            width: 712,
            marginTop: 28,
            maxHeight: 220,
            overflow: "hidden",
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: headlineSize,
            lineHeight: 1.02,
            color: "#ffffff",
            wordBreak: "break-word",
          }}
        >
          {headline}
        </div>
        {items.map((item, itemIndex) => (
          <div key={`${item}-${itemIndex}`} style={{ ...row, alignItems: "center", marginTop: 28, width: 712 }}>
            <Check color={mark} />
            <div
              style={{
                ...col,
                marginLeft: 16,
                width: 640,
                maxHeight: 74,
                overflow: "hidden",
                fontFamily: SANS,
                fontWeight: 500,
                fontSize: itemSize,
                lineHeight: 1.2,
                color: ITEM,
                wordBreak: "break-word",
              }}
            >
              {item}
            </div>
          </div>
        ))}
        <div
          style={{
            ...row,
            alignSelf: "flex-start",
            marginTop: 28,
            backgroundColor: "#ffffff",
            borderRadius: 999,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 30,
            paddingRight: 30,
          }}
        >
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: ctaSize, color: TINTA, whiteSpace: "nowrap" }}>
            {cta}
          </div>
        </div>
      </div>
      <div
        style={abs({
          left: 120,
          top: 990,
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 24,
          color: "#ffffff",
          whiteSpace: "nowrap",
        })}
      >
        {handle}
      </div>
    </Canvas>
  );
}

/**
 * Faixa do L6. O resvg entra em pânico em `fit_to_rect` quando um shape
 * clipado fica inteiro além de 2× a largura do canvas (~2160). A faixa
 * repete handle ★ badge ★ só até cobrir os 1080px, e não desenha peça
 * cujo início estimado passe de 1900.
 */
function marqueeRun(handle: string, badge: string) {
  const textWidth = (value: string) => {
    let width = 0;
    for (const char of value) width += char === " " ? 9 : 27;
    return width;
  };
  const pattern: { kind: "text" | "star"; text: string; width: number; gapLeft: number; gapRight: number }[] = [
    { kind: "text", text: handle, width: textWidth(handle), gapLeft: 0, gapRight: 0 },
    { kind: "star", text: "", width: 24, gapLeft: 16, gapRight: 16 },
    { kind: "text", text: badge, width: textWidth(badge), gapLeft: 0, gapRight: 0 },
    { kind: "star", text: "", width: 24, gapLeft: 16, gapRight: 8 },
  ];
  const pieces: { id: string; kind: "text" | "star"; text: string; gapLeft: number; gapRight: number }[] = [];
  let x = 20;
  while (x < CANVAS_SIZE && pieces.length < 16) {
    const piece = pattern[pieces.length % pattern.length];
    const left = x + piece.gapLeft;
    if (left >= 1900) break;
    pieces.push({
      id: `${piece.kind}-${pieces.length}`,
      kind: piece.kind,
      text: piece.text,
      gapLeft: piece.gapLeft,
      gapRight: piece.gapRight,
    });
    x = left + piece.width + piece.gapRight;
  }
  return pieces;
}

/* =========================================================================
   6 — Brutalista "Manchete"
   ========================================================================= */
function BrutalistTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const { headline, subheadline, cta, handle, badge, photo } = contentOf(post, profile, index);
  const [rawA, rawB] = splitHeadline(headline);
  const lineA = rawA.toUpperCase();
  const lineB = rawB.toUpperCase();
  const ratio = 0.64;
  const longest = Math.max(lineA.length, lineB.length, 1);
  let size = Math.min(196, Math.floor(968 / (longest * ratio)));
  size = Math.max(48, size);
  while (size > 48 && longest * size * ratio > 968) size -= 2;
  let topB = 40 + size * 1.05;
  while (size > 48 && topB + size * 0.9 > 500) {
    size -= 2;
    topB = 40 + size * 1.05;
  }
  const lineColor = readableBrand(primary, YELLOW, 3);
  const border = readableBrand(secondary, YELLOW, 2);
  const ctaColor = contrastRatio(accent, TINTA) >= 3 ? accent : YELLOW;
  const starColor = readableBrand(secondary, TINTA, 3);
  const subSize = fitBlock(subheadline, {
    maxWidth: 460,
    maxHeight: 160,
    maxSize: 34,
    minSize: 20,
    lineHeight: 1.25,
    ratio: 0.54,
  });
  const ctaLabel = `${cta.toUpperCase()} →`;
  const ctaSize = fitLine(ctaLabel, 450, 34, 16, 0.66);
  const marquee = marqueeRun(handle.toUpperCase(), badge.toUpperCase());

  return (
    <Canvas style={{ backgroundColor: YELLOW }}>
      <div
        style={abs({
          top: 36,
          left: 56,
          width: 980,
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 0.9,
          color: TINTA,
          whiteSpace: "nowrap",
          textTransform: "uppercase",
        })}
      >
        {lineA}
      </div>
      <div
        style={abs({
          top: topB,
          left: 56,
          width: 980,
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 0.9,
          color: lineColor,
          whiteSpace: "nowrap",
          textTransform: "uppercase",
        })}
      >
        {lineB}
      </div>
      <div
        style={abs({
          left: 604,
          top: 480,
          width: 420,
          height: 420,
          backgroundColor: border,
          padding: 8,
        })}
      >
        <Photo src={photo} alt={headline} width={404} height={404} />
      </div>
      <div
        style={abs({
          left: 56,
          top: 520,
          width: 520,
          height: 300,
          backgroundColor: TINTA,
          paddingTop: 30,
          paddingRight: 30,
          paddingBottom: 26,
          paddingLeft: 30,
          justifyContent: "space-between",
        })}
      >
        <div
          style={{
            ...col,
            width: 460,
            maxHeight: 170,
            overflow: "hidden",
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: subSize,
            lineHeight: 1.25,
            color: "#ffffff",
            wordBreak: "break-word",
          }}
        >
          {subheadline}
        </div>
        <div
          style={{
            ...row,
            width: 460,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: ctaSize,
            color: ctaColor,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}
        >
          {ctaLabel}
        </div>
      </div>
      <div
        style={abs({
          left: 0,
          top: 944,
          width: 1080,
          height: 76,
          backgroundColor: TINTA,
          ...row,
          alignItems: "center",
          overflow: "hidden",
          paddingLeft: 20,
        })}
      >
        {marquee.map((piece) =>
          piece.kind === "star" ? (
            <div key={piece.id} style={{ ...row, marginLeft: piece.gapLeft, marginRight: piece.gapRight }}>
              <Star color={starColor} />
            </div>
          ) : (
            <div
              key={piece.id}
              style={{
                marginLeft: piece.gapLeft,
                marginRight: piece.gapRight,
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 30,
                color: YELLOW,
                whiteSpace: "nowrap",
              }}
            >
              {piece.text}
            </div>
          ),
        )}
      </div>
    </Canvas>
  );
}

const TEMPLATES = [
  EditorialTemplate,
  PolaroidTemplate,
  QuoteTemplate,
  CinemaTemplate,
  SplitTemplate,
  GlassTemplate,
  BrutalistTemplate,
];

export function PostCard({
  layout,
  ...props
}: TemplateProps & { layout: number }) {
  const safe = ((layout % TEMPLATES.length) + TEMPLATES.length) % TEMPLATES.length;
  const Template = TEMPLATES[safe];
  return <Template {...props} />;
}

export function PostCanvas({
  ref,
  layout,
  ...props
}: TemplateProps & { layout: number; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
      <PostCard layout={layout} {...props} />
    </div>
  );
}

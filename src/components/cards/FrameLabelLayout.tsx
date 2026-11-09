/* eslint-disable @next/next/no-img-element */
import { readableOn } from "@/lib/color";

const DISPLAY = "Bricolage Grotesque";
const SANS = "Plus Jakarta Sans";

type Props = {
  width: number;
  height: number;
  photo?: string;
  headline: string;
  subheadline: string;
  cta: string;
  handle: string;
  primary: string;
  secondary: string;
  logoUrl?: string;
  companyName: string;
};

function wrap(text: string, size: number, box: number, em: number) {
  const perLine = Math.max(8, Math.floor(box / (size * em)));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (!current || next.length <= perLine) {
      current = next;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

function clipLines(text: string, size: number, box: number, maxLines: number, em: number) {
  const lines = wrap(text, size, box, em);
  if (lines.length <= maxLines) return text.trim();
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1].replace(/\s+\S*$/, "").trim();
  kept[maxLines - 1] = `${last}…`;
  return kept.join(" ");
}

function titleSize(text: string, max: number, room: number, subtitleBlock: number) {
  let size = max;
  while (size > 42) {
    const lines = Math.min(3, wrap(text, size, 920, 0.6).length);
    if (lines * Math.round(size * 1.06) + 16 + subtitleBlock <= room) return size;
    size -= 1;
  }
  return 42;
}

function ctaSize(text: string) {
  let size = 20;
  while (size > 14 && text.length * size * 0.56 > 260) size -= 1;
  return size;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "SP";
}

/** Layout 33. A cor primária é a moldura; o texto fica na etiqueta branca. */
export function FrameLabelLayout({
  width,
  height,
  photo,
  headline,
  subheadline,
  cta,
  handle,
  primary,
  secondary,
  logoUrl,
  companyName,
}: Props) {
  const portrait = height > 1200;
  const photoBox = portrait ? { x: 80, y: 80, w: 920, h: 1190 } : { x: 72, y: 72, w: 936, h: 936 };
  const bar = portrait ? { x: 80, y: 66, w: 920 } : { x: 72, y: 58, w: 936 };
  const label = portrait ? { y: 834, h: 460 } : { y: 612, h: 420 };
  const logoY = portrait ? 866 : 644;
  const titleY = portrait ? 946 : 724;
  const ctaY = portrait ? 1206 : 944;
  const titleMax = portrait ? 52 : 48;
  const subtitle = portrait ? 26 : 24;
  const subtitleText = clipLines(subheadline, subtitle, 920, 2, 0.55);
  const subtitleLines = Math.min(2, wrap(subtitleText, subtitle, 920, 0.55).length);
  const subtitleBlock = subtitleLines * Math.round(subtitle * 1.3);
  const title = titleSize(headline, titleMax, ctaY - titleY, subtitleBlock);
  const titleLines = Math.min(3, wrap(headline, title, 920, 0.6).length);
  const subtitleY = titleY + titleLines * Math.round(title * 1.06) + 16;
  const ctaInk = readableOn(secondary);

  return (
    <div lang="pt-BR" style={{ position: "relative", display: "flex", flexDirection: "column", width, height, overflow: "hidden", backgroundColor: primary, fontFamily: SANS }}>
      <div style={{ position: "absolute", left: photoBox.x, top: photoBox.y, width: photoBox.w, height: photoBox.h, backgroundColor: "#3A4250", overflow: "hidden", display: "flex" }}>
        {photo ? (
          <img src={photo} alt="" width={photoBox.w} height={photoBox.h} crossOrigin="anonymous" style={{ width: photoBox.w, height: photoBox.h, objectFit: "cover" }} />
        ) : null}
      </div>
      <div style={{ position: "absolute", left: bar.x, top: bar.y, width: bar.w, height: 14, backgroundColor: secondary }} />
      <div style={{ position: "absolute", left: 40, top: label.y, width: 1000, height: label.h, borderRadius: 28, backgroundColor: "#ffffff" }} />
      <div style={{ position: "absolute", left: 80, top: logoY, width: 64, height: 64, borderRadius: 32, backgroundColor: logoUrl ? "#ffffff" : primary, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {logoUrl ? (
          <img src={logoUrl} alt="" width={64} height={64} crossOrigin="anonymous" style={{ width: 64, height: 64, objectFit: "contain" }} />
        ) : (
          <span style={{ color: "#ffffff", fontFamily: DISPLAY, fontSize: 20, fontWeight: 700 }}>{initials(companyName)}</span>
        )}
      </div>
      <div style={{ position: "absolute", top: logoY, right: width - 960, height: 64, display: "flex", alignItems: "center", color: "#5A5F6A", fontFamily: DISPLAY, fontSize: 20, fontWeight: 700 }}>{handle}</div>
      <div style={{ position: "absolute", left: 80, top: titleY, width: 920, color: "#111111", fontFamily: DISPLAY, fontSize: title, fontWeight: 700, lineHeight: `${Math.round(title * 1.06)}px` }}>{headline}</div>
      <div style={{ position: "absolute", left: 80, top: subtitleY, width: 920, color: "#5A5F6A", fontSize: subtitle, fontWeight: 500, lineHeight: `${Math.round(subtitle * 1.3)}px` }}>{subtitleText}</div>
      <div style={{ position: "absolute", left: 80, top: ctaY, width: 300, height: 56, borderRadius: 999, backgroundColor: secondary, color: ctaInk, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: ctaSize(cta), fontWeight: 700 }}>{cta}</div>
    </div>
  );
}

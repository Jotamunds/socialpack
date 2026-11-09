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
  const perLine = Math.max(6, Math.floor(box / (size * em)));
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

function clipLines(text: string, size: number, box: number, maxLines: number) {
  const lines = wrap(text, size, box, 0.52);
  if (lines.length <= maxLines) return text.trim();
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1].replace(/\s+\S*$/, "").trim();
  kept[maxLines - 1] = `${last}…`;
  return kept.join(" ");
}

function titleSize(text: string, max: number, min: number, maxLines: number, box: number) {
  let size = max;
  while (size > min && wrap(text, size, box, 0.55).length > maxLines) size -= 2;
  return size;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "SP";
}

/** Layout 35. Grade de dois blocos altos e uma faixa; o #111 aparece no vão. */
export function MosaicDuoLayout({
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
  const tall = portrait ? 816 : 636;
  const band = portrait ? { y: 864, h: 462 } : { y: 684, h: 372 };
  const titleMax = portrait ? 60 : 56;
  const titleLinesCap = portrait ? 3 : 2;
  const titleBox = portrait ? 952 : 660;
  const title = titleSize(headline, titleMax, 44, titleLinesCap, titleBox);
  const titleLine = Math.round(title * 1.02);
  const usedTitleLines = wrap(headline, title, titleBox, 0.55).length;
  const subtitle = clipLines(subheadline, 24, titleBox, 2);
  const subtitleLines = Math.min(2, wrap(subtitle, 24, titleBox, 0.52).length);
  const ink = readableOn(secondary);
  const titleLeft = portrait ? 64 : 40;
  const titleTop = band.y + 40;
  const ctaTop = portrait ? titleTop + usedTitleLines * titleLine + 16 + subtitleLines * 32 + 24 : band.y + (band.h - 60) / 2;

  return (
    <div lang="pt-BR" style={{ position: "relative", display: "flex", flexDirection: "column", width, height, overflow: "hidden", backgroundColor: "#111111", fontFamily: SANS }}>
      <div style={{ position: "absolute", left: 24, top: 24, width: 636, height: tall, backgroundColor: "#3A4250", overflow: "hidden", display: "flex" }}>
        {photo ? (
          <img src={photo} alt="" width={636} height={tall} crossOrigin="anonymous" style={{ width: 636, height: tall, objectFit: "cover" }} />
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 684, top: 24, width: 372, height: tall, backgroundColor: primary }} />
      <div style={{ position: "absolute", left: 830, top: 64, width: 80, height: 80, borderRadius: 40, backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {logoUrl ? (
          <img src={logoUrl} alt="" width={80} height={80} crossOrigin="anonymous" style={{ width: 80, height: 80, objectFit: "contain" }} />
        ) : (
          <span style={{ color: primary, fontFamily: DISPLAY, fontSize: 26, fontWeight: 700 }}>{initials(companyName)}</span>
        )}
      </div>
      <div style={{ position: "absolute", left: 770, top: 24 + tall - 220, width: 200, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: readableOn(primary), fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, transform: "rotate(-90deg)" }}>{handle}</div>
      <div style={{ position: "absolute", left: 24, top: band.y, width: 1032, height: band.h, backgroundColor: secondary }} />
      <div style={{ position: "absolute", left: titleLeft, top: titleTop, width: titleBox, color: ink, fontFamily: DISPLAY, fontSize: title, fontWeight: 700, lineHeight: `${titleLine}px` }}>{headline}</div>
      <div style={{ position: "absolute", left: titleLeft, top: titleTop + usedTitleLines * titleLine + 16, width: titleBox, color: ink, fontSize: 24, fontWeight: 500, lineHeight: "32px" }}>{subtitle}</div>
      <div style={{ position: "absolute", left: portrait ? titleLeft : 756, top: ctaTop, width: 260, height: 60, borderRadius: 999, backgroundColor: primary, color: readableOn(primary), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 22, fontWeight: 700 }}>{cta}</div>
    </div>
  );
}

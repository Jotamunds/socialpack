/* eslint-disable @next/next/no-img-element */
import { alpha, readableOn } from "@/lib/color";

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

/** Largura medida do Bricolage bold: o título longo cabe em 4 linhas a partir de 46px. */
function lineCount(text: string, size: number, box: number) {
  const perLine = Math.max(8, Math.floor(box / (size * 0.57)));
  const words = text.split(/\s+/).filter(Boolean);
  let lines = 1;
  let used = 0;
  for (const word of words) {
    if (used === 0) {
      used = word.length;
      continue;
    }
    if (used + 1 + word.length <= perLine) used += 1 + word.length;
    else {
      lines += 1;
      used = word.length;
    }
  }
  return lines;
}

function titleSize(text: string, max: number) {
  let size = max;
  while (size > 42 && lineCount(text, size, 400) > 4) size -= 1;
  return size;
}

function clipToLines(text: string, size: number, box: number, maxLines: number) {
  const perLine = Math.max(8, Math.floor(box / (size * 0.52)));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= perLine) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);
  const used = lines.join(" ");
  if (used.length >= text.trim().length) return text.trim();
  const last = lines[maxLines - 1] || current;
  const room = Math.max(1, perLine - 1);
  const trimmed = last.length > room ? last.slice(0, room).replace(/\s+\S*$/, "").trim() : last;
  lines[maxLines - 1] = `${trimmed}…`;
  return lines.slice(0, maxLines).join(" ");
}

function ctaSize(text: string) {
  let size = 22;
  while (size > 14 && text.length * size * 0.56 > 276) size -= 1;
  return size;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "SP";
}

/** Layout 32. O disco começa em x=480; a coluna de texto termina em 448. */
export function DiscLayout({
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
  const ink = readableOn(primary);
  const ctaInk = readableOn(secondary);
  const ring = portrait ? { y: 182, size: 1016 } : { y: 72, size: 936 };
  const disc = portrait ? { y: 200, size: 980 } : { y: 90, size: 900 };
  const title = titleSize(headline, portrait ? 56 : 52);
  const subtitle = portrait ? 26 : 24;
  const handleY = portrait ? 1204 : 934;
  const ctaY = portrait ? 1244 : 974;
  const titleLines = Math.min(4, lineCount(headline, title, 400));
  const subtitleText = clipToLines(subheadline, subtitle, 380, 4);
  const subtitleLines = Math.min(4, lineCount(subtitleText, subtitle, 380));
  const blockHeight = titleLines * Math.round(title * 1.04) + 24 + subtitleLines * Math.round(subtitle * 1.3);
  const logoBottom = 48 + 88;
  const textTop = logoBottom + Math.max(0, (handleY - logoBottom - blockHeight) / 2);

  return (
    <div lang="pt-BR" style={{ position: "relative", display: "flex", flexDirection: "column", width, height, overflow: "hidden", backgroundColor: primary, fontFamily: SANS }}>
      <div style={{ position: "absolute", left: 462, top: ring.y, width: ring.size, height: ring.size, borderRadius: ring.size / 2, backgroundColor: secondary }} />
      <div style={{ position: "absolute", left: 480, top: disc.y, width: disc.size, height: disc.size, borderRadius: disc.size / 2, backgroundColor: "#3A4250", overflow: "hidden", display: "flex" }}>
        {photo ? (
          <img src={photo} alt="" width={disc.size} height={disc.size} crossOrigin="anonymous" style={{ width: disc.size, height: disc.size, objectFit: "cover" }} />
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 48, top: 48, width: 88, height: 88, borderRadius: 44, backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {logoUrl ? (
          <img src={logoUrl} alt="" width={88} height={88} crossOrigin="anonymous" style={{ width: 88, height: 88, objectFit: "contain" }} />
        ) : (
          <span style={{ color: primary, fontFamily: DISPLAY, fontSize: 26, fontWeight: 700 }}>{initials(companyName)}</span>
        )}
      </div>
      <div style={{ position: "absolute", left: 48, top: textTop, width: 400, display: "flex", flexDirection: "column" }}>
        <div style={{ width: 400, color: ink, fontFamily: DISPLAY, fontSize: title, fontWeight: 700, lineHeight: `${Math.round(title * 1.04)}px`, wordBreak: "break-word" }}>{headline}</div>
        <div style={{ width: 380, maxHeight: Math.round(subtitle * 1.3 * 4), marginTop: 24, color: alpha(ink, 0.9), fontSize: subtitle, fontWeight: 500, lineHeight: `${Math.round(subtitle * 1.3)}px`, overflow: "hidden" }}>{subtitleText}</div>
      </div>
      <div style={{ position: "absolute", left: 48, top: handleY, width: 400, color: ink, fontFamily: DISPLAY, fontSize: 20, fontWeight: 700 }}>{handle}</div>
      <div style={{ position: "absolute", left: 48, top: ctaY, width: 320, height: 58, borderRadius: 999, backgroundColor: secondary, color: ctaInk, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: ctaSize(cta), fontWeight: 700 }}>{cta}</div>
    </div>
  );
}

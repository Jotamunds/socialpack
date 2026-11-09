/* eslint-disable @next/next/no-img-element */
import { contrastRatio, mix, readableOn } from "@/lib/color";

const DISPLAY = "Bricolage Grotesque";
const SANS = "Plus Jakarta Sans";
const PAPER = "#F4F1EA";

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
  const perLine = Math.max(4, Math.floor(box / (size * em)));
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

function titleSize(text: string, max: number, min: number, room: number) {
  let size = max;
  while (size > min) {
    const lines = Math.min(3, wrap(text, size, 952, 0.66).length);
    const block = lines * Math.round(size * 0.95);
    if (wrap(text, size, 952, 0.66).length <= 3 && block <= room) return size;
    size -= 2;
  }
  return min;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "SP";
}

function stageColor(primary: string, secondary: string) {
  if (contrastRatio(primary, secondary) < 1.8) return PAPER;
  return secondary;
}

/** Layout 34. O título ocupa a largura; a foto fica no canto inferior direito. */
export function TitularLayout({
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
  const background = stageColor(primary, secondary);
  const ink = readableOn(background);
  const titleColor = contrastRatio(primary, background) >= 3 ? primary : ink;
  const photoBox = portrait ? { y: 806, h: 480 } : { y: 656, h: 360 };
  const titleText = headline.toLocaleUpperCase("pt-BR");
  const title = titleSize(titleText, portrait ? 116 : 104, portrait ? 72 : 64, photoBox.y - 210 - 24);
  const subtitle = clipLines(subheadline, 26, 464, 4);
  const ctaTop = height - 64 - 60;
  const ctaWidth = Math.min(464, Math.max(168, Math.ceil(cta.length * 14 + 56)));
  const fallback = mix(background, primary, 0.85);

  return (
    <div lang="pt-BR" style={{ position: "relative", display: "flex", flexDirection: "column", width, height, overflow: "hidden", backgroundColor: background, fontFamily: SANS }}>
      <div style={{ position: "absolute", left: 64, top: 64, width: 120, height: 12, backgroundColor: primary }} />
      <div style={{ position: "absolute", left: 64, top: 104, width: 72, height: 72, borderRadius: 36, backgroundColor: logoUrl ? "#ffffff" : primary, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {logoUrl ? (
          <img src={logoUrl} alt="" width={72} height={72} crossOrigin="anonymous" style={{ width: 72, height: 72, objectFit: "contain" }} />
        ) : (
          <span style={{ color: "#ffffff", fontFamily: DISPLAY, fontSize: 22, fontWeight: 700 }}>{initials(companyName)}</span>
        )}
      </div>
      <div style={{ position: "absolute", top: 104, right: 64, height: 72, display: "flex", alignItems: "center", color: ink, fontFamily: DISPLAY, fontSize: 22, fontWeight: 700 }}>{handle}</div>
      <div style={{ position: "absolute", left: 64, top: 210, width: 952, color: titleColor, fontFamily: DISPLAY, fontSize: title, fontWeight: 800, lineHeight: `${Math.round(title * 0.95)}px`, letterSpacing: "-2px" }}>{titleText}</div>
      <div style={{ position: "absolute", left: 576, top: photoBox.y, width: 440, height: photoBox.h, borderRadius: 32, overflow: "hidden", backgroundColor: fallback, display: "flex" }}>
        {photo ? (
          <img src={photo} alt="" width={440} height={photoBox.h} crossOrigin="anonymous" style={{ width: 440, height: photoBox.h, objectFit: "cover" }} />
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 64, top: portrait ? 830 : 680, width: 464, color: ink, fontSize: 26, fontWeight: 500, lineHeight: "34px" }}>{subtitle}</div>
      <div style={{ position: "absolute", left: 64, top: ctaTop, width: ctaWidth, height: 60, borderRadius: 999, backgroundColor: primary, color: readableOn(primary), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 22, fontWeight: 700 }}>{cta}</div>
    </div>
  );
}

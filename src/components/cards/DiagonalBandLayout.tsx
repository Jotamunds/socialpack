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

function titleSize(headline: string, max: number) {
  let size = max;
  while (size > 34) {
    const perLine = Math.max(8, Math.floor(720 / (size * 0.52)));
    if (Math.ceil(headline.length / perLine) <= 3) return size;
    size -= 2;
  }
  return 34;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "SP";
}

/** Layout 31. A faixa é mais baixa à esquerda, então título e subtítulo ficam nessa coluna. */
export function DiagonalBandLayout({
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
  const titleColor = readableOn(primary);
  const subtitleColor = titleColor === "#ffffff" ? "rgba(255,255,255,.9)" : "rgba(13,13,20,.9)";
  const bandPoints = `0,${height * 0.46} ${width},${height * 0.26} ${width},${height * 0.54} 0,${height * 0.74}`;
  const edgePoints = `0,${height * 0.46} ${width},${height * 0.26} ${width},${height * 0.26 + 16} 0,${height * 0.46 + 16}`;

  return (
    <div lang="pt-BR" style={{ position: "relative", display: "flex", flexDirection: "column", width, height, overflow: "hidden", backgroundColor: "#3A4250", fontFamily: SANS }}>
      {photo ? (
        <img src={photo} alt="" width={width} height={height} crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : null}
      <div style={{ position: "absolute", display: "flex", left: 0, right: 0, top: 0, height: 220, background: "linear-gradient(180deg, rgba(8,9,10,.4), transparent)" }} />
      <div style={{ position: "absolute", display: "flex", left: 0, right: 0, bottom: 0, height: 260, background: "linear-gradient(180deg, transparent, rgba(8,9,10,.75))" }} />
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <polygon points={bandPoints} fill="rgba(0,0,0,.4)" transform="translate(0 14)" />
        <polygon points={bandPoints} fill={primary} />
        <polygon points={edgePoints} fill={secondary} />
      </svg>
      <div style={{ position: "absolute", top: 48, left: 48, width: 96, height: 96, borderRadius: 48, backgroundColor: "#ffffff", boxShadow: "0 8px 20px rgba(0,0,0,.28)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {logoUrl ? (
          <img src={logoUrl} alt="" width={96} height={96} crossOrigin="anonymous" style={{ width: 96, height: 96, objectFit: "contain" }} />
        ) : (
          <span style={{ color: primary, fontFamily: DISPLAY, fontSize: 28, fontWeight: 700 }}>{initials(companyName)}</span>
        )}
      </div>
      <div style={{ position: "absolute", left: 64, top: "45%", width: 720, display: "flex", flexDirection: "column" }}>
        <div style={{ width: 720, color: titleColor, fontFamily: DISPLAY, fontSize: titleSize(headline, portrait ? 60 : 56), fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.4px" }}>{headline}</div>
        <div style={{ width: 500, marginTop: 10, color: subtitleColor, fontSize: portrait ? 26 : 24, fontWeight: 500, lineHeight: 1.28 }}>{subheadline}</div>
      </div>
      <div style={{ position: "absolute", left: 48, bottom: 52, height: 58, padding: "0 28px", borderRadius: 999, backgroundColor: secondary, color: "#111", boxShadow: "0 10px 24px rgba(0,0,0,.28)", display: "flex", alignItems: "center", fontFamily: DISPLAY, fontSize: 22, fontWeight: 700 }}>{cta}</div>
      <div style={{ position: "absolute", display: "flex", right: 48, bottom: 58, color: "rgba(255,255,255,.92)", fontFamily: DISPLAY, fontSize: 22, fontWeight: 700 }}>{handle}</div>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from "react";
import { DiagonalBandLayout } from "./DiagonalBandLayout";
import { DiscLayout } from "./DiscLayout";
import { FrameLabelLayout } from "./FrameLabelLayout";
import { TitularLayout } from "./TitularLayout";
import { alpha, readableOn } from "@/lib/color";
import { CAMPAIGN_LAYOUTS, campaignLayoutForId, layoutDesignKey, type CampaignCategory } from "@/lib/campaign-layouts";
import { getCuratedPhoto } from "@/lib/curated-images";
import { getPostDimensions, normalizePostFormat } from "@/lib/post-format";
import type { CompanyProfile, GeneratedPost } from "@/lib/types";

type Profile = Pick<CompanyProfile, "name" | "instagram" | "colors" | "logoUrl"> & { categoryId?: string; nicheId?: string };
type Props = { layout: number; post: GeneratedPost; profile: Profile; index: number };
type Data = ReturnType<typeof dataFor>;

const SANS = "Plus Jakarta Sans";
const DISPLAY = "Bricolage Grotesque";
const SERIF = "Playfair Display";
const INK = "#14141f";
const PAPER = "#f7f4ee";
const row: CSSProperties = { display: "flex", flexDirection: "row", alignItems: "center" };
const column: CSSProperties = { display: "flex", flexDirection: "column" };
const labels: Record<CampaignCategory, string> = {
  promotion: "OFERTA ESPECIAL", launch: "LANÇAMENTO", bundle: "COMBO SELECIONADO", testimonial: "QUEM JÁ VIVEU",
  institutional: "NOSSA ESSÊNCIA", education: "DICA RÁPIDA", catalog: "CATÁLOGO", seasonal: "EDIÇÃO ESPECIAL",
};

function text(value: string | undefined, fallback: string) { return (value || "").replace(/\s+/g, " ").trim() || fallback; }
function shortText(value: string, limit = 34) {
  if (value.length <= limit) return value;
  const words = value.split(" ");
  let result = "";
  for (const word of words) {
    if (`${result} ${word}`.trim().length > limit) break;
    result = `${result} ${word}`.trim();
  }
  return `${result || value.slice(0, limit - 1)}…`;
}
function parts(value: string) {
  const source = text(value, "Qualidade, cuidado e resultado para você.");
  const clauses = source.split(/(?<=[.!?;])\s+/).map((part) => part.replace(/[.!?;:,]+$/g, "").trim()).filter(Boolean);
  if (clauses.length >= 3) return clauses.slice(0, 3);
  const commaClauses = source.split(/\s*,\s*/).map((part) => part.replace(/[.!?;:,]+$/g, "").trim()).filter(Boolean);
  if (commaClauses.length >= 3) return commaClauses.slice(0, 3);
  if (commaClauses.length === 2) return [...commaClauses, "Para você"];
  if (clauses.length === 1) return ["Escolha com calma", "Conte com especialistas", "Aproveite cada detalhe"];
  const words = source.split(" ").filter(Boolean);
  const each = Math.max(1, Math.ceil(words.length / 3));
  return [0, 1, 2].map((index) => words.slice(index * each, (index + 1) * each).join(" ") || source);
}
function dataFor(post: GeneratedPost, profile: Profile, index: number) {
  const { width, height } = getPostDimensions(normalizePostFormat(post.format));
  const headline = text(post.customHeadline || post.headline, profile.name);
  const subheadline = text(post.customSubheadline || post.subheadline, "Conheça nossos diferenciais.");
  return { width, height, headline, subheadline, cta: text(post.customCta || post.cta, "Saiba mais"), badge: text(post.badgeText || post.theme, "Destaque").slice(0, 24), handle: text(post.customHandle, profile.instagram ? `@${profile.instagram.replace(/^@+/, "")}` : profile.name), parts: parts(subheadline), photo: post.imageUrl || getCuratedPhoto(profile.nicheId, profile.categoryId, index) };
}
function fit(headline: string, width: number, height: number, max: number, min: number) {
  const chars = Math.max(9, Math.floor(width / (max * 0.52)));
  const roughLines = Math.max(1, Math.ceil(headline.length / chars));
  return roughLines * max * 1.02 <= height ? max : Math.max(min, Math.floor(height / (roughLines * 1.02)));
}
function fitReflow(text: string, width: number, height: number, max: number, min: number, lineHeight: number, ratio: number) {
  let size = max;
  while (size > min) {
    const perLine = Math.max(4, Math.floor(width / (size * ratio)));
    const lines = Math.max(1, Math.ceil(text.length / perLine));
    if (lines * size * lineHeight <= height) return size;
    size -= 2;
  }
  return min;
}
function lineCount(text: string, size: number, width: number, ratio: number) {
  const perLine = Math.max(4, Math.floor(width / (size * ratio)));
  return Math.max(1, Math.ceil(text.length / perLine));
}
function Canvas({ data, children, style }: { data: Data; children: ReactNode; style?: CSSProperties }) { return <div lang="pt-BR" style={{ ...column, position: "relative", width: data.width, height: data.height, overflow: "hidden", fontFamily: SANS, ...style }}>{children}</div>; }
function Photo({ data, width, height, style }: { data: Data; width: number; height: number; style?: CSSProperties }) { return <div style={{ ...row, width, height, overflow: "hidden", flexShrink: 0, ...style }}><img src={data.photo} alt="" width={width} height={height} crossOrigin="anonymous" style={{ width, height, objectFit: "cover" }} /></div>; }
function Mark({ profile, color = "#ffffff", size = 44 }: { profile: Profile; color?: string; size?: number }) {
  const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "SP";
  return <div style={{ ...row, width: size, height: size, borderRadius: size / 2, justifyContent: "center", overflow: "hidden", backgroundColor: alpha(color, 0.16), border: `2px solid ${alpha(color, 0.7)}`, flexShrink: 0 }}>{profile.logoUrl ? <img src={profile.logoUrl} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: "contain", backgroundColor: "#ffffff" }} /> : <span style={{ color, fontFamily: DISPLAY, fontSize: Math.round(size * 0.34), fontWeight: 800 }}>{initials}</span>}</div>;
}
function Title({ data, color, width, height, serif = false, size, lineHeight }: { data: Data; color: string; width: number; height: number; serif?: boolean; size?: number; lineHeight?: number }) { return <div style={{ color, width, fontFamily: serif ? SERIF : DISPLAY, fontSize: size ?? fit(data.headline, width, height, serif ? 84 : 80, 34), lineHeight: lineHeight ?? (serif ? 0.99 : 0.94), fontWeight: serif ? 900 : 800, wordBreak: "break-word" }}>{data.headline}</div>; }
function Pill({ children, background, color }: { children: ReactNode; background: string; color: string }) { return <span style={{ ...row, alignSelf: "flex-start", padding: "11px 18px", borderRadius: 999, backgroundColor: background, color, fontSize: 17, lineHeight: 1, fontWeight: 800, letterSpacing: 0.8 }}>{children}</span>; }
function Header({ data, profile, category, dark = false }: { data: Data; profile: Profile; category: CampaignCategory; dark?: boolean }) {
  const color = dark ? "#ffffff" : INK;
  return <div style={{ ...row, position: "absolute", top: 52, left: 54, right: 54, justifyContent: "space-between", color }}><div style={{ ...row, gap: 14 }}><Mark profile={profile} color={color} /><span style={{ color, fontSize: 18, fontWeight: 800, letterSpacing: 1.5 }}>{labels[category]}</span></div><Pill background={dark ? "#ffffff" : profile.colors.primary} color={dark ? profile.colors.primary : readableOn(profile.colors.primary)}>{data.badge.toUpperCase()}</Pill></div>;
}

function Ledger({ data, profile, category }: { data: Data; profile: Profile; category: CampaignCategory }) {
  const { primary, secondary, accent } = profile.colors;
  const photoHeight = data.height > 1200 ? 940 : 720;
  const titleLh = 1.08;
  const titleBudget = data.height > 1200 ? 330 : 260;
  const titleSize = fitReflow(data.headline, 510, titleBudget, 84, 34, titleLh, 0.62);
  const titleBlock = Math.ceil(lineCount(data.headline, titleSize, 510, 0.62) * titleSize * titleLh);
  return <Canvas data={data} style={{ backgroundColor: PAPER }}><div style={{ position: "absolute", left: 0, top: 0, width: 120, height: data.height, backgroundColor: secondary }} /><Photo data={data} width={460} height={photoHeight} style={{ position: "absolute", right: 0, top: 130, borderRadius: "220px 0 0 0", borderLeft: `14px solid ${accent}` }} /><Header data={data} profile={profile} category={category} /><div style={{ ...column, position: "absolute", left: 54, top: 185, width: 525 }}><div style={{ ...column, height: titleBlock }}><Title data={data} color={primary} width={510} height={titleBudget} serif size={titleSize} lineHeight={titleLh} /></div><div style={{ marginTop: 26, color: INK, width: 450, fontSize: 25, lineHeight: 1.3 }}>{data.subheadline}</div></div><div style={{ ...row, position: "absolute", left: 54, bottom: 62, gap: 18 }}><Pill background={INK} color="#ffffff">{data.cta}</Pill><span style={{ color: primary, fontSize: 20, fontWeight: 800 }}>{data.handle}</span></div></Canvas>;
}
function Poster({ data, profile, category }: { data: Data; profile: Profile; category: CampaignCategory }) {
  const { primary, secondary, accent } = profile.colors;
  const photoHeight = data.height > 1200 ? 720 : 505;
  return <Canvas data={data} style={{ backgroundColor: primary }}><Photo data={data} width={1080} height={photoHeight} style={{ position: "absolute", bottom: 0 }} /><div style={{ position: "absolute", left: 0, bottom: 0, width: 1080, height: photoHeight, background: `linear-gradient(0deg, ${alpha(INK, 0.68)}, transparent)` }} /><Header data={data} profile={profile} category={category} dark /><div style={{ ...column, position: "absolute", left: 54, top: 170, width: 860 }}><Title data={data} color="#ffffff" width={840} height={data.height > 1200 ? 250 : 185} /><div style={{ marginTop: 20, color: alpha("#ffffff", 0.8), fontSize: 26, lineHeight: 1.27, width: 680 }}>{data.subheadline}</div></div><div style={{ ...row, position: "absolute", left: 54, bottom: 58, padding: "16px 23px", borderRadius: 8, backgroundColor: accent, color: readableOn(accent), fontSize: 23, fontWeight: 800 }}>{data.cta} →</div><div style={{ ...row, position: "absolute", right: 76, top: data.height > 1200 ? 450 : 330, width: 210, height: 210, borderRadius: 105, justifyContent: "center", textAlign: "center", backgroundColor: secondary, color: readableOn(secondary), fontFamily: DISPLAY, fontSize: 24, fontWeight: 800, lineHeight: 0.95, border: "8px solid #ffffff" }}>{data.badge.toUpperCase()}</div></Canvas>;
}
function Tiles({ data, profile, category }: { data: Data; profile: Profile; category: CampaignCategory }) {
  const { primary, secondary, accent } = profile.colors;
  const cardHeight = data.height > 1200 ? 305 : 250;
  return <Canvas data={data} style={{ backgroundColor: "#ffffff" }}><Header data={data} profile={profile} category={category} /><div style={{ ...column, position: "absolute", left: 54, top: 145, width: 710 }}><Title data={data} color={INK} width={690} height={data.height > 1200 ? 250 : 220} /><div style={{ marginTop: 10, color: primary, fontSize: 23 }}>{data.subheadline}</div></div><div style={{ ...row, position: "absolute", left: 54, right: 54, top: data.height > 1200 ? 560 : 470, gap: 18, alignItems: "flex-start" }}>{data.parts.map((part, index) => <div key={part} style={{ ...column, width: 312, height: cardHeight, overflow: "hidden", borderRadius: 18, backgroundColor: index === 1 ? secondary : primary, border: `5px solid ${index === 1 ? accent : "#ffffff"}` }}><Photo data={data} width={302} height={cardHeight - 98} /><div style={{ ...row, minHeight: 88, padding: "12px 15px", color: readableOn(index === 1 ? secondary : primary), fontSize: 16, fontWeight: 800, lineHeight: 1.1 }}><span style={{ color: accent, minWidth: 32 }}>0{index + 1}</span><span style={{ flex: 1 }}>{shortText(part)}</span></div></div>)}</div><div style={{ ...row, position: "absolute", left: 54, bottom: 55, gap: 16 }}><Pill background={accent} color={readableOn(accent)}>{data.cta}</Pill><span style={{ color: "#595862", fontSize: 19, fontWeight: 700 }}>{data.handle}</span></div></Canvas>;
}
function Immersive({ data, profile, category }: { data: Data; profile: Profile; category: CampaignCategory }) {
  const { accent } = profile.colors;
  const titleLh = 1.12;
  const titleBudget = data.height > 1200 ? 305 : 220;
  const titleSize = fitReflow(data.headline, 850, titleBudget, 84, 34, titleLh, 0.62);
  const titleBlock = Math.ceil(lineCount(data.headline, titleSize, 850, 0.62) * titleSize * titleLh);
  const scrimH = Math.round(data.height * 0.56);
  return <Canvas data={data} style={{ backgroundColor: INK }}><Photo data={data} width={1080} height={data.height} style={{ position: "absolute", top: 0, left: 0 }} /><div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${alpha(INK, 0.12)}, ${alpha(INK, 0.92)})` }} /><div style={{ position: "absolute", left: 0, bottom: 0, width: 1080, height: scrimH, backgroundColor: "rgba(20,20,31,0.64)" }} /><Header data={data} profile={profile} category={category} dark /><div style={{ ...column, position: "absolute", left: 54, right: 54, bottom: data.height > 1200 ? 185 : 145 }}><div style={{ color: accent, fontFamily: SERIF, fontSize: 130, height: 66, lineHeight: 0.7 }}>“</div><div style={{ ...column, height: titleBlock }}><Title data={data} color="#ffffff" width={850} height={titleBudget} serif size={titleSize} lineHeight={titleLh} /></div><div style={{ marginTop: 22, color: "#ffffff", width: 760, fontSize: 27, lineHeight: 1.28 }}>{data.subheadline}</div></div><div style={{ ...row, position: "absolute", left: 54, bottom: 54, color: "#ffffff", fontSize: 22, fontWeight: 800 }}><Mark profile={profile} size={36} /><span style={{ marginLeft: 12 }}>{data.handle}</span><span style={{ marginLeft: 22, color: "#ffffff" }}>{data.cta} →</span></div></Canvas>;
}
function Board({ data, profile, category }: { data: Data; profile: Profile; category: CampaignCategory }) {
  const { primary, secondary, accent } = profile.colors;
  return <Canvas data={data} style={{ backgroundColor: secondary }}><Header data={data} profile={profile} category={category} dark /><div style={{ ...column, position: "absolute", left: 54, top: 170, width: 860 }}><Title data={data} color="#ffffff" width={840} height={data.height > 1200 ? 200 : 155} /><div style={{ marginTop: 12, color: alpha("#ffffff", 0.8), fontSize: 24 }}>{data.subheadline}</div></div><div style={{ ...column, position: "absolute", left: 54, right: 54, top: data.height > 1200 ? 500 : 395, gap: 16 }}>{data.parts.map((part, index) => <div key={part} style={{ ...row, minHeight: data.height > 1200 ? 150 : 118, padding: "18px 25px", gap: 24, borderRadius: 18, backgroundColor: index === 1 ? accent : "#ffffff", color: readableOn(index === 1 ? accent : "#ffffff") }}><span style={{ fontFamily: DISPLAY, fontSize: 50, fontWeight: 800 }}>0{index + 1}</span><span style={{ fontSize: 25, lineHeight: 1.14, fontWeight: 700 }}>{part}</span></div>)}</div><Photo data={data} width={220} height={220} style={{ position: "absolute", right: 55, bottom: 55, borderRadius: 110, border: `10px solid ${primary}` }} /><div style={{ ...row, position: "absolute", left: 54, bottom: 55, backgroundColor: primary, color: readableOn(primary), padding: "16px 22px", borderRadius: 8, fontSize: 22, fontWeight: 800 }}>{data.cta}</div></Canvas>;
}

/** Cada trio de categoria atravessa macrocomposições diferentes (não apenas cores). */
export function CampaignPostCard({ layout, post, profile, index }: Props) {
  const definition = campaignLayoutForId(layout) || CAMPAIGN_LAYOUTS[0];
  const data = dataFor(post, profile, index);
  if (definition.id === 31) {
    return (
      <DiagonalBandLayout
        width={data.width}
        height={data.height}
        photo={post.imageUrl}
        headline={data.headline}
        subheadline={data.subheadline}
        cta={data.cta}
        handle={data.handle}
        primary={profile.colors.primary}
        secondary={profile.colors.secondary}
        logoUrl={profile.logoUrl}
        companyName={profile.name}
      />
    );
  }
  if (definition.id === 32) {
    return (
      <DiscLayout
        width={data.width}
        height={data.height}
        photo={post.imageUrl}
        headline={data.headline}
        subheadline={data.subheadline}
        cta={data.cta}
        handle={data.handle}
        primary={profile.colors.primary}
        secondary={profile.colors.secondary}
        logoUrl={profile.logoUrl}
        companyName={profile.name}
      />
    );
  }
  if (definition.id === 33) {
    return (
      <FrameLabelLayout
        width={data.width}
        height={data.height}
        photo={post.imageUrl}
        headline={data.headline}
        subheadline={data.subheadline}
        cta={data.cta}
        handle={data.handle}
        primary={profile.colors.primary}
        secondary={profile.colors.secondary}
        logoUrl={profile.logoUrl}
        companyName={profile.name}
      />
    );
  }
  if (definition.id === 34) {
    return (
      <TitularLayout
        width={data.width}
        height={data.height}
        photo={post.imageUrl}
        headline={data.headline}
        subheadline={data.subheadline}
        cta={data.cta}
        handle={data.handle}
        primary={profile.colors.primary}
        secondary={profile.colors.secondary}
        logoUrl={profile.logoUrl}
        companyName={profile.name}
      />
    );
  }
  const design = layoutDesignKey(definition.id);
  const mode = design.startsWith("campaign:") ? Number(design.slice("campaign:".length)) : 0;
  if (mode === 0) return <Ledger data={data} profile={profile} category={definition.category} />;
  if (mode === 1) return <Poster data={data} profile={profile} category={definition.category} />;
  if (mode === 2) return <Tiles data={data} profile={profile} category={definition.category} />;
  if (mode === 3) return <Immersive data={data} profile={profile} category={definition.category} />;
  return <Board data={data} profile={profile} category={definition.category} />;
}

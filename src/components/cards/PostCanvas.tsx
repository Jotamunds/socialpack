import type { CSSProperties, ReactNode, Ref } from "react";
import { INK, alpha, darken, lighten, mix, readableOn } from "@/lib/color";
import type { CompanyProfile, GeneratedPost } from "@/lib/types";

// Cada template é renderizado em tamanho real (1080x1080) e reduzido via CSS na prévia.
// Estilos inline garantem que a exportação PNG fique idêntica à prévia.

export const CANVAS_SIZE = 1080;

export const LAYOUT_NAMES = [
  "Editorial Kinfolk",
  "Moldura Polaroid",
  "Frase & Foto",
  "Selo Pop Lifestyle",
  "Bloco Arquitetônico",
  "Noite Moody",
  "Pôster Brutalista",
];

type CardProfile = Pick<CompanyProfile, "name" | "instagram" | "colors"> & {
  categoryId?: string;
};

type TemplateProps = {
  post: GeneratedPost;
  profile: CardProfile;
  index: number;
};

const DISPLAY = "var(--font-bricolage), sans-serif";
const SERIF = "var(--font-playfair), Georgia, serif";
const SANS = "var(--font-jakarta), sans-serif";

function headlineSize(text: string, factor = 1) {
  const len = text.length;
  const size = len <= 18 ? 116 : len <= 28 ? 100 : len <= 40 ? 86 : len <= 56 ? 74 : 64;
  return Math.round(size * factor);
}

function subSize(text: string) {
  const len = text.length;
  return len <= 70 ? 36 : len <= 110 ? 32 : 28;
}

const handleOf = (p: CardProfile) => (p.instagram ? `@${p.instagram}` : p.name);

function Arrow({ size = 28, color }: { size?: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function Canvas({ style, children }: { style: CSSProperties; children: ReactNode }) {
  return (
    <div
      style={{
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

const abs = (style: CSSProperties): CSSProperties => ({ position: "absolute", ...style });

/** Banco de imagens editoriais de fallback em alta resolução por nicho */
export function getFallbackPhoto(categoryId = "alimentacao", index = 0): string {
  const pools: Record<string, string[]> = {
    alimentacao: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1080&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1080&q=80",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1080&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1080&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&q=80",
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=1080&q=80",
    ],
    beleza: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1080&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1080&q=80",
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1080&q=80",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1080&q=80",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1080&q=80",
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1080&q=80",
      "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1080&q=80",
    ],
    saude: [
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1080&q=80",
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1080&q=80",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1080&q=80",
      "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1080&q=80",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&q=80",
      "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=1080&q=80",
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1080&q=80",
    ],
  };

  const defaultPool = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&q=80",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1080&q=80",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1080&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1080&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1080&q=80",
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1080&q=80",
  ];

  const pool = pools[categoryId] || defaultPool;
  return pool[index % pool.length];
}

/* 0 ─ Editorial Kinfolk: Moldura fina, imagem no topo e tipografia serifada de revista */
function EditorialTemplate({ post, profile, index }: TemplateProps) {
  const { primary, accent } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.categoryId, index);

  return (
    <Canvas style={{ background: "#fbfaf8", color: INK }}>
      {/* Moldura elegante */}
      <div style={abs({ inset: 36, border: `2px solid ${alpha(primary, 0.2)}` })} />

      <div style={abs({ inset: 36, padding: "50px 56px", display: "flex", flexDirection: "column" })}>
        {/* Topo: Nome da marca e número da semana */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
          <span style={{ color: primary }}>{profile.name}</span>
          <span style={{ color: alpha(INK, 0.5) }}>
            {post.day}
          </span>
        </div>

        {/* Slot de Foto Editorial */}
        <div style={{ position: "relative", width: "100%", height: 460, marginTop: 28, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={headline}
            crossOrigin="anonymous"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <span style={abs({ top: 16, left: 16, background: "rgba(255,255,255,0.92)", padding: "6px 18px", borderRadius: 999, fontSize: 18, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: INK })}>
            {post.theme}
          </span>
        </div>

        {/* Textos em Tipografia Serifada */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "18px 0" }}>
          <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 700, fontSize: headlineSize(headline, 0.84), lineHeight: 1.1, letterSpacing: "-0.015em", color: INK }}>
            {headline}
          </h2>
          <p style={{ margin: "14px 0 0", fontSize: subSize(subheadline) - 4, lineHeight: 1.4, color: alpha(INK, 0.72) }}>
            {subheadline}
          </p>
        </div>

        {/* Rodapé: CTA e Handle */}
        <div style={{ borderTop: `1.5px solid ${alpha(INK, 0.1)}`, paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 12, fontSize: 24, fontWeight: 800, color: primary, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {cta}
            <Arrow color={primary} size={22} />
          </span>
          <span style={{ fontSize: 22, fontWeight: 600, color: alpha(INK, 0.6) }}>{handle}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* 1 ─ Moldura Polaroid: Estilo fotográfico com borda branca e fita adesiva */
function PolaroidTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.categoryId, index);

  return (
    <Canvas style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`, color: INK }}>
      {/* Padrão sutil geométrico de fundo */}
      <div style={abs({ inset: 0, backgroundImage: `radial-gradient(${alpha("#ffffff", 0.12)} 2px, transparent 2px)`, backgroundSize: "32px 32px" })} />

      {/* Cartão Polaroid Central */}
      <div style={abs({ top: 70, left: 100, right: 100, bottom: 90, background: "#ffffff", borderRadius: 24, padding: "36px 36px 44px", display: "flex", flexDirection: "column", boxShadow: "0 35px 80px -20px rgba(0,0,0,0.4)" })}>
        {/* Selo simulando fita adesiva translúcida no topo */}
        <div style={abs({ top: -18, left: "50%", transform: "translateX(-50%)", width: 140, height: 36, background: "rgba(255,255,255,0.75)", backdropFilter: "blur(4px)", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" })} />

        {/* Foto da Polaroid */}
        <div style={{ position: "relative", width: "100%", height: 530, borderRadius: 14, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={headline}
            crossOrigin="anonymous"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <span style={abs({ bottom: 18, left: 18, background: "rgba(0,0,0,0.75)", color: "#ffffff", padding: "6px 18px", borderRadius: 999, fontSize: 18, fontWeight: 700 })}>
            {post.day}
          </span>
        </div>

        {/* Legenda e Chamada da Polaroid */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: 24 }}>
          <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: headlineSize(headline, 0.78), lineHeight: 1.08, color: INK }}>
            {headline}
          </h2>
          <p style={{ margin: "10px 0 0", fontSize: subSize(subheadline) - 4, lineHeight: 1.35, color: "#6e6e73" }}>
            {subheadline}
          </p>
        </div>

        {/* Barra inferior */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e5e5ea", paddingTop: 18 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: primary, textTransform: "uppercase" }}>
            {cta}
          </span>
          <span style={{ fontSize: 20, fontWeight: 600, color: "#86868b" }}>{handle}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* 2 ─ Frase & Foto: Imagem de fundo completa (full-bleed) com overlay escuro elegante */
function FullPhotoTemplate({ post, profile, index }: TemplateProps) {
  const { accent } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.categoryId, index);

  return (
    <Canvas style={{ background: "#000000", color: "#ffffff" }}>
      {/* Imagem full-bleed */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt={headline}
        crossOrigin="anonymous"
        style={abs({ inset: 0, width: "100%", height: "100%", objectFit: "cover" })}
      />

      {/* Overlay gradiente escuro cinematográfico */}
      <div style={abs({ inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.35) 100%)" })} />

      <div style={abs({ inset: 0, padding: 80, display: "flex", flexDirection: "column", justifyContent: "space-between" })}>
        {/* Topo */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ padding: "12px 28px", borderRadius: 999, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)", fontSize: 24, fontWeight: 700, border: "1px solid rgba(255,255,255,0.25)" }}>
            {profile.name}
          </span>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.9 }}>
            {post.day}
          </span>
        </div>

        {/* Centro: Frase de Impacto */}
        <div style={{ maxWidth: 900 }}>
          <span style={{ display: "inline-block", padding: "8px 22px", borderRadius: 999, background: accent, color: readableOn(accent), fontSize: 20, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 24 }}>
            {post.theme}
          </span>
          <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: headlineSize(headline, 0.95), lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            {headline}
          </h2>
          <p style={{ margin: "24px 0 0", fontSize: subSize(subheadline), lineHeight: 1.4, opacity: 0.88 }}>
            {subheadline}
          </p>
        </div>

        {/* Base */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "22px 42px", borderRadius: 999, background: accent, color: readableOn(accent), fontSize: 28, fontWeight: 800, boxShadow: "0 20px 45px rgba(0,0,0,0.4)" }}>
            {cta}
            <Arrow color={readableOn(accent)} size={26} />
          </span>
          <span style={{ fontSize: 24, fontWeight: 600, opacity: 0.85 }}>{handle}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* 3 ─ Selo Pop Lifestyle: Selo circular rotacionado com contraste moderno */
function PopBadgeTemplate({ post, profile, index }: TemplateProps) {
  const { primary, accent } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.categoryId, index);

  return (
    <Canvas style={{ background: "#f5f5f7", color: INK }}>
      {/* Foto no topo / meio */}
      <div style={abs({ top: 40, left: 40, right: 40, height: 500, borderRadius: 24, overflow: "hidden" })}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={headline}
          crossOrigin="anonymous"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={abs({ inset: 0, background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5) 100%)" })} />
        <span style={abs({ bottom: 20, left: 24, color: "#ffffff", fontSize: 22, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" })}>
          {post.day}
        </span>
      </div>

      {/* Selo Pop Rotacionado */}
      <div style={abs({ top: 460, right: 70, width: 200, height: 200, borderRadius: "50%", background: accent, color: readableOn(accent), display: "grid", placeItems: "center", textAlign: "center", padding: 20, transform: "rotate(10deg)", boxShadow: "0 25px 60px -15px rgba(0,0,0,0.35)", zIndex: 10 })}>
        <span style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 800, lineHeight: 1.1, textTransform: "uppercase" }}>
          {cta}
        </span>
      </div>

      {/* Conteúdo inferior */}
      <div style={abs({ left: 56, right: 280, bottom: 60, display: "flex", flexDirection: "column" })}>
        <span style={{ fontSize: 20, fontWeight: 800, color: primary, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {post.theme} · {profile.name}
        </span>
        <h2 style={{ margin: "16px 0 0", fontFamily: DISPLAY, fontWeight: 800, fontSize: headlineSize(headline, 0.82), lineHeight: 1.05 }}>
          {headline}
        </h2>
        <p style={{ margin: "16px 0 0", fontSize: subSize(subheadline) - 4, lineHeight: 1.4, color: "#6e6e73" }}>
          {subheadline}
        </p>
        <span style={{ marginTop: 24, fontSize: 22, fontWeight: 600, color: "#86868b" }}>
          {handle}
        </span>
      </div>
    </Canvas>
  );
}

/* 4 ─ Bloco Arquitetônico: Split assimétrico sólido com bloco arredondado */
function BlockTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.categoryId, index);

  return (
    <Canvas style={{ background: secondary, color: readableOn(secondary) }}>
      {/* Imagem de fundo sutil com overlay */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt={headline}
        crossOrigin="anonymous"
        style={abs({ inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 })}
      />

      <div style={abs({ top: 70, left: 80, display: "flex", flexDirection: "column", gap: 8 })}>
        <span style={{ fontSize: 30, fontWeight: 800 }}>{profile.name}</span>
        <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.85 }}>{post.day}</span>
      </div>

      {/* Bloco Sólido Principal */}
      <div style={abs({ left: 0, bottom: 0, width: 980, height: 680, background: primary, color: readableOn(primary), borderTopRightRadius: 160, padding: "80px 88px", display: "flex", flexDirection: "column", boxShadow: "0 -25px 70px -20px rgba(0,0,0,0.4)" })}>
        <span style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 22, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: accent }}>
          <span style={{ width: 48, height: 4, borderRadius: 2, background: "currentColor" }} />
          {post.theme}
        </span>
        <h2 style={{ margin: "26px 0 0", fontFamily: DISPLAY, fontWeight: 800, fontSize: headlineSize(headline, 0.85), lineHeight: 1.05 }}>
          {headline}
        </h2>
        <p style={{ margin: "22px 0 0", fontSize: subSize(subheadline) - 4, lineHeight: 1.4, opacity: 0.88, maxWidth: 760 }}>
          {subheadline}
        </p>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 18, fontSize: 28, fontWeight: 800 }}>
          {cta}
          <span style={{ fontSize: 24, fontWeight: 500, opacity: 0.7 }}>· {handle}</span>
        </div>
      </div>

      <div style={abs({ right: 60, bottom: 560, width: 160, height: 160, borderRadius: "50%", background: accent, display: "grid", placeItems: "center", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" })}>
        <Arrow size={56} color={readableOn(accent)} />
      </div>
    </Canvas>
  );
}

/* 5 ─ Noite Moody: Fundo acetinado escuro, aspas serifadas e brilhos neon */
function NightTemplate({ post, profile, index }: TemplateProps) {
  const { primary, accent } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.categoryId, index);

  return (
    <Canvas style={{ background: "#0c0d12", color: "#ffffff" }}>
      {/* Imagem de fundo bem escura moody */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt={headline}
        crossOrigin="anonymous"
        style={abs({ inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.22, filter: "contrast(120%)" })}
      />

      <div style={abs({ width: 680, height: 680, borderRadius: "50%", background: alpha(primary, 0.5), filter: "blur(160px)", top: -200, left: -180 })} />
      <div style={abs({ width: 560, height: 560, borderRadius: "50%", background: alpha(accent, 0.4), filter: "blur(150px)", bottom: -200, right: -160 })} />

      <div style={abs({ inset: 0, padding: 88, display: "flex", flexDirection: "column" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 700 }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", background: accent, boxShadow: `0 0 20px ${accent}` }} />
            {profile.name}
          </span>
          <span style={{ padding: "10px 24px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.18)", fontSize: 22, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {post.day}
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 260, lineHeight: 0.5, height: 130, color: accent }}>“</span>
          <h2 style={{ margin: "20px 0 0", fontFamily: DISPLAY, fontWeight: 700, fontSize: headlineSize(headline, 0.92), lineHeight: 1.05 }}>
            {headline}
          </h2>
          <p style={{ margin: "28px 0 0", fontSize: subSize(subheadline), lineHeight: 1.45, color: "rgba(255,255,255,0.78)", maxWidth: 820 }}>
            {subheadline}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "20px 38px", borderRadius: 999, border: `2.5px solid ${accent}`, color: accent, fontSize: 28, fontWeight: 800 }}>
            {cta}
            <Arrow color={accent} />
          </span>
          <span style={{ fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{handle}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* 6 ─ Pôster Brutalista Clean: Tipografia impactante com marquee e moldura contemporânea */
function PosterTemplate({ post, profile, index }: TemplateProps) {
  const { primary, accent } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.categoryId, index);

  const onPrimary = readableOn(primary);
  const onAccent = readableOn(accent);
  const marquee = Array.from({ length: 6 }, () => `${post.theme}  ✦  ${handle}  ✦  `).join("");

  return (
    <Canvas style={{ background: primary, color: onPrimary }}>
      {/* Recorte de foto vertical */}
      <div style={abs({ top: 88, right: 88, width: 360, height: 460, borderRadius: 20, overflow: "hidden", border: `3px solid ${alpha(onPrimary, 0.2)}` })}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={headline}
          crossOrigin="anonymous"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div style={abs({ top: 88, left: 88, display: "flex", alignItems: "center", gap: 18 })}>
        <span style={{ padding: "12px 26px", borderRadius: 12, background: onPrimary, color: primary, fontSize: 26, fontWeight: 800 }}>
          {profile.name}
        </span>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.8 }}>
          {post.day}
        </span>
      </div>

      <div style={abs({ left: 88, right: 88, bottom: 230, display: "flex", flexDirection: "column" })}>
        <h2 style={{ margin: 0, maxWidth: 840, fontFamily: DISPLAY, fontWeight: 800, fontSize: headlineSize(headline, 0.88), lineHeight: 0.98, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
          {headline}
        </h2>
        <p style={{ margin: "26px 0 0", fontSize: subSize(subheadline) - 4, lineHeight: 1.4, maxWidth: 760, opacity: 0.85 }}>
          {subheadline}
        </p>
      </div>

      {/* Faixa Marquee */}
      <div style={abs({ left: -60, right: -60, bottom: 80, height: 90, background: accent, color: onAccent, transform: "rotate(-2.5deg)", display: "flex", alignItems: "center", overflow: "hidden", whiteSpace: "pre", fontFamily: DISPLAY, fontSize: 32, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" })}>
        {marquee}
      </div>
    </Canvas>
  );
}

const TEMPLATES = [
  EditorialTemplate,
  PolaroidTemplate,
  FullPhotoTemplate,
  PopBadgeTemplate,
  BlockTemplate,
  NightTemplate,
  PosterTemplate,
];

export function PostCanvas({
  ref,
  layout,
  ...props
}: TemplateProps & { layout: number; ref?: Ref<HTMLDivElement> }) {
  const Template = TEMPLATES[layout % TEMPLATES.length];
  return (
    <div ref={ref} style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
      <Template {...props} />
    </div>
  );
}

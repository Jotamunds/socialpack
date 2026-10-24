import type { CSSProperties, ReactNode, Ref } from "react";
import { INK, alpha, readableOn } from "@/lib/color";
import { getCuratedPhoto } from "@/lib/curated-images";
import type { CompanyProfile, GeneratedPost } from "@/lib/types";
import { Logo } from "@/components/Logo";

// Cada template é renderizado em tamanho real (1080x1080) e reduzido via CSS na prévia.
// Estilos inline garantem que a exportação PNG (html-to-image) fique 100% idêntica à prévia.

export const CANVAS_SIZE = 1080;

export const LAYOUT_NAMES = [
  "Editorial Kinfolk",
  "Moldura Polaroid",
  "Frase & Foto",
  "Cinema Moody",
  "Split Vertical",
  "Card Glassmorphism",
  "Pôster Brutalista",
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

/** Retorna foto curada por nicho e categoria */
export function getFallbackPhoto(nicheId?: string, categoryId?: string, index = 0): string {
  return getCuratedPhoto(nicheId, categoryId, index);
}

/* =========================================================================
   0 ─ EDITORIAL KINFOLK (Magazine Minimalista)
   Tipografia serifada elegante, espaçamento generoso, foto vertical assimétrica
   com moldura fina e micro-badges editoriais discretos no rodapé.
   ========================================================================= */
function EditorialTemplate({ post, profile, index }: TemplateProps) {
  const { primary, accent } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.nicheId, profile.categoryId, index);

  return (
    <Canvas style={{ background: "#faf8f5", color: INK }}>
      {/* Moldura editorial fina perimetral */}
      <div style={abs({ inset: 36, border: `1px solid ${alpha(INK, 0.12)}`, pointerEvents: "none" })} />

      {/* Topo Editorial: Marca com espaçamento e Tag do Dia */}
      <div
        style={abs({
          top: 64,
          left: 68,
          right: 68,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${alpha(INK, 0.08)}`,
          paddingBottom: 24,
        })}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: primary,
          }}
        >
          {profile.name}
        </span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: alpha(INK, 0.55),
          }}
        >
          VOL. 01 · {post.day}
        </span>
      </div>

      {/* Bloco Fotográfico Assimétrico à Direita */}
      <div
        style={abs({
          top: 154,
          right: 68,
          width: 450,
          height: 680,
          borderRadius: 8,
          overflow: "hidden",
          border: `1px solid ${alpha(INK, 0.15)}`,
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.12)",
        })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={headline}
          crossOrigin="anonymous"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={abs({
            bottom: 20,
            left: 20,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(6px)",
            padding: "8px 20px",
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: INK,
          })}
        >
          {post.theme}
        </div>
      </div>

      {/* Coluna Tipográfica à Esquerda */}
      <div
        style={abs({
          top: 170,
          left: 68,
          width: 440,
          bottom: 160,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        })}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <span style={{ width: 36, height: 1.5, background: accent }} />
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: accent,
            }}
          >
            CURADORIA
          </span>
        </div>

        <h2
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: headlineSize(headline, 0.8),
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            color: INK,
          }}
        >
          {headline}
        </h2>

        <p
          style={{
            margin: "24px 0 0",
            fontSize: subSize(subheadline) - 4,
            lineHeight: 1.5,
            color: alpha(INK, 0.72),
          }}
        >
          {subheadline}
        </p>

        <div style={{ marginTop: 36 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontSize: 22,
              fontWeight: 800,
              color: primary,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {cta}
            <Arrow color={primary} size={22} />
          </span>
        </div>
      </div>

      {/* Rodapé Editorial com Micro-badges */}
      <div
        style={abs({
          left: 68,
          right: 68,
          bottom: 54,
          paddingTop: 20,
          borderTop: `1px solid ${alpha(INK, 0.08)}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: alpha(INK, 0.45),
            }}
          >
            EDIÇÃO ESPECIAL //
          </span>
          <Logo variant="without-borders" href={null} className="w-4 h-4 opacity-70" />
        </div>
        <span style={{ fontSize: 20, fontWeight: 600, color: alpha(INK, 0.6) }}>{handle}</span>
      </div>
    </Canvas>
  );
}

/* =========================================================================
   1 ─ MOLDURA POLAROID (Lifestyle Memory)
   Estilo fotográfico clássico com moldura branca, textura e fita adesiva
   ========================================================================= */
function PolaroidTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.nicheId, profile.categoryId, index);

  return (
    <Canvas
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        color: INK,
      }}
    >
      {/* Padrão geométrico de fundo */}
      <div
        style={abs({
          inset: 0,
          backgroundImage: `radial-gradient(${alpha("#ffffff", 0.12)} 2px, transparent 2px)`,
          backgroundSize: "32px 32px",
        })}
      />

      {/* Cartão Polaroid Central */}
      <div
        style={abs({
          top: 60,
          left: 100,
          right: 100,
          bottom: 70,
          background: "#ffffff",
          borderRadius: 24,
          padding: "36px 36px 40px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 35px 80px -20px rgba(0,0,0,0.4)",
        })}
      >
        {/* Fita adesiva simulada no topo */}
        <div
          style={abs({
            top: -18,
            left: "50%",
            transform: "translateX(-50%)",
            width: 140,
            height: 36,
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(4px)",
            borderRadius: 4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          })}
        />

        {/* Foto da Polaroid */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 520,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={headline}
            crossOrigin="anonymous"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <span
            style={abs({
              bottom: 18,
              left: 18,
              background: "rgba(0,0,0,0.75)",
              color: "#ffffff",
              padding: "6px 18px",
              borderRadius: 999,
              fontSize: 18,
              fontWeight: 700,
            })}
          >
            {post.day}
          </span>
        </div>

        {/* Textos */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            marginTop: 22,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: headlineSize(headline, 0.76),
              lineHeight: 1.08,
              color: INK,
            }}
          >
            {headline}
          </h2>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: subSize(subheadline) - 4,
              lineHeight: 1.35,
              color: "#6e6e73",
            }}
          >
            {subheadline}
          </p>
        </div>

        {/* Barra inferior */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #e5e5ea",
            paddingTop: 16,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: primary,
              textTransform: "uppercase",
            }}
          >
            {cta}
          </span>
          <span style={{ fontSize: 20, fontWeight: 600, color: "#86868b" }}>{handle}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* =========================================================================
   2 ─ FRASE & FOTO MINIMAL
   Fundo escuro profundo com citação marcante e foto em overlay sutil
   ========================================================================= */
function FullPhotoTemplate({ post, profile, index }: TemplateProps) {
  const { accent } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.nicheId, profile.categoryId, index);

  return (
    <Canvas style={{ background: "#0e0f12", color: "#ffffff" }}>
      {/* Imagem de fundo estilizada em overlay */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt={headline}
        crossOrigin="anonymous"
        style={abs({
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.28,
          filter: "contrast(115%)",
        })}
      />

      <div
        style={abs({
          inset: 0,
          padding: 80,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        })}
      >
        {/* Topo */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              padding: "10px 26px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              fontSize: 22,
              fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {profile.name}
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            {post.day}
          </span>
        </div>

        {/* Centro com Aspas Gigantes */}
        <div style={{ maxWidth: 900 }}>
          <span
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 220,
              lineHeight: 0.4,
              height: 100,
              display: "block",
              color: accent,
            }}
          >
            “
          </span>
          <span
            style={{
              display: "inline-block",
              padding: "6px 18px",
              borderRadius: 999,
              background: accent,
              color: readableOn(accent),
              fontSize: 18,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 20,
            }}
          >
            {post.theme}
          </span>
          <h2
            style={{
              margin: 0,
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: headlineSize(headline, 0.9),
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
            }}
          >
            {headline}
          </h2>
          <p
            style={{
              margin: "24px 0 0",
              fontSize: subSize(subheadline),
              lineHeight: 1.4,
              opacity: 0.85,
            }}
          >
            {subheadline}
          </p>
        </div>

        {/* Base */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "20px 38px",
              borderRadius: 999,
              background: accent,
              color: readableOn(accent),
              fontSize: 26,
              fontWeight: 800,
              boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
            }}
          >
            {cta}
            <Arrow color={readableOn(accent)} size={24} />
          </span>
          <span style={{ fontSize: 22, fontWeight: 600, opacity: 0.85 }}>{handle}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* =========================================================================
   3 ─ FULL BLEED / CINEMA MOODY (Substituindo Selo Pop)
   A foto ocupa 100% da área (1080x1080px), gradiente escuro profissional no rodapé
   e tipografia branca de altíssimo contraste e legibilidade impecável.
   ========================================================================= */
function CinemaMoodyTemplate({ post, profile, index }: TemplateProps) {
  const { accent } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.nicheId, profile.categoryId, index);

  return (
    <Canvas style={{ background: "#000000", color: "#ffffff" }}>
      {/* Foto 100% Full Bleed */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt={headline}
        crossOrigin="anonymous"
        style={abs({ inset: 0, width: "100%", height: "100%", objectFit: "cover" })}
      />

      {/* Gradiente sutil no topo para nitidez do badge da marca */}
      <div
        style={abs({
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
        })}
      />

      {/* Gradiente de sombra cinematográfica no rodapé */}
      <div
        style={abs({
          bottom: 0,
          left: 0,
          right: 0,
          height: 720,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.2) 75%, transparent 100%)",
        })}
      />

      {/* Topo: Marca e Dia */}
      <div
        style={abs({
          top: 64,
          left: 72,
          right: 72,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span
          style={{
            padding: "10px 24px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.25)",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          {profile.name}
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          {post.day}
        </span>
      </div>

      {/* Textos Brancos Sobrepostos com Alto Contraste */}
      <div
        style={abs({
          left: 72,
          right: 72,
          bottom: 64,
          display: "flex",
          flexDirection: "column",
        })}
      >
        <span
          style={{
            display: "inline-block",
            padding: "6px 20px",
            borderRadius: 999,
            background: accent,
            color: readableOn(accent),
            fontSize: 18,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: 20,
            alignSelf: "flex-start",
          }}
        >
          {post.theme}
        </span>

        <h2
          style={{
            margin: 0,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: headlineSize(headline, 0.94),
            lineHeight: 1.04,
            letterSpacing: "-0.025em",
            color: "#ffffff",
          }}
        >
          {headline}
        </h2>

        <p
          style={{
            margin: "20px 0 32px",
            fontSize: subSize(subheadline),
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.9)",
            maxWidth: 900,
          }}
        >
          {subheadline}
        </p>

        {/* Rodapé com CTA de impacto e Handle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 38px",
              borderRadius: 999,
              background: "#ffffff",
              color: "#000000",
              fontSize: 24,
              fontWeight: 800,
              boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
            }}
          >
            {cta}
            <Arrow color="#000000" size={24} />
          </span>
          <span style={{ fontSize: 22, fontWeight: 600, opacity: 0.9 }}>{handle}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* =========================================================================
   4 ─ SPLIT VERTICAL / BLOCO ARQUITETÔNICO
   Divisão 50/50 vertical: foto contínua de alto a baixo de um lado,
   bloco de cor sólida fosca com tipografia limpa do outro.
   ========================================================================= */
function SplitVerticalTemplate({ post, profile, index }: TemplateProps) {
  const { primary, accent } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.nicheId, profile.categoryId, index);

  const onPrimary = readableOn(primary);

  return (
    <Canvas style={{ background: primary, color: onPrimary }}>
      {/* Coluna Esquerda: Foto Contínua 50% de alto a baixo */}
      <div
        style={abs({
          top: 0,
          left: 0,
          width: 520,
          height: CANVAS_SIZE,
          overflow: "hidden",
        })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={headline}
          crossOrigin="anonymous"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Badge do dia flutuante sobre a foto */}
        <div
          style={abs({
            top: 54,
            left: 48,
            padding: "8px 20px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          })}
        >
          {post.day}
        </div>
      </div>

      {/* Coluna Direita: Bloco Fosco com Tipografia Arquitetônica */}
      <div
        style={abs({
          top: 0,
          right: 0,
          width: 560,
          height: CANVAS_SIZE,
          padding: "72px 54px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        })}
      >
        {/* Topo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 26, fontWeight: 800 }}>{profile.name}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                opacity: 0.75,
              }}
            >
              ARQUITETURA //
            </span>
            <Logo variant="without-borders" href={null} className="w-4 h-4 opacity-70" />
          </div>
        </div>

        {/* Centro */}
        <div>
          <div
            style={{
              width: 44,
              height: 4,
              borderRadius: 2,
              background: accent,
              marginBottom: 18,
            }}
          />
          <span
            style={{
              display: "block",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: accent,
              marginBottom: 16,
            }}
          >
            {post.theme}
          </span>
          <h2
            style={{
              margin: 0,
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: headlineSize(headline, 0.78),
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
            }}
          >
            {headline}
          </h2>
          <p
            style={{
              margin: "20px 0 0",
              fontSize: subSize(subheadline) - 4,
              lineHeight: 1.45,
              opacity: 0.88,
            }}
          >
            {subheadline}
          </p>
        </div>

        {/* Rodapé */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 32px",
              borderRadius: 999,
              background: accent,
              color: readableOn(accent),
              fontSize: 22,
              fontWeight: 800,
              alignSelf: "flex-start",
            }}
          >
            {cta}
            <Arrow color={readableOn(accent)} size={20} />
          </span>
          <span style={{ fontSize: 20, fontWeight: 600, opacity: 0.75 }}>{handle}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* =========================================================================
   5 ─ CARD GLASSMORPHISM / IOS NOTE
   Fundo com a foto em blur/ambient light sutil.
   Card central translúcido com borda suave (backdrop-blur-md bg-white/80 border border-white/20)
   contendo frase/oferta no estilo widgets premium do iOS.
   ========================================================================= */
function GlassmorphismTemplate({ post, profile, index }: TemplateProps) {
  const { primary } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.nicheId, profile.categoryId, index);

  return (
    <Canvas style={{ background: "#1c1c1e", color: INK }}>
      {/* Fundo com a foto em blur ambiental de alta intensidade */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt={headline}
        crossOrigin="anonymous"
        style={abs({
          inset: -40,
          width: "calc(100% + 80px)",
          height: "calc(100% + 80px)",
          objectFit: "cover",
          filter: "blur(32px) brightness(0.65) saturate(1.3)",
        })}
      />

      {/* Luz ambiente suave */}
      <div
        style={abs({
          inset: 0,
          background: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.18), transparent 75%)",
        })}
      />

      {/* Card Central Translúcido (Widget iOS Note) */}
      <div
        style={abs({
          top: 85,
          left: 80,
          right: 80,
          bottom: 85,
          background: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(24px)",
          border: "2px solid rgba(255, 255, 255, 0.4)",
          borderRadius: 44,
          padding: "54px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 35px 80px -20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6)",
        })}
      >
        {/* Cabeçalho do Card */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: primary,
                boxShadow: `0 0 12px ${alpha(primary, 0.6)}`,
              }}
            />
            <span style={{ fontSize: 24, fontWeight: 800, color: INK }}>{profile.name}</span>
          </div>
          <span
            style={{
              padding: "8px 22px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.08)",
              fontSize: 18,
              fontWeight: 700,
              color: "#6e6e73",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {post.day}
          </span>
        </div>

        {/* Mensagem e Tipografia */}
        <div style={{ padding: "10px 0" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: primary,
              marginBottom: 16,
            }}
          >
            {post.theme}
          </span>
          <h2
            style={{
              margin: 0,
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: headlineSize(headline, 0.88),
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              color: INK,
            }}
          >
            {headline}
          </h2>
          <p
            style={{
              margin: "20px 0 0",
              fontSize: subSize(subheadline),
              lineHeight: 1.45,
              color: "#48484a",
              maxWidth: 780,
            }}
          >
            {subheadline}
          </p>
        </div>

        {/* Rodapé iOS Action */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "18px 36px",
              borderRadius: 999,
              background: primary,
              color: readableOn(primary),
              fontSize: 22,
              fontWeight: 800,
              boxShadow: "0 12px 28px -6px rgba(0,0,0,0.25)",
            }}
          >
            {cta}
            <Arrow color={readableOn(primary)} size={22} />
          </span>
          <span style={{ fontSize: 22, fontWeight: 600, color: "#8e8e93" }}>{handle}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* =========================================================================
   6 ─ CORREÇÃO DO PÔSTER BRUTALISTA
   Foto nítida em container centralizado de largura total (sem ficar espremida no canto),
   paddings do topo ajustados sem colisão com controles do canvas,
   e fita adesiva amarela/preta de assinatura no rodapé preservada.
   ========================================================================= */
function BrutalistPosterTemplate({ post, profile, index }: TemplateProps) {
  const { primary } = profile.colors;
  const headline = post.customHeadline || post.headline;
  const subheadline = post.customSubheadline || post.subheadline;
  const cta = post.customCta || post.cta;
  const handle = post.customHandle || handleOf(profile);
  const photo = post.imageUrl || getFallbackPhoto(profile.nicheId, profile.categoryId, index);

  const onPrimary = readableOn(primary);
  const marquee = Array.from(
    { length: 6 },
    () => `✦  ${post.theme.toUpperCase()}  ✦  ${profile.name.toUpperCase()}  ✦  ${cta.toUpperCase()}  ✦  ${handle}  `,
  ).join("");

  return (
    <Canvas style={{ background: primary, color: onPrimary }}>
      {/* Topo com Espaçamento Amplo (Sem colisão com dashboard) */}
      <div
        style={abs({
          top: 52,
          left: 64,
          right: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            background: onPrimary,
            color: primary,
            fontSize: 24,
            fontWeight: 900,
            border: "3px solid #000000",
            boxShadow: "4px 4px 0 #000000",
          }}
        >
          {profile.name}
        </span>
        <span
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            background: "#ffe600",
            color: "#000000",
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            border: "3px solid #000000",
            boxShadow: "4px 4px 0 #000000",
          }}
        >
          {post.day}
        </span>
      </div>

      {/* Bloco Fotográfico Nítido e Amplo (952px de largura, sem miniatura no canto) */}
      <div
        style={abs({
          top: 130,
          left: 64,
          right: 64,
          height: 420,
          borderRadius: 16,
          overflow: "hidden",
          border: "3.5px solid #000000",
          boxShadow: "6px 6px 0 #000000",
        })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={headline}
          crossOrigin="anonymous"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Selo do tema no canto da foto */}
        <div
          style={abs({
            bottom: 16,
            left: 16,
            background: "#000000",
            color: "#ffffff",
            padding: "6px 18px",
            borderRadius: 6,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          })}
        >
          {post.theme}
        </div>
      </div>

      {/* Conteúdo Tipográfico de Alto Impacto */}
      <div
        style={abs({
          left: 64,
          right: 64,
          top: 576,
          display: "flex",
          flexDirection: "column",
        })}
      >
        <h2
          style={{
            margin: 0,
            maxWidth: 950,
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: headlineSize(headline, 0.86),
            lineHeight: 0.98,
            letterSpacing: "-0.025em",
            textTransform: "uppercase",
            color: onPrimary,
          }}
        >
          {headline}
        </h2>
        <p
          style={{
            margin: "18px 0 0",
            fontSize: subSize(subheadline) - 4,
            lineHeight: 1.35,
            maxWidth: 880,
            opacity: 0.9,
            color: onPrimary,
          }}
        >
          {subheadline}
        </p>
      </div>

      {/* Fita Adesiva Amarela/Preta de Assinatura no Rodapé */}
      <div
        style={abs({
          left: -40,
          right: -40,
          bottom: 38,
          height: 76,
          background: "#ffe600",
          color: "#000000",
          borderTop: "3.5px solid #000000",
          borderBottom: "3.5px solid #000000",
          transform: "rotate(-1.5deg)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          whiteSpace: "pre",
          fontFamily: DISPLAY,
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          boxShadow: "0 8px 16px rgba(0,0,0,0.35)",
        })}
      >
        {marquee}
      </div>
    </Canvas>
  );
}

const TEMPLATES = [
  EditorialTemplate,
  PolaroidTemplate,
  FullPhotoTemplate,
  CinemaMoodyTemplate,
  SplitVerticalTemplate,
  GlassmorphismTemplate,
  BrutalistPosterTemplate,
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

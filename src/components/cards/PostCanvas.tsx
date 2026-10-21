import type { CSSProperties, ReactNode, Ref } from "react";
import { INK, alpha, darken, lighten, mix, readableOn } from "@/lib/color";
import type { CompanyProfile, GeneratedPost } from "@/lib/types";

// Cada template é renderizado em tamanho real (1080x1080) e reduzido via CSS na prévia.
// Estilos inline garantem que a exportação PNG fique idêntica à prévia.

export const CANVAS_SIZE = 1080;

export const LAYOUT_NAMES = ["Gradiente", "Bloco", "Editorial", "Noite", "Pôster"];

type CardProfile = Pick<CompanyProfile, "name" | "instagram" | "colors">;

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
  const size = len <= 18 ? 124 : len <= 28 ? 108 : len <= 40 ? 92 : len <= 56 ? 80 : 68;
  return Math.round(size * factor);
}

function subSize(text: string) {
  const len = text.length;
  return len <= 70 ? 38 : len <= 110 ? 34 : 30;
}

const handleOf = (p: CardProfile) => (p.instagram ? `@${p.instagram}` : p.name);

function Arrow({ size = 30, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
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

/* 0 ─ Gradiente: degradê vibrante com brilhos e anel */
function GradientTemplate({ post, profile }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const mid = mix(primary, secondary, 0.5);
  const text = readableOn(mid);
  return (
    <Canvas style={{ background: `linear-gradient(140deg, ${primary} 0%, ${mid} 55%, ${secondary} 100%)`, color: text }}>
      <div style={abs({ width: 640, height: 640, borderRadius: "50%", background: alpha(accent, 0.55), filter: "blur(130px)", top: -200, right: -180 })} />
      <div style={abs({ width: 520, height: 520, borderRadius: "50%", background: alpha("#ffffff", 0.18), filter: "blur(120px)", bottom: -220, left: -160 })} />
      <div style={abs({ width: 780, height: 780, borderRadius: "50%", border: `2px solid ${alpha(text, 0.18)}`, right: -320, bottom: -320 })} />
      <div style={abs({ width: 560, height: 560, borderRadius: "50%", border: `2px solid ${alpha(text, 0.12)}`, right: -210, bottom: -210 })} />

      <div style={abs({ inset: 0, padding: 88, display: "flex", flexDirection: "column" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ padding: "14px 30px", borderRadius: 999, background: alpha(text, 0.12), border: `2px solid ${alpha(text, 0.25)}`, fontSize: 28, fontWeight: 700 }}>
            {profile.name}
          </span>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.8 }}>{post.day}</span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ alignSelf: "flex-start", padding: "10px 24px", borderRadius: 999, background: accent, color: readableOn(accent), fontSize: 24, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {post.theme}
          </span>
          <h2 style={{ margin: "36px 0 0", fontFamily: DISPLAY, fontWeight: 800, fontSize: headlineSize(post.headline), lineHeight: 1.02, letterSpacing: "-0.035em" }}>
            {post.headline}
          </h2>
          <p style={{ margin: "34px 0 0", fontSize: subSize(post.subheadline), lineHeight: 1.38, maxWidth: 840, opacity: 0.88 }}>{post.subheadline}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "26px 44px", borderRadius: 999, background: accent, color: readableOn(accent), fontSize: 32, fontWeight: 800, boxShadow: `0 24px 60px -20px ${alpha(INK, 0.5)}` }}>
            {post.cta}
            <Arrow color={readableOn(accent)} />
          </span>
          <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.85 }}>{handleOf(profile)}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* 1 ─ Bloco: número gigante vazado e bloco de cor com canto arredondado */
function BlockTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const onSecondary = readableOn(secondary);
  const onPrimary = readableOn(primary);
  return (
    <Canvas style={{ background: secondary, color: onSecondary }}>
      <div style={abs({ inset: 0, backgroundImage: `repeating-linear-gradient(45deg, ${alpha(onSecondary, 0.07)} 0 2px, transparent 2px 30px)` })} />
      <div style={abs({ top: -60, right: 40, fontFamily: DISPLAY, fontWeight: 800, fontSize: 470, lineHeight: 1, letterSpacing: "-0.06em", color: "transparent", WebkitTextStroke: `4px ${alpha(onSecondary, 0.4)}` })}>
        {String(index + 1).padStart(2, "0")}
      </div>

      <div style={abs({ top: 88, left: 88, display: "flex", flexDirection: "column", gap: 10 })}>
        <span style={{ fontSize: 30, fontWeight: 800 }}>{profile.name}</span>
        <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.7 }}>{post.day}</span>
      </div>

      <div style={abs({ left: 0, bottom: 0, width: 960, height: 660, background: primary, color: onPrimary, borderTopRightRadius: 160, padding: "84px 88px", display: "flex", flexDirection: "column", boxShadow: `0 -30px 80px -30px ${alpha(INK, 0.45)}` })}>
        <span style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 24, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: readableOn(primary) === INK ? darken(accent, 0.35) : lighten(accent, 0.2) }}>
          <span style={{ width: 56, height: 5, borderRadius: 4, background: "currentColor" }} />
          {post.theme}
        </span>
        <h2 style={{ margin: "30px 0 0", fontFamily: DISPLAY, fontWeight: 800, fontSize: headlineSize(post.headline, 0.86), lineHeight: 1.04, letterSpacing: "-0.03em" }}>
          {post.headline}
        </h2>
        <p style={{ margin: "26px 0 0", fontSize: subSize(post.subheadline) - 2, lineHeight: 1.4, opacity: 0.85, maxWidth: 760 }}>{post.subheadline}</p>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 800 }}>
          {post.cta}
          <span style={{ fontSize: 26, fontWeight: 500, opacity: 0.7 }}>· {handleOf(profile)}</span>
        </div>
      </div>

      <div style={abs({ right: 68, bottom: 540, width: 170, height: 170, borderRadius: "50%", background: accent, display: "grid", placeItems: "center", boxShadow: `0 30px 60px -20px ${alpha(INK, 0.5)}` })}>
        <Arrow size={64} color={readableOn(accent)} />
      </div>
    </Canvas>
  );
}

/* 2 ─ Editorial: fundo claro, moldura fina e título serifado */
function EditorialTemplate({ post, profile, index }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const strong = readableOn(primary) === INK ? darken(primary, 0.45) : primary;
  return (
    <Canvas style={{ background: mix("#faf8f3", primary, 0.05), color: INK }}>
      <div style={abs({ width: 640, height: 640, borderRadius: "50%", background: alpha(secondary, 0.14), top: -220, right: -200 })} />
      <div style={abs({ width: 300, height: 300, borderRadius: "50%", background: alpha(accent, 0.18), bottom: -120, left: -90 })} />
      <div style={abs({ inset: 44, border: `3px solid ${strong}` })} />

      <div style={abs({ inset: 44, padding: "72px 76px", display: "flex", flexDirection: "column" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase" }}>
          <span style={{ color: strong }}>{profile.name}</span>
          <span style={{ color: alpha(INK, 0.55), letterSpacing: "0.18em" }}>
            Nº {String(index + 1).padStart(2, "0")} — {post.day}
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 38, color: strong }}>{post.theme}</span>
          <div style={{ width: 120, height: 8, borderRadius: 8, background: accent, margin: "26px 0 34px" }} />
          <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 700, fontSize: headlineSize(post.headline, 0.92), lineHeight: 1.08, letterSpacing: "-0.02em" }}>
            {post.headline}
          </h2>
          <p style={{ margin: "34px 0 0", fontSize: subSize(post.subheadline), lineHeight: 1.45, color: alpha(INK, 0.66), maxWidth: 800 }}>{post.subheadline}</p>
        </div>

        <div style={{ borderTop: `2px solid ${alpha(INK, 0.12)}`, paddingTop: 34, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: strong }}>
            {post.cta}
            <Arrow color={strong} />
          </span>
          <span style={{ fontSize: 26, fontWeight: 600, color: alpha(INK, 0.6) }}>{handleOf(profile)}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* 3 ─ Noite: fundo escuro, brilhos coloridos, malha de pontos e aspas gigantes */
function NightTemplate({ post, profile }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const glowAccent = readableOn(accent) === INK ? accent : lighten(accent, 0.35);
  return (
    <Canvas style={{ background: mix("#09090f", primary, 0.1), color: "#ffffff" }}>
      <div style={abs({ width: 700, height: 700, borderRadius: "50%", background: alpha(primary, 0.6), filter: "blur(150px)", top: -260, left: -220 })} />
      <div style={abs({ width: 620, height: 620, borderRadius: "50%", background: alpha(secondary, 0.5), filter: "blur(150px)", bottom: -260, right: -200 })} />
      <div style={abs({ inset: 0, backgroundImage: `radial-gradient(${alpha("#ffffff", 0.13)} 1.6px, transparent 1.6px)`, backgroundSize: "38px 38px" })} />

      <div style={abs({ inset: 0, padding: 88, display: "flex", flexDirection: "column" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 700 }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: glowAccent, boxShadow: `0 0 24px ${glowAccent}` }} />
            {profile.name}
          </span>
          <span style={{ padding: "12px 26px", borderRadius: 999, background: alpha("#ffffff", 0.08), border: `2px solid ${alpha("#ffffff", 0.14)}`, fontSize: 24, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            {post.day}
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 300, lineHeight: 0.6, height: 150, color: glowAccent }}>“</span>
          <h2 style={{ margin: "20px 0 0", fontFamily: DISPLAY, fontWeight: 700, fontSize: headlineSize(post.headline, 0.94), lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            {post.headline}
          </h2>
          <p style={{ margin: "34px 0 0", fontSize: subSize(post.subheadline), lineHeight: 1.45, color: alpha("#ffffff", 0.72), maxWidth: 820 }}>{post.subheadline}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "22px 40px", borderRadius: 999, border: `3px solid ${glowAccent}`, color: glowAccent, fontSize: 30, fontWeight: 800 }}>
            {post.cta}
            <Arrow color={glowAccent} />
          </span>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: alpha("#ffffff", 0.5) }}>{post.theme}</span>
        </div>
      </div>
    </Canvas>
  );
}

/* 4 ─ Pôster: geometria ousada, selo de CTA girado e faixa com marquee */
function PosterTemplate({ post, profile }: TemplateProps) {
  const { primary, secondary, accent } = profile.colors;
  const onPrimary = readableOn(primary);
  const onAccent = readableOn(accent);
  const marquee = Array.from({ length: 6 }, () => `${post.theme}  ✦  ${handleOf(profile)}  ✦  `).join("");
  return (
    <Canvas style={{ background: primary, color: onPrimary }}>
      <div style={abs({ width: 700, height: 700, borderRadius: "50%", background: secondary, top: -270, right: -250 })} />
      <div style={abs({ width: 420, height: 420, borderRadius: "50%", border: `3px dashed ${alpha(readableOn(secondary), 0.35)}`, top: -130, right: -110 })} />

      <div style={abs({ top: 200, right: 120, width: 240, height: 240, borderRadius: "50%", background: accent, color: onAccent, display: "grid", placeItems: "center", textAlign: "center", padding: 30, transform: "rotate(12deg)", boxShadow: `0 30px 70px -25px ${alpha(INK, 0.6)}` })}>
        <span style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 800, lineHeight: 1.1, textTransform: "uppercase" }}>{post.cta}</span>
      </div>

      <div style={abs({ top: 88, left: 88, display: "flex", alignItems: "center", gap: 20 })}>
        <span style={{ padding: "12px 26px", borderRadius: 14, background: onPrimary, color: primary, fontSize: 26, fontWeight: 800 }}>{profile.name}</span>
        <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.75 }}>{post.day}</span>
      </div>

      <div style={abs({ left: 88, right: 88, bottom: 250, display: "flex", flexDirection: "column" })}>
        <h2 style={{ margin: 0, maxWidth: 860, fontFamily: DISPLAY, fontWeight: 800, fontSize: headlineSize(post.headline, 0.86), lineHeight: 0.98, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
          {post.headline}
        </h2>
        <p style={{ margin: "30px 0 0", fontSize: subSize(post.subheadline) - 2, lineHeight: 1.4, maxWidth: 780, opacity: 0.85 }}>{post.subheadline}</p>
      </div>

      <div style={abs({ left: -60, right: -60, bottom: 96, height: 96, background: accent, color: onAccent, transform: "rotate(-3deg)", display: "flex", alignItems: "center", overflow: "hidden", whiteSpace: "pre", fontFamily: DISPLAY, fontSize: 34, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" })}>
        {marquee}
      </div>
    </Canvas>
  );
}

const TEMPLATES = [GradientTemplate, BlockTemplate, EditorialTemplate, NightTemplate, PosterTemplate];

export function PostCanvas({ ref, layout, ...props }: TemplateProps & { layout: number; ref?: Ref<HTMLDivElement> }) {
  const Template = TEMPLATES[layout % TEMPLATES.length];
  return (
    <div ref={ref} style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
      <Template {...props} />
    </div>
  );
}

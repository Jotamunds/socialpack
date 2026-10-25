/**
 * Gera os PNGs de docs/layouts-preview (7 layouts × 2 paletas).
 * Uso: npx tsx scripts/render-layout-previews.ts
 * MAX=1 grava também o stress de texto máximo em /tmp/layout-max.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderPostToPngBuffer } from "../src/lib/rendering/satori-renderer";
import type { CompanyProfile, GeneratedPost } from "../src/lib/types";

const PHOTO_URL = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=75";

const palettes = {
  pastel: { primary: "#8FB8E8", secondary: "#F3B7C8", accent: "#B7E0C4" },
  dark: { primary: "#4C1D95", secondary: "#E11D48", accent: "#F59E0B" },
} as const;

const examples: Pick<GeneratedPost, "theme" | "headline" | "subheadline" | "cta" | "badgeText">[] = [
  {
    theme: "Mito ou verdade",
    badgeText: "Mito ou verdade",
    headline: "Mito ou verdade? A gente responde",
    subheadline: "Tem muita informação solta por aí. Hoje a Empresa Exemplo esclarece uma dúvida comum.",
    cta: "Tire sua dúvida",
  },
  {
    theme: "Primeira visita",
    badgeText: "Primeira visita",
    headline: "Primeira vez por aqui?",
    subheadline: "Do primeiro contato ao resultado: simples e sem surpresas.",
    cta: "Comece agora",
  },
  {
    theme: "Agradecimento",
    badgeText: "Agradecimento",
    headline: "Obrigado por estar com a gente",
    subheadline: "Cada cliente que volta é o motivo de seguirmos crescendo em Recife.",
    cta: "Siga com a gente",
  },
  {
    theme: "Perguntas frequentes",
    badgeText: "Perguntas frequentes",
    headline: "As dúvidas que mais recebemos",
    subheadline: "Separamos as perguntas mais comuns para você decidir com tranquilidade.",
    cta: "Pergunte também",
  },
  {
    theme: "Como funciona",
    badgeText: "Como funciona",
    headline: "Primeira vez na Empresa Exemplo?",
    subheadline: "Você chama no direct. Entendemos sua necessidade. Cuidamos de cada detalhe.",
    cta: "Comece agora",
  },
  {
    theme: "Nossos valores",
    badgeText: "Nossos valores",
    headline: "No que a Empresa Exemplo acredita",
    subheadline: "Transparência em cada conversa. Respeito pelo seu tempo. Capricho em cada detalhe.",
    cta: "Conheça nossa história",
  },
  {
    theme: "Mito ou verdade",
    badgeText: "Mito ou verdade",
    headline: "Mito? Verdade?",
    subheadline: "A gente responde a dúvida mais comum sobre o seu dia a dia.",
    cta: "Tire sua dúvida",
  },
];

function company(colors: CompanyProfile["colors"]): CompanyProfile {
  return {
    id: "preview",
    name: "Empresa Exemplo",
    categoryId: "servicos",
    nicheId: "arquitetura",
    city: "Recife",
    state: "PE",
    instagram: "empresaexemplo",
    toneId: "profissional",
    colors,
  };
}

function post(layout: number, copy: (typeof examples)[number], imageUrl: string, max = false): GeneratedPost {
  const headline = max
    ? "Atendimento completo para quem busca resultado de verdade hoje aqui."
    : copy.headline;
  const subheadline = max
    ? "Cada detalhe do caminho fica combinado antes, do primeiro contato ao retorno, sem letra miuda e sem pressa nenhuma hoje!"
    : copy.subheadline;
  const cta = max ? "Agende sua conversa completa" : copy.cta;
  const badgeText = max ? "Duvida da semana inteira" : copy.badgeText;
  return {
    id: "post-0-2026-10-26",
    day: "Segunda, 26/10",
    date: "2026-10-26",
    theme: copy.theme,
    badgeText,
    headline,
    subheadline,
    cta,
    caption: copy.subheadline,
    hashtags: [],
    layout,
    imageUrl,
  };
}

async function photoDataUrl() {
  const response = await fetch(PHOTO_URL);
  if (!response.ok) throw new Error(`Foto de preview indisponível: ${response.status}`);
  const type = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${type};base64,${buffer.toString("base64")}`;
}

async function main() {
  const imageUrl = await photoDataUrl();
  const outDir = path.join(process.cwd(), "docs", "layouts-preview");
  await mkdir(outDir, { recursive: true });
  const maxDir = "/tmp/layout-max";
  if (process.env.MAX === "1") await mkdir(maxDir, { recursive: true });

  for (const [name, colors] of Object.entries(palettes)) {
    for (let layout = 0; layout < 7; layout++) {
      const buffer = await renderPostToPngBuffer(post(layout, examples[layout], imageUrl), company(colors));
      const file = path.join(outDir, `${name}-L${layout}.png`);
      await writeFile(file, buffer);
      console.log(file, buffer.length);
      if (process.env.MAX === "1") {
        const maxBuffer = await renderPostToPngBuffer(
          post(layout, examples[layout], imageUrl, true),
          company(colors),
        );
        const maxFile = path.join(maxDir, `${name}-L${layout}.png`);
        await writeFile(maxFile, maxBuffer);
        console.log(maxFile, maxBuffer.length);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import fs from "node:fs";
import path from "node:path";
import React from "react";
import satori, { type Font } from "satori";
import { Resvg } from "@resvg/resvg-js";
import { PostCard } from "@/components/cards/PostCanvas";
import type { CompanyProfile, GeneratedPost } from "../types";

export const CANVAS_SIZE = 1080;

let cachedInter: Font[] | null = null;
let cachedLayoutFonts: Font[] | null = null;

/**
 * Carrega em memória os buffers das fontes Inter nos 4 pesos obrigatórios
 * (Regular 400, Medium 500, SemiBold 600 e Bold 700).
 */
export function loadInterFonts(): Font[] {
  if (cachedInter && cachedInter.length === 4) {
    return cachedInter;
  }

  const fontsDir = path.join(process.cwd(), "public", "fonts");

  const fontConfigs: { file: string; weight: Font["weight"] }[] = [
    { file: "Inter-Regular.ttf", weight: 400 },
    { file: "Inter-Medium.ttf", weight: 500 },
    { file: "Inter-SemiBold.ttf", weight: 600 },
    { file: "Inter-Bold.ttf", weight: 700 },
  ];

  try {
    cachedInter = fontConfigs.map(({ file, weight }) => {
      const filePath = path.join(fontsDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo de fonte não encontrado em ${filePath}`);
      }
      const data = fs.readFileSync(filePath);
      return {
        name: "Inter",
        data,
        weight,
        style: "normal" as const,
      };
    });

    return cachedInter;
  } catch (err) {
    console.error("Aviso: Falha ao carregar fontes locais do Inter:", err);
    throw err;
  }
}

/**
 * Fontes dos layouts L0–L6. As três famílias são do Google Fonts, sob a
 * SIL Open Font License 1.1 (texto em public/fonts/OFL.txt). Os arquivos
 * são subconjuntos latinos (contornos originais) para não versionar os
 * variáveis completos:
 * - Plus Jakarta Sans 400/500/600/700 — Tokotype
 * - Playfair Display 700, 900 e itálico 400 — Claus Eggers Sørensen
 * - Bricolage Grotesque 700/800 (opsz 14, wdth 100) — Atelier Triay
 * O preview usa os mesmos arquivos via @font-face, com o mesmo family name
 * que o Satori registra. `next/font` troca o nome da família, então o
 * canvas não passa por ele.
 */
export function loadLayoutFonts(): Font[] {
  if (cachedLayoutFonts && cachedLayoutFonts.length === 9) {
    return cachedLayoutFonts;
  }

  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const specs: { file: string; name: string; weight: Font["weight"]; style: Font["style"] }[] = [
    { file: "PlusJakartaSans-Regular.ttf", name: "Plus Jakarta Sans", weight: 400, style: "normal" },
    { file: "PlusJakartaSans-Medium.ttf", name: "Plus Jakarta Sans", weight: 500, style: "normal" },
    { file: "PlusJakartaSans-SemiBold.ttf", name: "Plus Jakarta Sans", weight: 600, style: "normal" },
    { file: "PlusJakartaSans-Bold.ttf", name: "Plus Jakarta Sans", weight: 700, style: "normal" },
    { file: "PlayfairDisplay-Bold.ttf", name: "Playfair Display", weight: 700, style: "normal" },
    { file: "PlayfairDisplay-Black.ttf", name: "Playfair Display", weight: 900, style: "normal" },
    { file: "PlayfairDisplay-Italic.ttf", name: "Playfair Display", weight: 400, style: "italic" },
    { file: "BricolageGrotesque-Bold.ttf", name: "Bricolage Grotesque", weight: 700, style: "normal" },
    { file: "BricolageGrotesque-ExtraBold.ttf", name: "Bricolage Grotesque", weight: 800, style: "normal" },
  ];

  cachedLayoutFonts = specs.map(({ file, name, weight, style }) => {
    const filePath = path.join(fontsDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de fonte não encontrado em ${filePath}`);
    }
    return {
      name,
      data: fs.readFileSync(filePath),
      weight,
      style,
    };
  });

  return cachedLayoutFonts;
}

export { sanitizePublicErrorMessage } from "../public-error";

/**
 * Busca uma imagem remota e a converte em base64 Data URL para inserção segura no Satori.
 * Caso a imagem falhe ou demore mais de 3.5s, retorna um gradiente/padrão SVG como fallback.
 */
export async function resolveImageAsDataUrl(
  imageUrl?: string,
  primaryColor = "#5e6ad2",
  secondaryColor = "#7170ff"
): Promise<string> {
  if (!imageUrl) {
    return createSvgFallbackPattern(primaryColor, secondaryColor);
  }

  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return createSvgFallbackPattern(primaryColor, secondaryColor);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return createSvgFallbackPattern(primaryColor, secondaryColor);
  }
}

function createSvgFallbackPattern(c1: string, c2: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="50%" stop-color="#0f1011" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="1080" height="1080" fill="url(#g)" />
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function editionIndex(post: GeneratedPost) {
  const match = /^post-(\d+)-/.exec(post.id || "");
  if (match) return Number(match[1]) % 7;
  return 0;
}

/**
 * O mesmo `PostCard` do preview. O Satori não aplica `backdrop-filter`
 * (o vidro do L5 é degradê + borda) e ignora `z-index` (a ordem do JSX pinta).
 */
export function buildSatoriPostElement(
  post: GeneratedPost,
  company: CompanyProfile,
  imageDataUrl: string
): React.ReactElement {
  const primary = company.colors?.primary || "#5e6ad2";
  const secondary = company.colors?.secondary || "#7170ff";
  const accent = company.colors?.accent || "#828fff";

  return React.createElement(PostCard, {
    layout: post.layout ?? 0,
    index: editionIndex(post),
    post: { ...post, imageUrl: imageDataUrl },
    profile: {
      name: company.name,
      instagram: company.instagram,
      colors: { primary, secondary, accent },
      categoryId: company.categoryId,
      nicheId: company.nicheId,
    },
  });
}

/**
 * Converte um post e os dados da empresa em um Buffer PNG de exatos 1080x1080px via Satori + Resvg.
 */
export async function renderPostToPngBuffer(
  post: GeneratedPost,
  company: CompanyProfile
): Promise<Buffer> {
  const fonts = loadLayoutFonts();
  const primary = company.colors?.primary || "#5e6ad2";
  const secondary = company.colors?.secondary || "#7170ff";

  const imageDataUrl = await resolveImageAsDataUrl(post.imageUrl, primary, secondary);
  const element = buildSatoriPostElement(post, company, imageDataUrl);

  const svg = await satori(element, {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: CANVAS_SIZE,
    },
    font: {
      loadSystemFonts: false,
    },
  });

  const pngData = resvg.render();
  return pngData.asPng();
}

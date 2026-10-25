import fs from "node:fs";
import path from "node:path";
import React from "react";
import satori, { type Font } from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { CompanyProfile, GeneratedPost } from "../types";

export const CANVAS_SIZE = 1080;

let cachedFonts: Font[] | null = null;

/**
 * Carrega em memória os buffers das fontes Inter nos 4 pesos obrigatórios
 * (Regular 400, Medium 500, SemiBold 600 e Bold 700).
 */
export function loadInterFonts(): Font[] {
  if (cachedFonts && cachedFonts.length === 4) {
    return cachedFonts;
  }

  const fontsDir = path.join(process.cwd(), "public", "fonts");

  const fontConfigs: { file: string; weight: Font["weight"] }[] = [
    { file: "Inter-Regular.ttf", weight: 400 },
    { file: "Inter-Medium.ttf", weight: 500 },
    { file: "Inter-SemiBold.ttf", weight: 600 },
    { file: "Inter-Bold.ttf", weight: 700 },
  ];

  try {
    cachedFonts = fontConfigs.map(({ file, weight }) => {
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

    return cachedFonts;
  } catch (err) {
    // Fallback de emergência caso ocorra algum erro na leitura dos arquivos de fontes locais
    console.error("Aviso: Falha ao carregar fontes locais do Inter:", err);
    throw err;
  }
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

  // Se já for data URL
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
    // Retorna gradiente estilizado seguro com as cores da marca
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

/**
 * Renderiza o template visual compatível com Satori aplicando estritamente Flexbox.
 */
export function buildSatoriPostElement(
  post: GeneratedPost,
  company: CompanyProfile,
  imageDataUrl: string
): React.ReactElement {
  const layout = (post.layout ?? 0) % 7;
  const primary = company.colors?.primary || "#5e6ad2";
  const secondary = company.colors?.secondary || "#7170ff";
  const accent = company.colors?.accent || "#828fff";
  const handle = company.instagram ? `@${company.instagram.replace(/^@+/, "")}` : company.name;

  // ---------------------------------------------------------------------------
  // LAYOUT 0: EDITORIAL KINFOLK
  // ---------------------------------------------------------------------------
  if (layout === 0) {
    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          width: 1080,
          height: 1080,
          backgroundColor: "#08090a",
          padding: 72,
          justifyContent: "space-between",
          color: "#f7f8f8",
        },
      },
      // Topo
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            paddingBottom: 24,
          },
        },
        React.createElement(
          "span",
          {
            style: {
              fontSize: 22,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 3,
              color: primary,
            },
          },
          post.theme || "EDITORIAL"
        ),
        React.createElement(
          "span",
          { style: { fontSize: 20, color: "#8a8f98", fontWeight: 500 } },
          company.city ? `${company.city} • ${post.day || ""}` : post.day || ""
        )
      ),
      // Centro (Imagem + Texto)
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "row",
            gap: 48,
            alignItems: "center",
            flex: 1,
            paddingTop: 36,
            paddingBottom: 36,
          },
        },
        // Coluna de Texto
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
            },
          },
          React.createElement(
            "h1",
            {
              style: {
                fontSize: 60,
                fontWeight: 700,
                lineHeight: 1.15,
                color: "#f7f8f8",
                marginBottom: 24,
              },
            },
            post.headline
          ),
          React.createElement(
            "p",
            {
              style: {
                fontSize: 26,
                lineHeight: 1.45,
                color: "#d0d6e0",
                fontWeight: 400,
                marginBottom: 32,
              },
            },
            post.subheadline
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                backgroundColor: primary,
                color: "#ffffff",
                paddingLeft: 32,
                paddingRight: 32,
                paddingTop: 16,
                paddingBottom: 16,
                borderRadius: 8,
                alignSelf: "flex-start",
                fontSize: 22,
                fontWeight: 600,
              },
            },
            post.cta || "Saiba mais"
          )
        ),
        // Coluna da Foto
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              width: 440,
              height: 600,
              borderRadius: 16,
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.12)",
            },
          },
          React.createElement("img", {
            src: imageDataUrl,
            width: 440,
            height: 600,
            style: { objectFit: "cover" },
          })
        )
      ),
      // Rodapé
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 24,
          },
        },
        React.createElement(
          "span",
          { style: { fontSize: 24, fontWeight: 700, color: "#f7f8f8" } },
          company.name
        ),
        React.createElement(
          "span",
          { style: { fontSize: 22, color: accent, fontWeight: 500 } },
          handle
        )
      )
    );
  }

  // ---------------------------------------------------------------------------
  // LAYOUT 1: MOLDURA POLAROID
  // ---------------------------------------------------------------------------
  if (layout === 1) {
    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          width: 1080,
          height: 1080,
          backgroundColor: "#0d0e12",
          padding: 64,
          alignItems: "center",
          justifyContent: "center",
        },
      },
      // Card Branco Polaroid
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            width: 920,
            height: 950,
            backgroundColor: "#ffffff",
            borderRadius: 16,
            padding: 36,
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            justifyContent: "space-between",
          },
        },
        // Foto Quadrada Polaroid
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              width: 848,
              height: 600,
              borderRadius: 8,
              overflow: "hidden",
              backgroundColor: "#1d1d1f",
            },
          },
          React.createElement("img", {
            src: imageDataUrl,
            width: 848,
            height: 600,
            style: { objectFit: "cover" },
          })
        ),
        // Área Inferior
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              paddingTop: 16,
              paddingBottom: 8,
            },
          },
          React.createElement(
            "h2",
            {
              style: {
                fontSize: 44,
                fontWeight: 700,
                color: "#1d1d1f",
                lineHeight: 1.2,
                marginBottom: 12,
              },
            },
            post.headline
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              },
            },
            React.createElement(
              "span",
              { style: { fontSize: 22, color: primary, fontWeight: 600 } },
              company.name
            ),
            React.createElement(
              "span",
              { style: { fontSize: 20, color: "#62666d", fontWeight: 500 } },
              handle
            )
          )
        )
      )
    );
  }

  // ---------------------------------------------------------------------------
  // LAYOUT 2: FRASE & FOTO (QUOTE)
  // ---------------------------------------------------------------------------
  if (layout === 2) {
    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          width: 1080,
          height: 1080,
          backgroundColor: "#08090a",
          padding: 80,
          justifyContent: "space-between",
          color: "#f7f8f8",
        },
      },
      // Aspas Decorativas Gigantes
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          },
        },
        React.createElement(
          "span",
          {
            style: {
              fontSize: 120,
              lineHeight: 0.8,
              fontWeight: 700,
              color: primary,
            },
          },
          "“"
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              width: 140,
              height: 140,
              borderRadius: 70,
              overflow: "hidden",
              border: `4px solid ${accent}`,
            },
          },
          React.createElement("img", {
            src: imageDataUrl,
            width: 140,
            height: 140,
            style: { objectFit: "cover" },
          })
        )
      ),
      // Frase Principal
      React.createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" } },
        React.createElement(
          "h1",
          {
            style: {
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#f7f8f8",
              marginBottom: 28,
            },
          },
          post.headline
        ),
        React.createElement(
          "p",
          {
            style: {
              fontSize: 30,
              color: "#d0d6e0",
              lineHeight: 1.4,
              fontWeight: 400,
            },
          },
          post.subheadline
        )
      ),
      // Rodapé com CTA e Assinatura
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 32,
          },
        },
        React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column" } },
          React.createElement(
            "span",
            { style: { fontSize: 26, fontWeight: 700, color: "#f7f8f8" } },
            company.name
          ),
          React.createElement(
            "span",
            { style: { fontSize: 20, color: "#8a8f98" } },
            company.city ? `${company.city} • ${handle}` : handle
          )
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              backgroundColor: primary,
              color: "#ffffff",
              paddingLeft: 36,
              paddingRight: 36,
              paddingTop: 16,
              paddingBottom: 16,
              borderRadius: 8,
              fontSize: 22,
              fontWeight: 600,
            },
          },
          post.cta || "Saiba mais"
        )
      )
    );
  }

  // ---------------------------------------------------------------------------
  // LAYOUT 3: CINEMA MOODY (16:9 Letterbox)
  // ---------------------------------------------------------------------------
  if (layout === 3) {
    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          width: 1080,
          height: 1080,
          backgroundColor: "#050506",
          justifyContent: "space-between",
        },
      },
      // Barra Superior Cinematográfica
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "40px 64px",
            color: "#8a8f98",
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: 2,
          },
        },
        React.createElement("span", null, company.name.toUpperCase()),
        React.createElement("span", { style: { color: primary } }, post.theme.toUpperCase())
      ),
      // Foto Central 16:9
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            width: 1080,
            height: 600,
            overflow: "hidden",
            position: "relative",
          },
        },
        React.createElement("img", {
          src: imageDataUrl,
          width: 1080,
          height: 600,
          style: { objectFit: "cover" },
        })
      ),
      // Barra Inferior com Textos
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            padding: "40px 64px 50px 64px",
          },
        },
        React.createElement(
          "h2",
          {
            style: {
              fontSize: 48,
              fontWeight: 700,
              color: "#f7f8f8",
              lineHeight: 1.2,
              marginBottom: 16,
            },
          },
          post.headline
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            },
          },
          React.createElement(
            "p",
            {
              style: {
                fontSize: 22,
                color: "#d0d6e0",
                maxWidth: 680,
              },
            },
            post.subheadline
          ),
          React.createElement(
            "span",
            {
              style: {
                fontSize: 22,
                fontWeight: 600,
                color: accent,
              },
            },
            handle
          )
        )
      )
    );
  }

  // ---------------------------------------------------------------------------
  // LAYOUT 4: SPLIT VERTICAL (50 / 50)
  // ---------------------------------------------------------------------------
  if (layout === 4) {
    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row",
          width: 1080,
          height: 1080,
          backgroundColor: "#08090a",
        },
      },
      // Metade Esquerda: Imagem
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            width: 540,
            height: 1080,
            overflow: "hidden",
          },
        },
        React.createElement("img", {
          src: imageDataUrl,
          width: 540,
          height: 1080,
          style: { objectFit: "cover" },
        })
      ),
      // Metade Direita: Bloco de Conteúdo
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            width: 540,
            height: 1080,
            backgroundColor: "#0f1011",
            padding: 64,
            justifyContent: "space-between",
            borderLeft: "2px solid rgba(255,255,255,0.08)",
          },
        },
        React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column" } },
          React.createElement(
            "span",
            {
              style: {
                fontSize: 20,
                color: primary,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: 36,
              },
            },
            post.theme
          ),
          React.createElement(
            "h2",
            {
              style: {
                fontSize: 52,
                fontWeight: 700,
                color: "#f7f8f8",
                lineHeight: 1.18,
                marginBottom: 24,
              },
            },
            post.headline
          ),
          React.createElement(
            "p",
            {
              style: {
                fontSize: 24,
                color: "#d0d6e0",
                lineHeight: 1.45,
                fontWeight: 400,
              },
            },
            post.subheadline
          )
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 20,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 32,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                backgroundColor: primary,
                color: "#ffffff",
                paddingLeft: 32,
                paddingRight: 32,
                paddingTop: 16,
                paddingBottom: 16,
                borderRadius: 8,
                fontSize: 22,
                fontWeight: 600,
                alignSelf: "flex-start",
              },
            },
            post.cta || "Saiba mais"
          ),
          React.createElement(
            "span",
            { style: { fontSize: 20, color: "#8a8f98" } },
            `${company.name} • ${handle}`
          )
        )
      )
    );
  }

  // ---------------------------------------------------------------------------
  // LAYOUT 5: CARD GLASSMORPHISM
  // ---------------------------------------------------------------------------
  if (layout === 5) {
    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          width: 1080,
          height: 1080,
          backgroundColor: "#08090a",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
      },
      // Imagem de Fundo Fullscreen
      React.createElement("img", {
        src: imageDataUrl,
        width: 1080,
        height: 1080,
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          objectFit: "cover",
          opacity: 0.75,
        },
      }),
      // Overlay Escurecido
      React.createElement("div", {
        style: {
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: 1080,
          height: 1080,
          backgroundColor: "rgba(8,9,10,0.6)",
        },
      }),
      // Card Glass Centralizado
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            width: 860,
            backgroundColor: "rgba(15,16,17,0.85)",
            border: "2px solid rgba(255,255,255,0.16)",
            borderRadius: 24,
            padding: 64,
            zIndex: 10,
          },
        },
        React.createElement(
          "span",
          {
            style: {
              fontSize: 20,
              fontWeight: 600,
              color: primary,
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 20,
            },
          },
          post.theme
        ),
        React.createElement(
          "h1",
          {
            style: {
              fontSize: 58,
              fontWeight: 700,
              color: "#f7f8f8",
              lineHeight: 1.15,
              marginBottom: 24,
            },
          },
          post.headline
        ),
        React.createElement(
          "p",
          {
            style: {
              fontSize: 26,
              color: "#d0d6e0",
              lineHeight: 1.45,
              marginBottom: 36,
            },
          },
          post.subheadline
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 28,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                backgroundColor: primary,
                color: "#ffffff",
                paddingLeft: 32,
                paddingRight: 32,
                paddingTop: 14,
                paddingBottom: 14,
                borderRadius: 8,
                fontSize: 20,
                fontWeight: 600,
              },
            },
            post.cta || "Saiba mais"
          ),
          React.createElement(
            "span",
            { style: { fontSize: 22, color: "#f7f8f8", fontWeight: 600 } },
            handle
          )
        )
      )
    );
  }

  // ---------------------------------------------------------------------------
  // LAYOUT 6: PÔSTER BRUTALISTA
  // ---------------------------------------------------------------------------
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: 1080,
        height: 1080,
        backgroundColor: "#0a0a0c",
        padding: 56,
        justifyContent: "space-between",
        border: `8px solid ${primary}`,
      },
    },
    // Topo Brutalista
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `4px solid ${primary}`,
          paddingBottom: 20,
        },
      },
      React.createElement(
        "span",
        {
          style: {
            fontSize: 26,
            fontWeight: 700,
            color: "#ffffff",
            backgroundColor: primary,
            padding: "6px 16px",
            textTransform: "uppercase",
          },
        },
        post.theme
      ),
      React.createElement(
        "span",
        { style: { fontSize: 24, fontWeight: 700, color: secondary } },
        company.name.toUpperCase()
      )
    ),
    // Foto com Moldura Marcante
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          width: 952,
          height: 480,
          border: "4px solid rgba(255,255,255,0.2)",
          overflow: "hidden",
          marginTop: 20,
          marginBottom: 20,
        },
      },
      React.createElement("img", {
        src: imageDataUrl,
        width: 952,
        height: 480,
        style: { objectFit: "cover" },
      })
    ),
    // Headline Brutalista
    React.createElement(
      "h1",
      {
        style: {
          fontSize: 54,
          fontWeight: 700,
          color: "#f7f8f8",
          lineHeight: 1.15,
          textTransform: "uppercase",
          marginBottom: 16,
        },
      },
      post.headline
    ),
    // Rodapé
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `4px solid ${primary}`,
          paddingTop: 20,
        },
      },
      React.createElement(
        "span",
        { style: { fontSize: 22, color: "#d0d6e0", fontWeight: 600 } },
        post.cta || "Fale conosco"
      ),
      React.createElement(
        "span",
        {
          style: {
            fontSize: 22,
            fontWeight: 700,
            color: "#ffffff",
            backgroundColor: "#1f2024",
            padding: "8px 18px",
            border: "1px solid rgba(255,255,255,0.2)",
          },
        },
        handle
      )
    )
  );
}

/**
 * Converte um post e os dados da empresa em um Buffer PNG de exatos 1080x1080px via Satori + Resvg.
 */
export async function renderPostToPngBuffer(
  post: GeneratedPost,
  company: CompanyProfile
): Promise<Buffer> {
  const fonts = loadInterFonts();
  const primary = company.colors?.primary || "#5e6ad2";
  const secondary = company.colors?.secondary || "#7170ff";

  // Busca a imagem curada ou gera fallback em base64
  const imageDataUrl = await resolveImageAsDataUrl(post.imageUrl, primary, secondary);

  // Constrói o JSX compatível com Flexbox
  const element = buildSatoriPostElement(post, company, imageDataUrl);

  // 1. Gera o SVG via Satori
  const svg = await satori(element, {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    fonts,
  });

  // 2. Converte o SVG para PNG via Resvg
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

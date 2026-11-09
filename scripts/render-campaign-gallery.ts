/**
 * Renderiza as 24 composições novas e monta uma galeria HTML local.
 * Uso: npx tsx scripts/render-campaign-gallery.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CAMPAIGN_LAYOUTS } from "../src/lib/campaign-layouts";
import { getPostDimensions, type PostFormat } from "../src/lib/post-format";
import { renderPostToPngBuffer } from "../src/lib/rendering/satori-renderer";
import type { CompanyProfile, GeneratedPost } from "../src/lib/types";

const outputDirectory = path.join(process.cwd(), "docs", "campaign-gallery");

const companies: CompanyProfile[] = [
  { id: "cafe", name: "Vértice Café", categoryId: "alimentacao", nicheId: "cafeteria", city: "Curitiba", state: "PR", instagram: "verticecafe", toneId: "acolhedor", colors: { primary: "#523A28", secondary: "#B96B37", accent: "#F3C774" } },
  { id: "clinica", name: "Clínica Aurora", categoryId: "beleza", nicheId: "clinica-de-estetica", city: "São Paulo", state: "SP", instagram: "clinicaaurora", toneId: "elegante", colors: { primary: "#6C405B", secondary: "#C882A0", accent: "#EED6B8" } },
  { id: "imovel", name: "Alameda Imóveis", categoryId: "servicos", nicheId: "imobiliaria", city: "Recife", state: "PE", instagram: "alamedaimoveis", toneId: "profissional", colors: { primary: "#123B5D", secondary: "#4C8AA6", accent: "#D8B878" } },
];

const contentByCategory = {
  promotion: { theme: "Oferta de novembro", headline: "Seu momento de aproveitar chegou", subheadline: "Condições especiais para escolher com calma, qualidade e atendimento próximo.", cta: "Aproveite hoje" },
  launch: { theme: "Novidade", headline: "Uma nova experiência para descobrir", subheadline: "Criamos cada detalhe para surpreender você desde o primeiro contato.", cta: "Conheça agora" },
  bundle: { theme: "Combo especial", headline: "Mais escolhas no mesmo combo", subheadline: "Seleção completa, praticidade e um cuidado pensado para sua rotina.", cta: "Ver o combo" },
  testimonial: { theme: "Depoimento", headline: "Quem escolheu, recomenda de verdade", subheadline: "Atendimento atencioso, resultado que apareceu e vontade de voltar sempre.", cta: "Venha viver isso" },
  institutional: { theme: "Nossa história", headline: "A gente acredita no cuidado em cada detalhe", subheadline: "Uma marca local, humana e comprometida com experiências que ficam.", cta: "Conheça nossa história" },
  education: { theme: "Dica prática", headline: "Três escolhas simples que fazem diferença", subheadline: "Comece pelo que funciona para você. Observe os detalhes. Conte com uma equipe que orienta.", cta: "Salve esta dica" },
  catalog: { theme: "Coleção", headline: "Escolhas para todos os seus momentos", subheadline: "Veja opções selecionadas para combinar qualidade, estilo e praticidade.", cta: "Ver catálogo" },
  seasonal: { theme: "Edição especial", headline: "Uma temporada para celebrar junto", subheadline: "Prepare momentos especiais com uma seleção feita para compartilhar.", cta: "Garanta o seu" },
} as const;

function postFor(layout: (typeof CAMPAIGN_LAYOUTS)[number], index: number, format: PostFormat): GeneratedPost {
  const content = contentByCategory[layout.category];
  const longCopy = layout.id === 24
    ? "Comece pelo que faz sentido para sua rotina, organize os próximos passos e mantenha a constância que transforma pequenas escolhas em grandes resultados."
    : content.subheadline;
  return {
    id: `post-${index}-2026-11-09`, day: "Segunda, 09/11", date: "2026-11-09", theme: content.theme,
    badgeText: content.theme, headline: content.headline, subheadline: longCopy, cta: content.cta,
    caption: `${content.headline}. ${longCopy}`, hashtags: ["#socialpack", "#negociolocal", "#conteudo"],
    layout: layout.id, layoutCategory: layout.category, format, generationSeed: "gallery-socialpack-2026",
  };
}

function pngDimensions(buffer: Buffer) {
  if (buffer.toString("ascii", 1, 4) !== "PNG") throw new Error("Renderer não retornou PNG.");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function galleryHtml(items: Array<{ file: string; name: string; category: string; style: string; format: PostFormat }>) {
  const cards = items.map((item) => `<figure><img src="${item.file}" alt="${item.name}" loading="lazy" /><figcaption><strong>${item.name}</strong><span>${item.category} · ${item.style}</span><small>${getPostDimensions(item.format).label}</small></figcaption></figure>`).join("\n");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>SocialPack — 24 novas composições</title><style>body{margin:0;background:#101116;color:#f7f7fb;font:15px Inter,system-ui,sans-serif}main{max-width:1440px;margin:auto;padding:48px 28px}h1{font:800 42px/1.05 system-ui;margin:0 0 12px}p{color:#a9acb8;max-width:760px;line-height:1.5}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px;margin-top:34px}figure{margin:0;background:#191b22;border:1px solid #2e313d;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}img{width:100%;height:290px;object-fit:contain;background:#07080a}figcaption{padding:14px;display:grid;gap:5px}strong{font-size:15px}span,small{color:#a9acb8;font-size:12px}small{color:#777b89}</style></head><body><main><h1>SocialPack — 24 novas composições</h1><p>Prévia renderizada pelo motor Satori + Resvg. A grade reúne oito categorias, três variações por categoria e os formatos quadrado, feed vertical e stories.</p><section>${cards}</section></main></body></html>`;
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const formats: PostFormat[] = ["square", "portrait", "story"];
  const items: Array<{ file: string; name: string; category: string; style: string; format: PostFormat }> = [];
  for (const [index, layout] of CAMPAIGN_LAYOUTS.entries()) {
    const format = formats[Math.floor(index / 8)];
    const company = companies[index % companies.length];
    const post = postFor(layout, index, format);
    const buffer = await renderPostToPngBuffer(post, company);
    const expected = getPostDimensions(format);
    const received = pngDimensions(buffer);
    if (received.width !== expected.width || received.height !== expected.height || buffer.length < 10_000) {
      throw new Error(`${layout.name}: PNG inválido (${received.width}×${received.height}, ${buffer.length} bytes)`);
    }
    const file = `${String(layout.id).padStart(2, "0")}-${layout.category}.png`;
    await writeFile(path.join(outputDirectory, file), buffer);
    items.push({ file, name: layout.name, category: layout.category, style: layout.style, format });
    console.log(`${file} ${received.width}x${received.height} ${buffer.length}`);
  }
  await writeFile(path.join(outputDirectory, "index.html"), galleryHtml(items));
  await writeFile(path.join(outputDirectory, "manifest.json"), JSON.stringify(items, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });

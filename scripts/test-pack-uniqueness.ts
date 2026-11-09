import assert from "node:assert/strict";
import { pickDistinctPhotoUrls, photoIdentity } from "../src/lib/curated-images";
import { generateWeek, selectWeeklyTemplates } from "../src/lib/generator";
import type { CompanyProfile, PostTemplate } from "../src/lib/types";

const company: CompanyProfile = {
  name: "Cafe Teste",
  categoryId: "alimentacao",
  nicheId: "cafeteria",
  city: "Curitiba",
  state: "PR",
  instagram: "cafeteste",
  toneId: "profissional",
  colors: { primary: "#523A28", secondary: "#B96B37", accent: "#F3C774" },
};

function ids(urls: Array<string | undefined>): string[] {
  return urls.map((url) => photoIdentity(url || ""));
}

for (let n = 0; n < 12; n++) {
  const week = generateWeek(company, "2026-11-09", {}, { seed: `pack-${n}` });
  const images = ids(week.posts.map((post) => post.imageUrl));
  const slugs = week.posts.map((post) => post.templateSlug);
  assert.equal(week.posts.length, 7);
  assert.equal(new Set(images).size, 7, `seed pack-${n} repetiu imagem: ${images.join(", ")}`);
  assert.equal(new Set(slugs).size, 7, `seed pack-${n} repetiu template: ${slugs.join(", ")}`);
  assert.equal(new Set(week.posts.map((post) => post.theme.trim().toLowerCase())).size, 7);
}

const thinNiche: CompanyProfile = {
  ...company,
  categoryId: "automotivo",
  nicheId: "oficina-mecanica",
};
const thin = generateWeek(thinNiche, "2026-11-09", {}, { seed: "nicho-vazio" });
assert.equal(new Set(ids(thin.posts.map((post) => post.imageUrl))).size, 7);
assert.equal(new Set(thin.posts.map((post) => post.templateSlug)).size, 7);

const warnings: string[] = [];
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  warnings.push(args.map((part) => String(part)).join(" "));
};

try {
  const short = pickDistinctPhotoUrls(
    [
      [
        "https://images.unsplash.com/photo-aaa?w=1",
        "https://images.unsplash.com/photo-aaa?w=2",
        "https://images.unsplash.com/photo-bbb?w=1",
      ],
      ["https://images.unsplash.com/photo-bbb?w=9", "https://images.unsplash.com/photo-ccc?w=1"],
    ],
    7,
    "teste"
  );
  assert.equal(short.length, 7);
  assert.deepEqual(ids(short).slice(0, 3), ["aaa", "bbb", "ccc"]);
  assert.ok(warnings.some((line) => line.includes("Imagens distintas insuficientes")));

  warnings.length = 0;
  const few: PostTemplate[] = [
    {
      theme: "Um",
      headline: "Headline um aqui",
      subheadline: "Subheadline com tamanho suficiente.",
      cta: "Saiba mais",
      caption: "Legenda de reserva com tamanho suficiente para o pacote semanal de teste.",
      hashtags: ["#um"],
    },
    {
      theme: "Dois",
      headline: "Headline dois aqui",
      subheadline: "Outra subheadline com tamanho suficiente.",
      cta: "Saiba mais",
      caption: "Segunda legenda de reserva com tamanho suficiente para o pacote semanal.",
      hashtags: ["#dois"],
    },
  ];
  const filled = selectWeeklyTemplates(few, [], "profissional", "alimentacao/cafeteria");
  assert.equal(filled.selected.length, 7);
  assert.equal(new Set(filled.selected.map((post) => post.slug)).size, 7);
  assert.equal(new Set(filled.selected.map((post) => post.theme.trim().toLowerCase())).size, 7);
  assert.ok(warnings.some((line) => line.includes("Templates distintos insuficientes")));

  warnings.length = 0;
  const many: PostTemplate[] = Array.from({ length: 8 }, (_, index) => ({
    theme: `Tema ${index + 1}`,
    headline: `Headline do tema ${index + 1}`,
    subheadline: "Subheadline com tamanho suficiente.",
    cta: "Saiba mais",
    caption: "Legenda com tamanho suficiente para entrar no pacote semanal de teste.",
    hashtags: ["#tema"],
  }));
  const picked = selectWeeklyTemplates(many, [], "profissional", "alimentacao/cafeteria");
  assert.equal(picked.selected.length, 7);
  assert.equal(new Set(picked.selected.map((post) => post.slug)).size, 7);
  assert.ok(picked.selected.every((post) => !post.slug.includes("destaque") && !post.theme.startsWith("Reserva")));
  assert.equal(warnings.length, 0);
} finally {
  console.warn = originalWarn;
}

console.log("Pack uniqueness: OK");

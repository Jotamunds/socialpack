import assert from "node:assert/strict";
import { layoutDesignKey, MAX_LAYOUT_ID } from "../src/lib/campaign-layouts";
import { generateWeek } from "../src/lib/generator";
import type { CompanyProfile } from "../src/lib/types";

const company: CompanyProfile = {
  id: "campaign-test",
  name: "Empresa de Teste",
  categoryId: "alimentacao",
  nicheId: "cafeteria",
  city: "Curitiba",
  state: "PR",
  instagram: "empresateste",
  toneId: "profissional",
  colors: { primary: "#523A28", secondary: "#B96B37", accent: "#F3C774" },
};

const options = { seed: "socialpack-layout-regression", format: "portrait" as const };
const first = generateWeek(company, "2026-11-09", {}, options);
const second = generateWeek(company, "2026-11-09", {}, options);

assert.deepEqual(first.posts.map((post) => post.layout), second.posts.map((post) => post.layout), "A mesma seed deve reproduzir os layouts.");
assert.deepEqual(first.posts.map((post) => post.templateSlug), second.posts.map((post) => post.templateSlug), "A mesma seed deve reproduzir os templates.");
assert.equal(new Set(first.posts.map((post) => post.layout)).size, 7, "Um pacote não pode repetir composição.");
assert.equal(new Set(first.posts.map((post) => layoutDesignKey(post.layout))).size, 7, "Um pacote usa 7 desenhos diferentes.");
assert.ok(first.posts.every((post) => post.layout >= 0 && post.layout <= MAX_LAYOUT_ID), "Posts novos usam um id até o maior do catálogo.");
assert.ok(first.posts.every((post) => post.format === "portrait" && post.generationSeed === options.seed), "Formato e seed devem persistir no plano.");

const previousIds = first.posts.map((post) => post.layout);
const withHistory = generateWeek(company, "2026-11-16", { recentLayoutIds: previousIds, previousLayouts: previousIds }, { format: "story" });
assert.ok(withHistory.posts.every((post) => post.format === "story"), "Stories devem chegar ao plano de renderização.");
assert.equal(new Set(withHistory.posts.map((post) => layoutDesignKey(post.layout))).size, 7);
withHistory.posts.forEach((post, index) => {
  assert.notEqual(
    layoutDesignKey(post.layout),
    layoutDesignKey(previousIds[index]),
    `Dia ${index + 1} repetiu o desenho do pacote anterior`
  );
});

assert.deepEqual(
  [0, 1, 2, 3, 4, 5, 6].map(layoutDesignKey),
  ["legacy:0", "legacy:1", "legacy:2", "legacy:3", "legacy:4", "legacy:5", "legacy:6"]
);
assert.equal(layoutDesignKey(7), layoutDesignKey(12));
assert.equal(layoutDesignKey(7), layoutDesignKey(27));
assert.notEqual(layoutDesignKey(7), layoutDesignKey(8));
assert.notEqual(layoutDesignKey(0), layoutDesignKey(7));
assert.equal(layoutDesignKey(31), "layout:31");
assert.equal(layoutDesignKey(32), "layout:32");
assert.equal(layoutDesignKey(33), "layout:33");
assert.equal(layoutDesignKey(34), "layout:34");
assert.equal(layoutDesignKey(35), "layout:35");
assert.notEqual(layoutDesignKey(31), layoutDesignKey(32));
assert.notEqual(layoutDesignKey(33), layoutDesignKey(31));
assert.notEqual(layoutDesignKey(33), layoutDesignKey(32));
assert.notEqual(layoutDesignKey(34), layoutDesignKey(31));
assert.notEqual(layoutDesignKey(34), layoutDesignKey(32));
assert.notEqual(layoutDesignKey(34), layoutDesignKey(33));
assert.notEqual(layoutDesignKey(35), layoutDesignKey(31));
assert.notEqual(layoutDesignKey(35), layoutDesignKey(32));
assert.notEqual(layoutDesignKey(35), layoutDesignKey(33));
assert.notEqual(layoutDesignKey(35), layoutDesignKey(34));
for (let id = 0; id <= 30; id++) {
  assert.notEqual(layoutDesignKey(31), layoutDesignKey(id));
  assert.notEqual(layoutDesignKey(32), layoutDesignKey(id));
  assert.notEqual(layoutDesignKey(33), layoutDesignKey(id));
  assert.notEqual(layoutDesignKey(34), layoutDesignKey(id));
  assert.notEqual(layoutDesignKey(35), layoutDesignKey(id));
}

const pizzaria: CompanyProfile = {
  ...company,
  name: "Pizzaria Napoli",
  nicheId: "pizzaria",
  instagram: "pizzarianapoli",
};
let sawLegacy = false;
let sawCampaign = false;
for (let n = 0; n < 12; n++) {
  const week = generateWeek(pizzaria, "2026-11-09", {}, { seed: `napoli-${n}` });
  const designs = week.posts.map((post) => layoutDesignKey(post.layout));
  assert.equal(new Set(designs).size, 7, `pizzaria napoli-${n} repetiu desenho`);
  sawLegacy = sawLegacy || week.posts.some((post) => post.layout <= 6);
  sawCampaign = sawCampaign || week.posts.some((post) => post.layout >= 7 && post.layout <= 30);
}
assert.ok(sawLegacy, "Pacotes novos devem voltar a usar os layouts L0–L6.");
assert.ok(sawCampaign, "Pacotes novos devem continuar usando os desenhos de campanha.");

console.log("Campaign layout selection: OK");

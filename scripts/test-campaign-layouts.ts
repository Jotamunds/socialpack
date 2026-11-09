import assert from "node:assert/strict";
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
assert.ok(first.posts.every((post) => post.layout >= 7 && post.layout <= 30), "Posts novos devem usar L7–L30.");
assert.ok(first.posts.every((post) => post.format === "portrait" && post.generationSeed === options.seed), "Formato e seed devem persistir no plano.");

const withHistory = generateWeek(company, "2026-11-16", { recentLayoutIds: first.posts.map((post) => post.layout) }, { format: "story" });
assert.ok(withHistory.posts.every((post) => !first.posts.some((previous) => previous.layout === post.layout)), "O pacote seguinte deve evitar layouts recentes quando há alternativas.");
assert.ok(withHistory.posts.every((post) => post.format === "story"), "Stories devem chegar ao plano de renderização.");

console.log("Campaign layout selection: OK");

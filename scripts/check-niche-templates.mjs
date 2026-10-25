import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "content/templates/alimentacao/pizzaria.json",
  "content/templates/alimentacao/cafeteria.json",
  "content/templates/alimentacao/hamburgueria.json",
  "content/templates/beleza/barbearia.json",
  "content/templates/beleza/clinica-de-estetica.json",
  "content/templates/servicos/imobiliaria.json",
];

const LIMITS = {
  theme: [2, 24],
  headline: [10, 68],
  subheadline: [15, 120],
  cta: [4, 28],
  caption: [40, 1200],
};

const ALLOWED_VARS = new Set(["nome", "nicho", "tipo", "cidade", "instagram"]);
const VAR_RE = /\{(\w+)\}/g;
const HASHTAG_RE = /^#[\p{L}\p{N}_]{2,}$/u;
const MIN_POSTS = 12;

const errors = [];

function fail(file, index, theme, message) {
  const place = theme ? `${file} [post ${index + 1} "${theme}"]` : file;
  errors.push(`${place}: ${message}`);
}

function checkRange(file, index, theme, field, value) {
  const [min, max] = LIMITS[field];
  if (typeof value !== "string") {
    fail(file, index, theme, `${field} precisa ser texto`);
    return;
  }
  const length = value.length;
  if (length < min || length > max) {
    fail(file, index, theme, `${field} tem ${length} caracteres (faixa ${min}–${max})`);
  }
}

function checkVars(file, index, theme, field, value) {
  if (typeof value !== "string") return;
  const unknown = new Set();
  for (const match of value.matchAll(VAR_RE)) {
    if (!ALLOWED_VARS.has(match[1])) unknown.add(match[1]);
  }
  if (unknown.size > 0) {
    fail(
      file,
      index,
      theme,
      `${field} usa variável não permitida: ${[...unknown].map((name) => `{${name}}`).join(", ")}`
    );
  }
}

let totalPosts = 0;

for (const rel of FILES) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`${rel}: arquivo não encontrado`);
    continue;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`${rel}: JSON inválido (${message})`);
    continue;
  }

  if (!data || typeof data !== "object" || !Array.isArray(data.posts)) {
    errors.push(`${rel}: "posts" precisa ser um array`);
    continue;
  }

  if (data.posts.length < MIN_POSTS) {
    errors.push(`${rel}: esperado pelo menos ${MIN_POSTS} posts, encontrado ${data.posts.length}`);
  }

  totalPosts += data.posts.length;
  const seenThemes = new Map();

  data.posts.forEach((post, index) => {
    if (!post || typeof post !== "object" || Array.isArray(post)) {
      fail(rel, index, "", "post precisa ser um objeto");
      return;
    }

    const theme = post.theme;
    checkRange(rel, index, typeof theme === "string" ? theme : "", "theme", theme);

    if (typeof theme === "string") {
      const key = theme.trim().toLocaleLowerCase("pt-BR");
      if (!key) {
        fail(rel, index, theme, "theme vazio");
      } else if (seenThemes.has(key)) {
        fail(rel, index, theme, `theme duplicado (igual a "${seenThemes.get(key)}")`);
      } else {
        seenThemes.set(key, theme);
      }
    }

    if (Object.prototype.hasOwnProperty.call(post, "tones")) {
      fail(rel, index, typeof theme === "string" ? theme : "", "campo tones não deve existir (o post vale para todos os tons)");
    }

    for (const field of ["headline", "subheadline", "cta", "caption"]) {
      checkRange(rel, index, typeof theme === "string" ? theme : "", field, post[field]);
      checkVars(rel, index, typeof theme === "string" ? theme : "", field, post[field]);
    }

    if (typeof post.caption === "string") {
      const missing = [];
      if (!post.caption.includes("{nome}")) missing.push("{nome}");
      if (!post.caption.includes("{cidade}")) missing.push("{cidade}");
      if (missing.length > 0) {
        fail(
          rel,
          index,
          typeof theme === "string" ? theme : "",
          `caption precisa usar ${missing.join(" e ")} ao menos uma vez`
        );
      }
    }

    const tags = post.hashtags;
    if (!Array.isArray(tags) || tags.length < 3 || tags.length > 4) {
      const found = Array.isArray(tags) ? tags.length : "ausente";
      fail(rel, index, typeof theme === "string" ? theme : "", `hashtags precisa ter de 3 a 4 itens (encontrado ${found})`);
    } else {
      const seenTags = new Set();
      tags.forEach((tag, tagIndex) => {
        if (typeof tag !== "string" || !HASHTAG_RE.test(tag)) {
          fail(
            rel,
            index,
            typeof theme === "string" ? theme : "",
            `hashtag ${tagIndex + 1} inválida (${JSON.stringify(tag)}). Use # seguido de letras, números ou _`
          );
          return;
        }
        const key = tag.toLocaleLowerCase("pt-BR");
        if (seenTags.has(key)) {
          fail(rel, index, typeof theme === "string" ? theme : "", `hashtag repetida no post: ${tag}`);
        } else {
          seenTags.add(key);
        }
      });
    }
  });
}

if (errors.length > 0) {
  console.error(`Falha na checagem dos templates de nicho (${errors.length} problema(s)).`);
  console.error("Corrija os itens abaixo e rode de novo: npm run templates:check\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`templates:check ok: ${FILES.length} nichos, ${totalPosts} posts.`);
for (const rel of FILES) {
  const data = JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  console.log(`- ${rel}: ${data.posts.length} posts`);
}

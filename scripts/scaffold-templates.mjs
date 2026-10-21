// Cria os arquivos de textos que ainda não existem para cada nicho do catálogo.
// Uso: npm run templates:scaffold
// Arquivos já existentes NUNCA são sobrescritos.
import { readFile, mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(
  await readFile(path.join(root, "content", "catalog.json"), "utf8"),
);

let created = 0;
for (const category of catalog.categories) {
  const dir = path.join(root, "content", "templates", category.id);
  await mkdir(dir, { recursive: true });

  for (const niche of category.niches) {
    const file = path.join(dir, `${niche.id}.json`);
    try {
      await access(file);
    } catch {
      const content = { label: `${category.label} › ${niche.label}`, posts: [] };
      await writeFile(file, JSON.stringify(content, null, 2) + "\n", "utf8");
      created++;
      console.log(`+ ${path.relative(root, file)}`);
    }
  }
}

console.log(created ? `\n${created} arquivo(s) criado(s).` : "Nada a criar: todos os nichos já têm arquivo.");

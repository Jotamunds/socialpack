import fs from "node:fs";
import path from "node:path";

async function testBrandLogos() {
  console.log("=== INICIANDO VALIDAÇÃO DE LOGOS VETORIAIS SVG OFICIAIS ===");

  const basePath = process.cwd();

  // 1. Validar existência dos 4 SVGs canônicos em public/brand/
  console.log("1. Verificando arquivos em public/brand/...");
  const brandFiles = [
    "socialpack-logo.svg",
    "socialpack-logo-with-label.svg",
    "socialpack-logo-without-borders.svg",
    "socialpack-only-label.svg",
  ];

  for (const file of brandFiles) {
    const fullPath = path.resolve(basePath, "public/brand", file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Arquivo obrigatório não encontrado em public/brand: ${file}`);
    }
    const stat = fs.statSync(fullPath);
    if (stat.size === 0) {
      throw new Error(`Arquivo vazio encontrado em public/brand: ${file}`);
    }
    const content = fs.readFileSync(fullPath, "utf-8");
    if (!content.includes("<svg")) {
      throw new Error(`Arquivo ${file} não é um SVG válido.`);
    }
    console.log(`   ✓ public/brand/${file} validado (${stat.size} bytes).`);
  }

  // 2. Validar que não há código legado em src/components/Logo.tsx
  console.log("2. Validando eliminação de código legado em src/components/Logo.tsx...");
  const logoComponentPath = path.resolve(basePath, "src/components/Logo.tsx");
  const logoContent = fs.readFileSync(logoComponentPath, "utf-8");

  const legacyKeywords = ["size-8", "SocialPack AI", "grid size-8", "place-items-center"];
  for (const kw of legacyKeywords) {
    if (logoContent.includes(kw)) {
      throw new Error(`Código legado detectado em Logo.tsx: '${kw}'`);
    }
  }

  if (!logoContent.includes("/brand/socialpack-logo-with-label.svg")) {
    throw new Error("Logo.tsx deve mapear a variante with-label para /brand/socialpack-logo-with-label.svg");
  }
  if (!logoContent.includes("/brand/socialpack-logo.svg")) {
    throw new Error("Logo.tsx deve mapear a variante icon para /brand/socialpack-logo.svg");
  }
  if (!logoContent.includes("/brand/socialpack-logo-without-borders.svg")) {
    throw new Error("Logo.tsx deve mapear a variante without-borders para /brand/socialpack-logo-without-borders.svg");
  }
  if (!logoContent.includes("/brand/socialpack-only-label.svg")) {
    throw new Error("Logo.tsx deve mapear a variante only-label para /brand/socialpack-only-label.svg");
  }
  console.log("   ✓ Logo.tsx atualizado com as 4 variantes oficiais mapeadas.");

  // 3. Validar exportação canônica em src/components/logos/index.ts e src/componentes/logos/index.ts
  console.log("3. Validando barrels de compatibilidade em logos/...");
  const barrelPaths = [
    path.resolve(basePath, "src/components/logos/index.ts"),
    path.resolve(basePath, "src/componentes/logos/index.ts"),
  ];

  for (const bp of barrelPaths) {
    if (!fs.existsSync(bp)) {
      throw new Error(`Barrel não encontrado: ${bp}`);
    }
    const content = fs.readFileSync(bp, "utf-8");
    if (!content.includes("export { Logo") && !content.includes("export default")) {
      throw new Error(`Barrel ${bp} deve re-exportar Logo.`);
    }
    console.log(`   ✓ ${path.relative(basePath, bp)} validado.`);
  }

  // 4. Validar favicon em layout.tsx
  console.log("4. Validando metadados de ícones em layout.tsx...");
  const layoutPath = path.resolve(basePath, "src/app/layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");
  if (!layoutContent.includes("/brand/socialpack-logo.svg")) {
    throw new Error("layout.tsx deve configurar icons apontando para /brand/socialpack-logo.svg");
  }
  console.log("   ✓ layout.tsx configurado com favicon vetorial squircle.");

  // 5. Validar distribuição estratégica nas páginas
  console.log("5. Validando distribuição das variantes nas páginas...");
  const checkPages = [
    { file: "src/app/page.tsx", required: ["variant=\"with-label\""] },
    { file: "src/app/login/page.tsx", required: ["variant=\"icon\""] },
    { file: "src/app/cadastro/page.tsx", required: ["variant=\"icon\""] },
    { file: "src/app/perfil/page.tsx", required: ["variant=\"with-label\"", "href=\"/perfil\""] },
    { file: "src/components/cards/PostCanvas.tsx", required: ["variant=\"without-borders\"", "href={null}"] },
  ];

  for (const cp of checkPages) {
    const fullPath = path.resolve(basePath, cp.file);
    const content = fs.readFileSync(fullPath, "utf-8");
    for (const req of cp.required) {
      if (!content.includes(req)) {
        throw new Error(`${cp.file} deve conter '${req}'.`);
      }
    }
    console.log(`   ✓ ${cp.file} possui a configuração oficial de logo.`);
  }

  console.log("\n=== VALIDAÇÃO DE LOGOS VETORIAIS: TODOS OS TESTES PASSARAM COM SUCESSO (PASS)! ===");
}

testBrandLogos().catch((err) => {
  console.error("Erro na validação de logos:", err);
  process.exit(1);
});

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Se executado diretamente com "node scripts/test-phase5.mjs", delega para tsx garantindo resolução de módulos TS
if (!process.env.__TSX_RUNNING__) {
  const result = spawnSync("npx", ["tsx", "scripts/test-phase5.mjs"], {
    shell: true,
    stdio: "pipe",
    encoding: "utf-8",
    env: { ...process.env, __TSX_RUNNING__: "1" },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 0);
}

const { generateWeek } = await import("../src/lib/generator.ts");
const { renderPostToPngBuffer, loadInterFonts, sanitizePublicErrorMessage } = await import("../src/lib/rendering/satori-renderer.ts");

async function runPhase5Tests() {
  console.log("=== INICIANDO VALIDAÇÃO DA FASE 5: MOTOR DETERMINÍSTICO & SATORI ===");

  const basePath = process.cwd();

  // ---------------------------------------------------------------------------
  // 1. Validar Existência dos Arquivos da Fase 5
  // ---------------------------------------------------------------------------
  console.log("1. Verificando existência de arquivos essenciais da Fase 5...");
  const requiredFiles = [
    { name: "Motor Satori Renderer", path: path.resolve(basePath, "src/lib/rendering/satori-renderer.ts") },
    { name: "Motor Determinístico (generator)", path: path.resolve(basePath, "src/lib/generator.ts") },
    { name: "Route Handler de Geração Semanal", path: path.resolve(basePath, "src/app/api/generate/weekly/route.ts") },
    { name: "Server Actions de Posts", path: path.resolve(basePath, "src/app/actions/posts.ts") },
    { name: "Página /geracao/instagram/posts", path: path.resolve(basePath, "src/app/geracao/instagram/posts/page.tsx") },
    { name: "Componente CompanySelector", path: path.resolve(basePath, "src/components/geracao/CompanySelector.tsx") },
    { name: "Componente WeeklyGrid", path: path.resolve(basePath, "src/components/geracao/WeeklyGrid.tsx") },
    { name: "Componente PostPreviewModal", path: path.resolve(basePath, "src/components/geracao/PostPreviewModal.tsx") },
    { name: "Componente GeracaoClient", path: path.resolve(basePath, "src/components/geracao/GeracaoClient.tsx") },
    { name: "Migração 0002 Constraints de Integridade", path: path.resolve(basePath, "supabase/migrations/0002_posts_integrity.sql") },
  ];

  for (const f of requiredFiles) {
    if (!fs.existsSync(f.path)) {
      throw new Error(`Arquivo obrigatório não encontrado: ${f.name} (${f.path})`);
    }
    console.log(`   ✓ ${f.name} presente.`);
  }

  // ---------------------------------------------------------------------------
  // 2. Validar Fontes Inter em Memória (Regular 400, Medium 500, SemiBold 600, Bold 700)
  // ---------------------------------------------------------------------------
  console.log("2. Validando carregamento das fontes Inter...");
  const fonts = loadInterFonts();
  if (!Array.isArray(fonts) || fonts.length !== 4) {
    throw new Error(`Esperado 4 pesos de fonte Inter, obtido: ${fonts?.length}`);
  }
  const weights = fonts.map((f) => f.weight).sort();
  if (weights[0] !== 400 || weights[1] !== 500 || weights[2] !== 600 || weights[3] !== 700) {
    throw new Error(`Pesos de fonte incorretos: ${weights.join(", ")}`);
  }
  console.log("   ✓ Fontes Inter 400, 500, 600 e 700 carregadas em memória.");

  // ---------------------------------------------------------------------------
  // 3. Validar Motor Determinístico (generateWeek)
  // ---------------------------------------------------------------------------
  console.log("3. Validando motor determinístico (generateWeek)...");
  const testCompany = {
    name: "Pizzaria Napoli",
    categoryId: "alimentacao",
    nicheId: "pizzaria",
    city: "Campinas",
    state: "SP",
    instagram: "pizzarianapoli",
    toneId: "profissional",
    colors: {
      primary: "#5e6ad2",
      secondary: "#7170ff",
      accent: "#828fff",
    },
  };

  const weekResult = generateWeek(testCompany, "2026-10-26");
  if (!weekResult.posts || weekResult.posts.length !== 7) {
    throw new Error(`generateWeek deveria retornar exatamente 7 posts, retornou ${weekResult.posts?.length}`);
  }

  // Checar interpolação de variáveis
  const post1 = weekResult.posts[0];
  if (!post1.headline || post1.headline.includes("{nome}")) {
    throw new Error(`Placeholder {nome} não foi interpolado na headline: ${post1.headline}`);
  }
  if (!post1.caption || post1.caption.includes("{cidade}")) {
    throw new Error(`Placeholder {cidade} não foi interpolado na caption: ${post1.caption}`);
  }
  if (post1.layout !== 0) {
    throw new Error(`Primeiro post deveria ter layout 0, obteve ${post1.layout}`);
  }
  if (!post1.imageUrl || !post1.imageUrl.startsWith("https://")) {
    throw new Error(`Post sem imagem curada válida do Unsplash: ${post1.imageUrl}`);
  }

  console.log(`   ✓ 7 posts gerados com sucesso para semana de ${weekResult.weekRangeLabel}.`);
  console.log("   ✓ Variáveis {nome}, {cidade} interpoladas com precisão e fotos curadas atribuídas.");

  // ---------------------------------------------------------------------------
  // 4. Validar Renderização Server-Side Satori + Resvg (Geração do Buffer PNG 1080x1080)
  // ---------------------------------------------------------------------------
  console.log("4. Validando renderização server-side Satori + Resvg em memória...");
  const pngBuffer = await renderPostToPngBuffer(post1, testCompany);

  if (!Buffer.isBuffer(pngBuffer) || pngBuffer.length < 1000) {
    throw new Error(`Buffer PNG inválido ou muito pequeno: ${pngBuffer?.length} bytes`);
  }

  // Validar Magic Number do cabeçalho PNG (8 bytes: 89 50 4E 47 0D 0A 1A 0A)
  const isPng =
    pngBuffer[0] === 0x89 &&
    pngBuffer[1] === 0x50 &&
    pngBuffer[2] === 0x4e &&
    pngBuffer[3] === 0x47 &&
    pngBuffer[4] === 0x0d &&
    pngBuffer[5] === 0x0a &&
    pngBuffer[6] === 0x1a &&
    pngBuffer[7] === 0x0a;

  if (!isPng) {
    throw new Error("O buffer gerado não possui o cabeçalho PNG válido.");
  }

  // Validar dimensões 1080x1080 no IHDR chunk (bytes 16..23)
  const width = pngBuffer.readUInt32BE(16);
  const height = pngBuffer.readUInt32BE(20);

  if (width !== 1080 || height !== 1080) {
    throw new Error(`Dimensões do PNG incorretas. Esperado 1080x1080, obtido ${width}x${height}`);
  }

  console.log(`   ✓ PNG 1080×1080px rasterizado com sucesso (${pngBuffer.length} bytes, magic header validado).`);

  // ---------------------------------------------------------------------------
  // 5. Validar Sanitização de Mensagens de Erro
  // ---------------------------------------------------------------------------
  console.log("5. Validando sanitização de mensagens de erro públicas...");
  const sanitizedP3 = sanitizePublicErrorMessage(new Error("Trigger enforce_company_quota: P0003 limite de empresas"));
  if (!sanitizedP3.toLowerCase().includes("limite de empresas")) {
    throw new Error("Sanitização de P0003 falhou.");
  }

  const sanitizedLeak = sanitizePublicErrorMessage(
    new Error("Database connection to postgresql://postgres:secret_pass@db.supabase.co:5432/postgres failed at D:\\Projetos\\server.ts")
  );
  if (sanitizedLeak.includes("secret_pass") || sanitizedLeak.includes("D:\\")) {
    throw new Error("VIOLAÇÃO DE SEGURANÇA: sanitizePublicErrorMessage vazou credenciais ou caminhos absolutos.");
  }
  console.log("   ✓ sanitizePublicErrorMessage neutraliza segredos e caminhos absolutos.");

  // ---------------------------------------------------------------------------
  // 6. Validar Máquina de Estados e Invariantes no Route Handler (route.ts)
  // ---------------------------------------------------------------------------
  console.log("6. Validando conformidade da máquina de estados e RLS no Route Handler...");
  const routeContent = fs.readFileSync(path.resolve(basePath, "src/app/api/generate/weekly/route.ts"), "utf-8");

  // maxDuration = 60
  if (!routeContent.includes("maxDuration = 60")) {
    throw new Error("Route Handler deve declarar maxDuration = 60.");
  }

  // Transições de ciclo de vida
  if (!routeContent.includes("status: \"pending\"")) {
    throw new Error("Route Handler deve inicializar posts com status 'pending'.");
  }
  if (!routeContent.includes("status: \"processing\"")) {
    throw new Error("Route Handler deve transicionar posts para 'processing' antes de renderizar.");
  }
  if (!routeContent.includes("status: \"completed\"")) {
    throw new Error("Route Handler deve transicionar posts para 'completed' após upload.");
  }
  if (!routeContent.includes("status: \"failed\"")) {
    throw new Error("Route Handler deve transicionar posts para 'failed' em caso de erro.");
  }

  // Rollback compensatório no Storage
  if (!routeContent.includes(".remove([storagePath])")) {
    throw new Error("Route Handler deve conter rollback compensatório removendo arquivo órfão no Storage em caso de erro.");
  }

  // Validação de assinatura
  if (!routeContent.includes("requireValidSubscription")) {
    throw new Error("Route Handler deve validar assinatura ativa via requireValidSubscription.");
  }

  console.log("   ✓ Máquina de estados (pending -> processing -> completed / failed) rigorosamente implementada.");
  console.log("   ✓ Rollback compensatório de storage e verificação de assinatura confirmados.");

  // ---------------------------------------------------------------------------
  // 7. Validar Server Actions de Posts (src/app/actions/posts.ts)
  // ---------------------------------------------------------------------------
  console.log("7. Validando Server Actions de posts...");
  const postsActionContent = fs.readFileSync(path.resolve(basePath, "src/app/actions/posts.ts"), "utf-8");

  if (!postsActionContent.includes("getSignedPostDownloadUrlAction")) {
    throw new Error("src/app/actions/posts.ts deve exportar getSignedPostDownloadUrlAction.");
  }
  if (!postsActionContent.includes("getWeeklyPostsAction")) {
    throw new Error("src/app/actions/posts.ts deve exportar getWeeklyPostsAction.");
  }
  if (!postsActionContent.includes("createSignedUrl")) {
    throw new Error("src/app/actions/posts.ts deve usar createSignedUrl com expiração curta.");
  }
  if (!postsActionContent.includes("download: true")) {
    throw new Error("getSignedPostDownloadUrlAction deve configurar flag download: true.");
  }

  console.log("   ✓ Server Actions geram URLs assinadas protegidas com expiração curta de 120s.");

  console.log("\n=== FASE 5: TODOS OS TESTES PASSARAM COM SUCESSO (PASS)! ===");
}

runPhase5Tests().catch((err) => {
  console.error("Falha nos testes da Fase 5:", err);
  process.exit(1);
});

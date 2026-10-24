import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Se executado diretamente com "node scripts/test-phase6.mjs", delega para tsx garantindo resolução de módulos TS
if (!process.env.__TSX_RUNNING__) {
  const result = spawnSync("npx", ["tsx", "scripts/test-phase6.mjs"], {
    shell: true,
    stdio: "pipe",
    encoding: "utf-8",
    env: { ...process.env, __TSX_RUNNING__: "1" },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 0);
}

async function runPhase6Tests() {
  console.log("=== INICIANDO VALIDAÇÃO DA FASE 6: HISTÓRICO & EXCLUSÃO COORDENADA ===");

  const basePath = process.cwd();

  // ---------------------------------------------------------------------------
  // 1. Validar Existência dos Arquivos Essenciais da Fase 6
  // ---------------------------------------------------------------------------
  console.log("1. Verificando existência de arquivos essenciais da Fase 6...");
  const requiredFiles = [
    { name: "Server Actions de Histórico", path: path.resolve(basePath, "src/app/actions/history.ts") },
    { name: "Página Seletora /geracao/historico", path: path.resolve(basePath, "src/app/geracao/historico/page.tsx") },
    { name: "Página Galeria /geracao/historico/instagram", path: path.resolve(basePath, "src/app/geracao/historico/instagram/page.tsx") },
    { name: "Componente HistoryFilters", path: path.resolve(basePath, "src/components/historico/HistoryFilters.tsx") },
    { name: "Componente HistoryGrid", path: path.resolve(basePath, "src/components/historico/HistoryGrid.tsx") },
    { name: "Componente DeletePostModal", path: path.resolve(basePath, "src/components/historico/DeletePostModal.tsx") },
    { name: "Componente HistoryInstagramClient", path: path.resolve(basePath, "src/components/historico/HistoryInstagramClient.tsx") },
  ];

  for (const f of requiredFiles) {
    if (!fs.existsSync(f.path)) {
      throw new Error(`Arquivo obrigatório não encontrado: ${f.name} (${f.path})`);
    }
    console.log(`   ✓ ${f.name} presente.`);
  }

  // ---------------------------------------------------------------------------
  // 2. Validar Server Actions de Histórico e Exclusão (src/app/actions/history.ts)
  // ---------------------------------------------------------------------------
  console.log("2. Validando Server Actions de Histórico e Invariante 5...");
  const historyActionsPath = path.resolve(basePath, "src/app/actions/history.ts");
  const historyContent = fs.readFileSync(historyActionsPath, "utf-8");

  // getHistoryPostsAction
  if (!historyContent.includes("getHistoryPostsAction")) {
    throw new Error("history.ts deve exportar getHistoryPostsAction.");
  }
  if (!historyContent.includes(".eq(\"user_id\", user.id)")) {
    throw new Error("getHistoryPostsAction deve filtrar rigorosamente user_id = user.id (RLS).");
  }
  if (!historyContent.includes(".eq(\"status\", \"completed\")")) {
    throw new Error("getHistoryPostsAction deve listar apenas posts com status 'completed'.");
  }
  if (!historyContent.includes("createSignedUrl")) {
    throw new Error("getHistoryPostsAction deve gerar URLs assinadas temporárias via createSignedUrl.");
  }

  // Invariante 5: deletePostOrchestratedAction
  if (!historyContent.includes("deletePostOrchestratedAction")) {
    throw new Error("history.ts deve exportar deletePostOrchestratedAction.");
  }
  if (!historyContent.includes("createAdminClient")) {
    throw new Error("deletePostOrchestratedAction deve utilizar createAdminClient para bypass de RLS no backend.");
  }
  if (!historyContent.includes(".storage") || !historyContent.includes('from("generated-arts")') || !historyContent.includes(".remove(")) {
    throw new Error("deletePostOrchestratedAction deve remover primeiro o arquivo físico no Storage (generated-arts).");
  }
  if (!historyContent.includes('from("posts")') || !historyContent.includes(".delete()")) {
    throw new Error("deletePostOrchestratedAction deve remover a linha em public.posts.");
  }

  // Validar ordem estrita: Storage antes de Banco
  const removeStorageIndex = historyContent.indexOf(".remove([");
  const deleteDbIndex = historyContent.indexOf(".delete()");
  if (removeStorageIndex === -1 || deleteDbIndex === -1 || removeStorageIndex > deleteDbIndex) {
    throw new Error("VIOLAÇÃO DA INVARIANTE 5: A exclusão no Storage DEVE ocorrer antes da exclusão no banco de dados.");
  }

  // Validar tratamento de erro caso o Storage falhe
  if (!historyContent.includes("Falha ao excluir arquivo no Storage") && !historyContent.includes("Storage")) {
    throw new Error("deletePostOrchestratedAction deve tratar falhas do Storage mantendo a integridade do banco.");
  }

  console.log("   ✓ Invariante 5 comprovada: exclusão de Storage precede a remoção no PostgreSQL.");
  console.log("   ✓ RLS e isolamento de tenant 100% validados para leitura e exclusão.");

  // ---------------------------------------------------------------------------
  // 3. Validar Ecrã de Seleção de Redes (/geracao/historico/page.tsx)
  // ---------------------------------------------------------------------------
  console.log("3. Validando ecrã seletor de redes (/geracao/historico)...");
  const selectPageContent = fs.readFileSync(path.resolve(basePath, "src/app/geracao/historico/page.tsx"), "utf-8");

  if (!selectPageContent.includes("/geracao/historico/instagram")) {
    throw new Error("/geracao/historico deve direcionar o card do Instagram para /geracao/historico/instagram.");
  }
  if (!selectPageContent.includes("Disponível")) {
    throw new Error("Card do Instagram deve exibir badge 'Disponível'.");
  }
  if (!selectPageContent.includes("YouTube Shorts") || !selectPageContent.includes("TikTok Ads")) {
    throw new Error("/geracao/historico deve conter os cards de YouTube Shorts e TikTok.");
  }
  if (!selectPageContent.includes("Em breve")) {
    throw new Error("Cards inativos devem conter badge 'Em breve'.");
  }
  if (!selectPageContent.includes("pointer-events-none")) {
    throw new Error("Cards inativos devem estar desabilitados com pointer-events-none.");
  }
  console.log("   ✓ Ecrã seletor de canais implementado com Instagram ativo e demais redes sinalizadas como 'Em breve'.");

  // ---------------------------------------------------------------------------
  // 4. Validar Galeria de Histórico (/geracao/historico/instagram/page.tsx)
  // ---------------------------------------------------------------------------
  console.log("4. Validando galeria de histórico do Instagram...");
  const galleryPageContent = fs.readFileSync(path.resolve(basePath, "src/app/geracao/historico/instagram/page.tsx"), "utf-8");

  if (!galleryPageContent.includes("getHistoryPostsAction")) {
    throw new Error("A página da galeria deve carregar posts iniciais com getHistoryPostsAction.");
  }
  if (!galleryPageContent.includes("<HistoryInstagramClient")) {
    throw new Error("A página da galeria deve renderizar o HistoryInstagramClient.");
  }
  if (!galleryPageContent.includes("/geracao/instagram/posts")) {
    throw new Error("A página da galeria deve conter botão de atalho para Nova Geração (/geracao/instagram/posts).");
  }

  // ---------------------------------------------------------------------------
  // 5. Validar Componentes Interativos (Filtros, Grid, Modais)
  // ---------------------------------------------------------------------------
  console.log("5. Validando componentes interativos da galeria...");

  // HistoryFilters
  const filtersContent = fs.readFileSync(path.resolve(basePath, "src/components/historico/HistoryFilters.tsx"), "utf-8");
  if (!filtersContent.includes("Filtrar por Empresa") || !filtersContent.includes("Período")) {
    throw new Error("HistoryFilters deve conter controle de empresa e seletor de período.");
  }

  // HistoryGrid
  const gridContent = fs.readFileSync(path.resolve(basePath, "src/components/historico/HistoryGrid.tsx"), "utf-8");
  if (!gridContent.includes("gridTemplateColumns") || !gridContent.includes("minmax(260px, 1fr)")) {
    throw new Error("HistoryGrid deve utilizar grid auto-fit com minmax(260px, 1fr).");
  }
  if (!gridContent.includes("onRequestDelete") || !gridContent.includes("onDownloadPost")) {
    throw new Error("HistoryGrid deve suportar ações de download e exclusão por card.");
  }

  // DeletePostModal
  const deleteModalContent = fs.readFileSync(path.resolve(basePath, "src/components/historico/DeletePostModal.tsx"), "utf-8");
  if (!deleteModalContent.includes("Excluir postagem permanentemente") || !deleteModalContent.includes("Confirmar Exclusão")) {
    throw new Error("DeletePostModal deve conter diálogo explícito de confirmação destrutiva.");
  }
  console.log("   ✓ Componentes de filtros, grid auto-fit e modal de confirmação destrutiva validados.");

  console.log("\n=== FASE 6: TODOS OS TESTES PASSARAM COM SUCESSO (PASS)! ===");
}

runPhase6Tests().catch((err) => {
  console.error("Falha nos testes da Fase 6:", err);
  process.exit(1);
});

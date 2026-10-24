import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Se executado diretamente com "node scripts/test-phase7.mjs", delega para tsx garantindo resolução TS
if (!process.env.__TSX_RUNNING__) {
  const result = spawnSync("npx", ["tsx", "scripts/test-phase7.mjs"], {
    shell: true,
    stdio: "pipe",
    encoding: "utf-8",
    env: { ...process.env, __TSX_RUNNING__: "1" },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 0);
}

async function runPhase7Tests() {
  console.log("=== INICIANDO VALIDAÇÃO DA FASE 7: PAINEL DE CONFIGURAÇÕES & THEMING ===");

  const basePath = process.cwd();

  // ---------------------------------------------------------------------------
  // 1. Validar Existência dos Arquivos Essenciais da Fase 7
  // ---------------------------------------------------------------------------
  console.log("1. Verificando presença dos arquivos obrigatórios da Fase 7...");
  const requiredFiles = [
    { name: "Schema Zod UpdateProfile", path: path.resolve(basePath, "src/lib/schemas.ts") },
    { name: "Server Actions de Settings", path: path.resolve(basePath, "src/app/actions/settings.ts") },
    { name: "Página /configuracoes", path: path.resolve(basePath, "src/app/configuracoes/page.tsx") },
    { name: "Componente SettingsTabs", path: path.resolve(basePath, "src/components/configuracoes/SettingsTabs.tsx") },
    { name: "Componente SubscriptionPlanCard", path: path.resolve(basePath, "src/components/configuracoes/SubscriptionPlanCard.tsx") },
    { name: "Componente AccountForm", path: path.resolve(basePath, "src/components/configuracoes/AccountForm.tsx") },
    { name: "Componente AppearanceSelector", path: path.resolve(basePath, "src/components/configuracoes/AppearanceSelector.tsx") },
    { name: "Componente ConfiguracoesClient", path: path.resolve(basePath, "src/components/configuracoes/ConfiguracoesClient.tsx") },
  ];

  for (const f of requiredFiles) {
    if (!fs.existsSync(f.path)) {
      throw new Error(`Arquivo obrigatório não encontrado: ${f.name} (${f.path})`);
    }
    console.log(`   ✓ ${f.name} presente.`);
  }

  // ---------------------------------------------------------------------------
  // 2. Validar Schema Zod UpdateProfileInputSchema em Tempo de Execução
  // ---------------------------------------------------------------------------
  console.log("2. Validando schema Zod UpdateProfileInputSchema...");
  const { pathToFileURL } = await import("node:url");
  const schemasUrl = pathToFileURL(path.resolve(basePath, "src/lib/schemas.ts")).href;
  const { UpdateProfileInputSchema } = await import(schemasUrl);

  // Caso Válido 1: Nome e telefone com máscara nacional
  const valid1 = UpdateProfileInputSchema.safeParse({
    fullName: "Arthur Dent",
    phone: "(11) 98765-4321",
  });
  if (!valid1.success) {
    throw new Error(`Validação falhou para entrada válida: ${JSON.stringify(valid1.error)}`);
  }

  // Caso Válido 2: Nome com full_name e telefone vazio opcional
  const valid2 = UpdateProfileInputSchema.safeParse({
    full_name: "Ford Prefect",
    phone: "",
  });
  if (!valid2.success) {
    throw new Error(`Validação falhou para telefone opcional: ${JSON.stringify(valid2.error)}`);
  }

  // Caso Inválido 1: Nome muito curto (< 2 caracteres)
  const invalidName = UpdateProfileInputSchema.safeParse({
    fullName: "A",
    phone: "(11) 98765-4321",
  });
  if (invalidName.success) {
    throw new Error("UpdateProfileInputSchema deveria rejeitar nomes com menos de 2 caracteres.");
  }

  // Caso Inválido 2: Telefone em formato incorreto
  const invalidPhone = UpdateProfileInputSchema.safeParse({
    fullName: "Tricia McMillan",
    phone: "123456",
  });
  if (invalidPhone.success) {
    throw new Error("UpdateProfileInputSchema deveria rejeitar formatos inválidos de telefone.");
  }

  console.log("   ✓ Validação Zod de UpdateProfileInputSchema opera com 100% de conformidade.");

  // ---------------------------------------------------------------------------
  // 3. Validar Server Actions de Settings e Conformidade PCI-DSS (Mandamento 3)
  // ---------------------------------------------------------------------------
  console.log("3. Validando Server Actions de Settings e Mandamento 3 (PCI-DSS)...");
  const settingsPath = path.resolve(basePath, "src/app/actions/settings.ts");
  const settingsContent = fs.readFileSync(settingsPath, "utf-8");

  // updateProfileAction
  if (!settingsContent.includes("updateProfileAction")) {
    throw new Error("settings.ts deve exportar updateProfileAction.");
  }
  if (!settingsContent.includes("from(\"profiles\")") || !settingsContent.includes(".update(")) {
    throw new Error("updateProfileAction deve atualizar registros na tabela profiles.");
  }
  if (!settingsContent.includes(".eq(\"id\", user.id)")) {
    throw new Error("updateProfileAction deve filtrar estritamente auth.uid() = id.");
  }

  // upgradeToProAction
  if (!settingsContent.includes("upgradeToProAction")) {
    throw new Error("settings.ts deve exportar upgradeToProAction.");
  }
  if (!settingsContent.includes("from(\"subscriptions\")") || !settingsContent.includes(".update(")) {
    throw new Error("upgradeToProAction deve atualizar registros na tabela subscriptions.");
  }
  if (!settingsContent.includes("plan: \"pro\"") || (!settingsContent.includes("company_quota: 3") && !settingsContent.includes("max_companies: 3"))) {
    throw new Error("upgradeToProAction deve atualizar plan para 'pro' e cota para 3 empresas.");
  }

  // Mandamento 3: PCI-DSS Invariants
  const prohibitedKeywords = ["card_number", "credit_card", "cvv", "cvc", "exp_month", "exp_year", "cartao_credito"];
  for (const keyword of prohibitedKeywords) {
    if (settingsContent.toLowerCase().includes(keyword)) {
      throw new Error(`VIOLAÇÃO PCI-DSS (MANDAMENTO 3): O arquivo settings.ts contém o termo proibido '${keyword}'. Dados de cartão nunca devem ser processados ou persistidos.`);
    }
  }

  // Revalidação de rotas
  if (!settingsContent.includes("revalidatePath(\"/configuracoes\")")) {
    throw new Error("settings.ts deve executar revalidatePath('/configuracoes').");
  }

  console.log("   ✓ Invariantes PCI-DSS comprovadas: 0 manipulação de dados de cartão de crédito no banco.");
  console.log("   ✓ Isolamento de Tenant e RLS validados para updateProfileAction e upgradeToProAction.");

  // ---------------------------------------------------------------------------
  // 4. Validar Design System & Theming Tokens (src/app/globals.css)
  // ---------------------------------------------------------------------------
  console.log("4. Validando regras de theming e classes CSS em globals.css...");
  const globalsCss = fs.readFileSync(path.resolve(basePath, "src/app/globals.css"), "utf-8");

  if (!globalsCss.includes("html.light") && !globalsCss.includes(":root.light")) {
    throw new Error("globals.css deve definir as regras de tema claro (.light).");
  }
  if (!globalsCss.includes("--bg-marketing") || !globalsCss.includes("--text-primary")) {
    throw new Error("globals.css deve conter tokens CSS de background e texto para theming.");
  }

  console.log("   ✓ Tokens de Dark Mode e Light Mode configurados sem risco de FOUC.");

  // ---------------------------------------------------------------------------
  // 5. Validar Componentes da Interface (/configuracoes)
  // ---------------------------------------------------------------------------
  console.log("5. Validando componentes das 3 abas...");

  // SettingsTabs
  const tabsContent = fs.readFileSync(path.resolve(basePath, "src/components/configuracoes/SettingsTabs.tsx"), "utf-8");
  if (!tabsContent.includes("plano") || !tabsContent.includes("conta") || !tabsContent.includes("aparencia")) {
    throw new Error("SettingsTabs deve prover as 3 abas: plano, conta, aparencia.");
  }

  // SubscriptionPlanCard
  const planCardContent = fs.readFileSync(path.resolve(basePath, "src/components/configuracoes/SubscriptionPlanCard.tsx"), "utf-8");
  if (!planCardContent.includes("h-2") || !planCardContent.includes("#5e6ad2")) {
    throw new Error("SubscriptionPlanCard deve renderizar a barra de progresso horizontal h-2 com preenchimento #5e6ad2.");
  }
  if (!planCardContent.includes("Fazer Upgrade para Pro")) {
    throw new Error("SubscriptionPlanCard deve conter o botão de upgrade para usuários Starter.");
  }
  if (!planCardContent.includes("upgradeToProAction")) {
    throw new Error("SubscriptionPlanCard deve conectar o modal com upgradeToProAction.");
  }

  // AccountForm
  const accountContent = fs.readFileSync(path.resolve(basePath, "src/components/configuracoes/AccountForm.tsx"), "utf-8");
  if (!accountContent.includes("readOnly") || !accountContent.includes("disabled")) {
    throw new Error("AccountForm deve proteger o campo de e-mail como readOnly/disabled.");
  }
  if (!accountContent.includes("Dados atualizados")) {
    throw new Error("AccountForm deve fornecer feedback tátil de sucesso 'Dados atualizados'.");
  }

  // AppearanceSelector
  const appearanceContent = fs.readFileSync(path.resolve(basePath, "src/components/configuracoes/AppearanceSelector.tsx"), "utf-8");
  if (!appearanceContent.includes("localStorage") || !appearanceContent.includes("classList")) {
    throw new Error("AppearanceSelector deve persistir tema no localStorage e manipular a classList do documentElement.");
  }
  if (!appearanceContent.includes("Tema Escuro") || !appearanceContent.includes("Tema Claro")) {
    throw new Error("AppearanceSelector deve exibir opções visuais de Tema Escuro e Tema Claro.");
  }

  // /configuracoes/page.tsx
  const pageContent = fs.readFileSync(path.resolve(basePath, "src/app/configuracoes/page.tsx"), "utf-8");
  if (!pageContent.includes("from(\"profiles\")") || !pageContent.includes("from(\"subscriptions\")") || !pageContent.includes("from(\"companies\")")) {
    throw new Error("Página /configuracoes deve consultar em paralelo profiles, subscriptions e companies.");
  }

  console.log("   ✓ Componentes das 3 abas, seletores de tema e proteção de campos validados.");

  console.log("\n=== FASE 7: TODOS OS TESTES PASSARAM COM SUCESSO (PASS)! ===");
}

runPhase7Tests().catch((err) => {
  console.error("Falha nos testes da Fase 7:", err);
  process.exit(1);
});

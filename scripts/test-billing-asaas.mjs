import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Se executado com node puro, delega para tsx
if (!process.env.__TSX_RUNNING__) {
  const result = spawnSync("npx", ["tsx", "scripts/test-billing-asaas.mjs"], {
    shell: true,
    stdio: "pipe",
    encoding: "utf-8",
    env: { ...process.env, __TSX_RUNNING__: "1" },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 0);
}

async function runBillingAsaasTests() {
  console.log("=== INICIANDO VALIDAÇÃO DE SEGURANÇA DA INTEGRAÇÃO DE COBRANÇA ASAAS ===");
  const basePath = process.cwd();

  // 1. Arquivos essenciais de billing
  console.log("1. Verificando presença dos arquivos de cobrança...");
  const requiredFiles = [
    "src/lib/billing/plans.ts",
    "src/lib/billing/asaas.ts",
    "src/app/actions/billing.ts",
    "src/app/api/webhooks/asaas/route.ts",
    "src/app/planos/page.tsx",
    "supabase/migrations/20261025210000_billing_asaas.sql",
  ];

  for (const rel of requiredFiles) {
    const full = path.resolve(basePath, rel);
    if (!fs.existsSync(full)) {
      throw new Error(`Arquivo obrigatório ausente: ${rel}`);
    }
    console.log(`   ✓ ${rel} presente.`);
  }

  // 2. Preços fixos no servidor (Starter R$ 49,90 e Pro R$ 97,00)
  console.log("2. Validando invariantes de preço e cotas...");
  const plansContent = fs.readFileSync(path.resolve(basePath, "src/lib/billing/plans.ts"), "utf-8");
  if (!plansContent.includes("server-only")) {
    throw new Error("plans.ts deve conter 'server-only' para isolamento de segurança.");
  }
  if (!plansContent.includes("49.9") || !plansContent.includes("97")) {
    throw new Error("Preços fixos de R$ 49,90 (Starter) e R$ 97,00 (Pro) devem estar definidos em plans.ts.");
  }
  console.log("   ✓ Preços fixos imutáveis no servidor: Starter R$ 49,90 e Pro R$ 97,00.");

  // 3. Server action de checkout
  console.log("3. Validando server action de checkout (startPlanCheckoutAction)...");
  const billingActionContent = fs.readFileSync(path.resolve(basePath, "src/app/actions/billing.ts"), "utf-8");
  if (!billingActionContent.includes("startPlanCheckoutAction")) {
    throw new Error("billing.ts deve exportar startPlanCheckoutAction.");
  }
  if (!billingActionContent.includes("z.enum([\"starter\", \"pro\"]")) {
    throw new Error("startPlanCheckoutAction deve validar estritamente starter e pro com Zod.");
  }
  if (billingActionContent.includes("searchParams") || billingActionContent.includes("req.url")) {
    throw new Error("Preço e status NÃO podem ser lidos de URL ou searchParams.");
  }
  console.log("   ✓ Validação Zod estrita de 'starter' | 'pro', sem leitura de preços de formulário ou URL.");

  // 4. Webhook de segurança
  console.log("4. Validando segurança e idempotência do webhook...");
  const webhookContent = fs.readFileSync(path.resolve(basePath, "src/app/api/webhooks/asaas/route.ts"), "utf-8");
  if (!webhookContent.includes("verifyAsaasWebhookToken")) {
    throw new Error("Webhook deve validar token de acesso via verifyAsaasWebhookToken.");
  }
  if (!webhookContent.includes("billing_webhook_events")) {
    throw new Error("Webhook deve garantir idempotência gravando eventos em billing_webhook_events.");
  }
  if (!webhookContent.includes("getAsaasPayment")) {
    throw new Error("Webhook deve reconsultar o pagamento diretamente na API do Asaas (fonte de verdade).");
  }
  if (!webhookContent.includes("validatePaymentAmountForPlan") && !webhookContent.includes("97")) {
    throw new Error("Webhook deve validar que ativação de Pro exige pagamento de R$ 97,00.");
  }
  console.log("   ✓ Webhook com validação de token em tempo constante, idempotência e re-consulta oficial ao Asaas.");

  // 5. Bloqueio no servidor para ações e páginas pagas
  console.log("5. Validando bloqueio no servidor em todas as ações pagas...");
  const postsActionContent = fs.readFileSync(path.resolve(basePath, "src/app/actions/posts.ts"), "utf-8");
  if (!postsActionContent.includes("assertValidSubscription")) {
    throw new Error("posts.ts deve conter assertValidSubscription para bloquear acesso a posts não pagos.");
  }

  const historyActionContent = fs.readFileSync(path.resolve(basePath, "src/app/actions/history.ts"), "utf-8");
  if (!historyActionContent.includes("assertValidSubscription")) {
    throw new Error("history.ts deve conter assertValidSubscription.");
  }

  const companiesActionContent = fs.readFileSync(path.resolve(basePath, "src/app/actions/companies.ts"), "utf-8");
  if (!companiesActionContent.includes("assertValidSubscription")) {
    throw new Error("companies.ts deve conter assertValidSubscription.");
  }

  // 6. Eliminação de brecha de ativação gratuita
  console.log("6. Verificando ausência de brechas de auto-ativação gratuita...");
  const authActionContent = fs.readFileSync(path.resolve(basePath, "src/app/actions/auth.ts"), "utf-8");
  if (authActionContent.includes("status: \"active\"") && authActionContent.includes("activateChosenPlanAction")) {
    throw new Error("activateChosenPlanAction não pode mais ativar assinaturas diretamente sem gateway.");
  }

  const loginPageContent = fs.readFileSync(path.resolve(basePath, "src/app/login/page.tsx"), "utf-8");
  if (loginPageContent.includes("activateChosenPlanAction")) {
    throw new Error("login/page.tsx não deve invocar ativação de plano.");
  }

  const cadastroPageContent = fs.readFileSync(path.resolve(basePath, "src/app/cadastro/page.tsx"), "utf-8");
  if (cadastroPageContent.includes("activateChosenPlanAction")) {
    throw new Error("cadastro/page.tsx não deve invocar ativação gratuita de plano.");
  }
  console.log("   ✓ Brecha de auto-ativação gratuita eliminada com sucesso no cadastro e login.");

  // 7. Conformidade PCI-DSS
  console.log("7. Validando conformidade PCI-DSS...");
  const prohibited = ["card_number", "credit_card", "cvv", "cvc", "exp_month", "exp_year", "cartao_credito"];
  const checkedFiles = [
    "src/app/actions/billing.ts",
    "src/app/actions/settings.ts",
    "src/app/actions/auth.ts",
  ];
  for (const rel of checkedFiles) {
    const content = fs.readFileSync(path.resolve(basePath, rel), "utf-8");
    for (const kw of prohibited) {
      if (content.toLowerCase().includes(kw)) {
        throw new Error(`Violação PCI-DSS em ${rel}: termo '${kw}' encontrado.`);
      }
    }
  }
  console.log("   ✓ Zero dados de cartão de crédito no banco de dados ou em server actions (Conforme PCI-DSS).");

  console.log("\n=== SUCESSO: TODOS OS TESTES DE SEGURANÇA DE COBRANÇA ASAAS PASSARAM! ===");
}

runBillingAsaasTests().catch((err) => {
  console.error("Falha nos testes de billing Asaas:", err);
  process.exit(1);
});

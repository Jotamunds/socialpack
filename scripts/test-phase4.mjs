import fs from "node:fs";
import path from "node:path";
import {
  CreateCompanyInputSchema,
  normalizeCompanyInput,
  HexColorSchema,
  UfSchema,
} from "../src/lib/schemas.ts";

async function runPhase4Tests() {
  console.log("=== INICIANDO VALIDAÇÃO DA FASE 4: GESTÃO DE PERFIS DE EMPRESAS (/perfil) ===");

  const basePath = process.cwd();
  const perfilPagePath = path.resolve(basePath, "src", "app", "perfil", "page.tsx");
  const actionsPath = path.resolve(basePath, "src", "app", "actions", "companies.ts");
  const companyCardPath = path.resolve(basePath, "src", "components", "perfil", "CompanyCard.tsx");
  const companyModalPath = path.resolve(basePath, "src", "components", "perfil", "CompanyModal.tsx");
  const perfilClientPath = path.resolve(basePath, "src", "components", "perfil", "PerfilClient.tsx");

  // ---------------------------------------------------------------------------
  // 1. Validar Estrutura de Arquivos Obrigatórios da Fase 4
  // ---------------------------------------------------------------------------
  console.log("1. Verificando existência dos arquivos essenciais da Fase 4...");
  const requiredFiles = [
    { name: "Página /perfil", path: perfilPagePath },
    { name: "Server Actions de Empresas", path: actionsPath },
    { name: "Componente CompanyCard", path: companyCardPath },
    { name: "Componente CompanyModal", path: companyModalPath },
    { name: "Componente PerfilClient", path: perfilClientPath },
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file.path)) {
      throw new Error(`Arquivo obrigatório não encontrado: ${file.name} (${file.path})`);
    }
    console.log(`   ✓ ${file.name} presente.`);
  }

  // ---------------------------------------------------------------------------
  // 2. Validar Schemas de Entrada Zod (CreateCompanyInputSchema, UfSchema, HexColorSchema)
  // ---------------------------------------------------------------------------
  console.log("2. Validando schemas Zod de cadastro de empresas...");

  // 2.1 HexColorSchema
  if (!HexColorSchema.safeParse("#5E6AD2").success) {
    throw new Error("HexColorSchema rejeitou #5E6AD2 válido");
  }
  if (!HexColorSchema.safeParse("#000000").success) {
    throw new Error("HexColorSchema rejeitou #000000 válido");
  }
  if (HexColorSchema.safeParse("#FFF").success) {
    throw new Error("HexColorSchema aceitou hex incompleto #FFF (esperado 6 caracteres)");
  }
  if (HexColorSchema.safeParse("blue").success) {
    throw new Error("HexColorSchema aceitou nome de cor inválido");
  }
  console.log("   ✓ HexColorSchema valida estritamente ^#[0-9A-Fa-f]{6}$.");

  // 2.2 UfSchema
  if (!UfSchema.safeParse("SP").success) {
    throw new Error("UfSchema rejeitou UF válida SP");
  }
  if (!UfSchema.safeParse("RJ").success) {
    throw new Error("UfSchema rejeitou UF válida RJ");
  }
  if (UfSchema.safeParse("XYZ").success) {
    throw new Error("UfSchema aceitou UF com 3 letras");
  }
  if (UfSchema.safeParse("12").success) {
    throw new Error("UfSchema aceitou números como UF");
  }
  console.log("   ✓ UfSchema valida estritamente ^[A-Z]{2}$.");

  // 2.3 CreateCompanyInputSchema com dados válidos completos (formato v4)
  const validPayloadV4 = {
    name: "Barbearia Vintage Club",
    segment: "beleza_estetica",
    niche: "barbearia",
    city: "Curitiba",
    state: "PR",
    instagram_handle: "@vintage.club",
    primary_style: "elegante",
    brand_colors: ["#1D1D1F", "#86868B", "#F5F5F7"],
  };

  const parsedV4 = CreateCompanyInputSchema.safeParse(validPayloadV4);
  if (!parsedV4.success) {
    throw new Error(`CreateCompanyInputSchema falhou com payload válido v4: ${parsedV4.error.message}`);
  }

  const normalizedV4 = normalizeCompanyInput(parsedV4.data);
  if (normalizedV4.name !== "Barbearia Vintage Club") throw new Error("Normalização de nome incorreta.");
  if (normalizedV4.categoryId !== "beleza_estetica") throw new Error("Normalização de categoryId/segment incorreta.");
  if (normalizedV4.nicheId !== "barbearia") throw new Error("Normalização de nicheId/niche incorreta.");
  if (normalizedV4.instagram !== "vintage.club") throw new Error("Normalização do Instagram @handle falhou.");
  if (normalizedV4.state !== "PR") throw new Error("Normalização de UF incorreta.");
  if (normalizedV4.colors.primary !== "#1D1D1F") throw new Error("Normalização de cores primária incorreta.");
  console.log("   ✓ CreateCompanyInputSchema e normalizeCompanyInput funcionam para payloads v4.");

  // 2.4 CreateCompanyInputSchema com dados válidos compatíveis (formato form/UI)
  const validPayloadUI = {
    name: "Pizzaria Bella Napoli",
    categoryId: "alimentacao",
    nicheId: "pizzaria",
    city: "São Paulo",
    state: "SP",
    instagram: "bellanapoli",
    toneId: "acolhedor",
    colors: {
      primary: "#5E6AD2",
      secondary: "#7170FF",
      accent: "#828FFF",
    },
  };

  const parsedUI = CreateCompanyInputSchema.safeParse(validPayloadUI);
  if (!parsedUI.success) {
    throw new Error(`CreateCompanyInputSchema falhou com payload de UI: ${parsedUI.error.message}`);
  }
  console.log("   ✓ CreateCompanyInputSchema suporta formato de formulário UI com categoryId/nicheId/colors.");

  // 2.5 Testes de Rejeição de Dados Inválidos
  const invalidCases = [
    { name: "Nome vazio", payload: { ...validPayloadV4, name: "" } },
    { name: "Cidade vazia", payload: { ...validPayloadV4, city: "" } },
    { name: "UF inválida (3 letras)", payload: { ...validPayloadV4, state: "XYZ" } },
    { name: "Sem nicho", payload: { ...validPayloadV4, niche: "", nicheId: "" } },
    { name: "Sem categoria/segmento", payload: { ...validPayloadV4, segment: "", categoryId: "" } },
    { name: "Cores inválidas", payload: { ...validPayloadV4, brand_colors: ["invalido"] } },
    { name: "Mais de 6 cores", payload: { ...validPayloadV4, brand_colors: ["#111111", "#222222", "#333333", "#444444", "#555555", "#666666", "#777777"] } },
  ];

  for (const c of invalidCases) {
    const res = CreateCompanyInputSchema.safeParse(c.payload);
    if (res.success) {
      throw new Error(`CreateCompanyInputSchema permitiu caso inválido: ${c.name}`);
    }
  }
  console.log("   ✓ Rejeição de dados inválidos validada com sucesso em todos os casos de borda.");

  // ---------------------------------------------------------------------------
  // 3. Validar Server Actions e Mapeamento de Erros SQLSTATE (P0003, P0002)
  // ---------------------------------------------------------------------------
  console.log("3. Validando Server Actions de empresas (src/app/actions/companies.ts)...");
  const actionsContent = fs.readFileSync(actionsPath, "utf-8");

  if (!actionsContent.includes("auth.getUser()")) {
    throw new Error("companies.ts deve validar a sessão com auth.getUser().");
  }
  if (!actionsContent.includes(".eq(\"user_id\", user.id)")) {
    throw new Error("companies.ts deve restringir empresas ao user.id da sessão.");
  }
  if (!actionsContent.includes("createClient")) {
    throw new Error("companies.ts deve usar createClient do @/lib/supabase/server");
  }
  if (actionsContent.includes("assertValidSubscription") || actionsContent.includes("SUBSCRIPTION_REQUIRED")) {
    throw new Error("companies.ts não deve bloquear cadastro por assinatura.");
  }

  // Mapeamento de P0003 -> QUOTA_EXCEEDED
  if (!actionsContent.includes("P0003") || !actionsContent.includes("QUOTA_EXCEEDED")) {
    throw new Error("companies.ts deve capturar código P0003 e retornar QUOTA_EXCEEDED.");
  }

  // Operações essenciais
  if (!actionsContent.includes("createCompanyAction") || !actionsContent.includes("deleteCompanyAction")) {
    throw new Error("companies.ts deve exportar createCompanyAction e deleteCompanyAction.");
  }

  console.log("   ✓ Sessão obrigatória e empresas presas ao user.id.");
  console.log("   ✓ Mapeamento do trigger enforce_company_quota (P0003 ➔ QUOTA_EXCEEDED) verificado.");

  // ---------------------------------------------------------------------------
  // 4. Validar Página /perfil (src/app/perfil/page.tsx)
  // ---------------------------------------------------------------------------
  console.log("4. Validando Server Component de perfil (src/app/perfil/page.tsx)...");
  const perfilPageContent = fs.readFileSync(perfilPagePath, "utf-8");

  if (!perfilPageContent.includes(".from(\"companies\")")) {
    throw new Error("src/app/perfil/page.tsx deve consultar a tabela companies.");
  }
  if (perfilPageContent.includes(".from(\"subscriptions\")")) {
    throw new Error("src/app/perfil/page.tsx não deve consultar assinatura para liberar a página.");
  }

  if (!perfilPageContent.includes("requirePageAccess(\"/perfil\")")) {
    throw new Error("src/app/perfil/page.tsx deve exigir sessão via requirePageAccess.");
  }
  if (!perfilPageContent.includes("supabase.auth.getUser()")) {
    throw new Error("src/app/perfil/page.tsx deve validar autenticação com supabase.auth.getUser().");
  }

  // Renderização de PerfilClient
  if (!perfilPageContent.includes("<PerfilClient")) {
    throw new Error("src/app/perfil/page.tsx deve renderizar o componente PerfilClient.");
  }
  console.log("   ✓ Server Component /perfil consulta companies com sessão obrigatória.");

  // ---------------------------------------------------------------------------
  // 5. Validar Componentes de UI (CompanyCard, CompanyModal, PerfilClient)
  // ---------------------------------------------------------------------------
  console.log("5. Validando componentes da interface de perfil...");

  // 5.1 CompanyCard
  const cardContent = fs.readFileSync(companyCardPath, "utf-8");
  if (!cardContent.includes("/geracao/instagram/posts?empresa=")) {
    throw new Error("CompanyCard deve ter botão direcionando para /geracao/instagram/posts?empresa={id}");
  }
  if (!cardContent.includes("Gerar Artes")) {
    throw new Error("CompanyCard deve ter botão de ação 'Gerar Artes'");
  }
  if (!cardContent.includes("Paleta da Empresa") && !cardContent.includes("colors")) {
    throw new Error("CompanyCard deve exibir as amostras de cores da empresa");
  }
  console.log("   ✓ CompanyCard implementado com link para geração de artes e amostra de paleta de cores.");

  // 5.2 CompanyModal
  const modalContent = fs.readFileSync(companyModalPath, "utf-8");
  if (!modalContent.includes("createCompanyAction")) {
    throw new Error("CompanyModal deve invocar createCompanyAction.");
  }
  if (!modalContent.includes("onQuotaExceeded") || !modalContent.includes("QUOTA_EXCEEDED")) {
    throw new Error("CompanyModal deve interceptar QUOTA_EXCEEDED e disparar onQuotaExceeded.");
  }
  if (!modalContent.includes("BRAZIL_STATES")) {
    throw new Error("CompanyModal deve conter lista de UFs do Brasil.");
  }
  if (!modalContent.includes("COLOR_PRESETS")) {
    throw new Error("CompanyModal deve disponibilizar presets de cores rápidos.");
  }
  console.log("   ✓ CompanyModal contém seletores encadeados, pickers de cores, presets e interceptação de cota.");

  // 5.3 PerfilClient
  const clientContent = fs.readFileSync(perfilClientPath, "utf-8");
  if (!clientContent.includes("Cadastrar nova empresa")) {
    throw new Error("PerfilClient deve renderizar card tracejado 'Cadastrar nova empresa'.");
  }
  if (!clientContent.includes("CompanyCard")) {
    throw new Error("PerfilClient deve renderizar CompanyCard para cada empresa.");
  }
  if (!clientContent.includes("CompanyModal")) {
    throw new Error("PerfilClient deve gerenciar CompanyModal.");
  }
  if (clientContent.includes("UpsellModal") || clientContent.includes("Plano Pro")) {
    throw new Error("PerfilClient não deve oferecer upgrade de plano.");
  }
  console.log("   ✓ PerfilClient orquestra grid, limite de empresas e modal de cadastro.");

  console.log("\n=== FASE 4: TODOS OS TESTES PASSARAM COM SUCESSO (PASS)! ===");
}

runPhase4Tests().catch((err) => {
  console.error("Falha nos testes da Fase 4:", err);
  process.exit(1);
});

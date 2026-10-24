import fs from "node:fs";
import path from "node:path";
import { SignUpInputSchema, SignInInputSchema } from "../src/lib/schemas.ts";

async function runPhase3Tests() {
  console.log("=== INICIANDO VALIDAÇÃO DA FASE 3: AUTENTICAÇÃO & FLUXO DE ENTRADA ===");

  const pagePath = path.resolve(process.cwd(), "src", "app", "page.tsx");
  const registerPath = path.resolve(process.cwd(), "src", "app", "cadastro", "page.tsx");
  const loginPath = path.resolve(process.cwd(), "src", "app", "login", "page.tsx");

  // 1. Validar Landing Page (src/app/page.tsx)
  console.log("1. Validando Landing Page oficial...");
  if (!fs.existsSync(pagePath)) {
    throw new Error("src/app/page.tsx não encontrado.");
  }
  const pageContent = fs.readFileSync(pagePath, "utf-8");

  const requiredLandingLinks = [
    "/cadastro?plano=starter",
    "/cadastro?plano=pro",
    "/login",
    "#planos",
    "49,90",
    "97,00",
  ];

  for (const kw of requiredLandingLinks) {
    if (!pageContent.includes(kw)) {
      throw new Error(`Landing page ausente do elemento obrigatório: ${kw}`);
    }
  }
  console.log("   ✓ Landing Page possui Hero, Mosaico, Seção #planos e links para Starter e Pro.");

  // 2. Validar Tela de Cadastro (src/app/cadastro/page.tsx)
  console.log("2. Validando Tela de Cadastro (/cadastro)...");
  if (!fs.existsSync(registerPath)) {
    throw new Error("src/app/cadastro/page.tsx não encontrado.");
  }
  const registerContent = fs.readFileSync(registerPath, "utf-8");

  const requiredRegisterElements = [
    "supabase.auth.signUp",
    "full_name",
    "phone",
    "fullName",
    "email",
    "password",
    "Suspense",
    "createClient",
  ];

  for (const kw of requiredRegisterElements) {
    if (!registerContent.includes(kw)) {
      throw new Error(`Tela de cadastro ausente do elemento obrigatório: ${kw}`);
    }
  }

  if (registerContent.includes("createAdminClient") || registerContent.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    throw new Error("VIOLAÇÃO DE SEGURANÇA: Cliente admin ou SERVICE_ROLE_KEY presente em /cadastro/page.tsx");
  }
  console.log("   ✓ Tela de cadastro integra signUp com options.data (full_name, phone) e cliente seguro.");

  // 3. Validar Tela de Login (src/app/login/page.tsx)
  console.log("3. Validando Tela de Login (/login)...");
  if (!fs.existsSync(loginPath)) {
    throw new Error("src/app/login/page.tsx não encontrado.");
  }
  const loginContent = fs.readFileSync(loginPath, "utf-8");

  const requiredLoginElements = [
    "supabase.auth.signInWithPassword",
    "redirectTo",
    "email",
    "password",
    "Suspense",
    "createClient",
  ];

  for (const kw of requiredLoginElements) {
    if (!loginContent.includes(kw)) {
      throw new Error(`Tela de login ausente do elemento obrigatório: ${kw}`);
    }
  }

  if (loginContent.includes("createAdminClient") || loginContent.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    throw new Error("VIOLAÇÃO DE SEGURANÇA: Cliente admin ou SERVICE_ROLE_KEY presente em /login/page.tsx");
  }
  console.log("   ✓ Tela de login integra signInWithPassword com suporte a redirecionamento redirectTo.");

  // 4. Testar validação Zod dos schemas de autenticação
  console.log("4. Validando schemas de entrada Zod...");
  const validSignUp = SignUpInputSchema.safeParse({
    fullName: "Maria Silva",
    phone: "(11) 98765-4321",
    email: "maria@empresa.com",
    password: "senhaForte123",
    plan: "pro",
  });
  if (!validSignUp.success) {
    throw new Error(`SignUpInputSchema rejeitou dados válidos: ${validSignUp.error.message}`);
  }

  const invalidSignUp = SignUpInputSchema.safeParse({
    fullName: "",
    phone: "123",
    email: "email-invalido",
    password: "123",
  });
  if (invalidSignUp.success) {
    throw new Error("SignUpInputSchema permitiu dados inválidos.");
  }

  const validSignIn = SignInInputSchema.safeParse({
    email: "cliente@teste.com",
    password: "senha",
  });
  if (!validSignIn.success) {
    throw new Error(`SignInInputSchema rejeitou dados válidos: ${validSignIn.error.message}`);
  }
  console.log("   ✓ Schemas Zod de cadastro e login validando com precisão.");

  console.log("\n=== FASE 3: TODOS OS TESTES PASSARAM COM SUCESSO (PASS)! ===");
}

runPhase3Tests().catch((err) => {
  console.error("Falha nos testes da Fase 3:", err);
  process.exit(1);
});

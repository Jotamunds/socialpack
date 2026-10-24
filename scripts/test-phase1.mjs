import { updateSession } from "../src/middleware.ts";
import { NextRequest } from "next/server";

// Teste das rotas e regras do middleware
async function runTests() {
  console.log("=== INICIANDO TESTES DO MIDDLEWARE (FASE 1) ===");

  // 1. Rota protegida sem autenticação (/perfil)
  const reqPerfil = new NextRequest("http://localhost:3000/perfil");
  const resPerfil = await updateSession(reqPerfil);
  const locationPerfil = resPerfil.headers.get("location");
  console.log("1. /perfil -> Location:", locationPerfil);
  if (!locationPerfil?.includes("/login?redirectTo=%2Fperfil") && !locationPerfil?.includes("/login?redirectTo=/perfil")) {
    throw new Error("Falha no teste: /perfil deveria redirecionar para /login?redirectTo=/perfil");
  }

  // 2. Rota protegida aninhada (/geracao/instagram/posts)
  const reqGeracao = new NextRequest("http://localhost:3000/geracao/instagram/posts");
  const resGeracao = await updateSession(reqGeracao);
  const locationGeracao = resGeracao.headers.get("location");
  console.log("2. /geracao/instagram/posts -> Location:", locationGeracao);
  if (!locationGeracao?.includes("/login?redirectTo=%2Fgeracao%2Finstagram%2Fposts") && !locationGeracao?.includes("/login?redirectTo=/geracao/instagram/posts")) {
    throw new Error("Falha no teste: /geracao/instagram/posts deveria redirecionar para /login");
  }

  // 3. Rota protegida (/configuracoes)
  const reqConfig = new NextRequest("http://localhost:3000/configuracoes");
  const resConfig = await updateSession(reqConfig);
  const locationConfig = resConfig.headers.get("location");
  console.log("3. /configuracoes -> Location:", locationConfig);
  if (!locationConfig?.includes("/login?redirectTo=%2Fconfiguracoes") && !locationConfig?.includes("/login?redirectTo=/configuracoes")) {
    throw new Error("Falha no teste: /configuracoes deveria redirecionar para /login");
  }

  // 4. Rota pública Landing Page (/)
  const reqHome = new NextRequest("http://localhost:3000/");
  const resHome = await updateSession(reqHome);
  const locationHome = resHome.headers.get("location");
  console.log("4. / (Landing Page) -> Location:", locationHome ?? "(Sem redirecionamento - rota pública acessível)");
  if (locationHome) {
    throw new Error("Falha no teste: / deveria ser pública e não redirecionar");
  }

  console.log("\n TODOS OS TESTES DO MIDDLEWARE PASSARAM COM SUCESSO!");
}

runTests().catch((err) => {
  console.error("Erro nos testes:", err);
  process.exit(1);
});

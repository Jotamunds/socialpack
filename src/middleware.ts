import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeInternalRedirect } from "@/lib/safe-redirect";

function isClosedSignupRoute(pathname: string): boolean {
  return pathname === "/cadastro" || pathname.startsWith("/cadastro/");
}

function redirectToLogin(request: NextRequest, supabaseResponse: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = safeInternalRedirect("/login");
  url.search = "";
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
  });
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/geracao") ||
    pathname.startsWith("/configuracoes");

  const isAuthRoute =
    pathname === "/login" || pathname === "/cadastro";

  // Cadastro público fechado: /cadastro não renderiza formulário.
  // Sem Supabase, o redirect acontece antes de qualquer sessão.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isClosedSignupRoute(pathname)) {
      return redirectToLogin(request, supabaseResponse);
    }
    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Validar usuário autenticado via Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cadastro público fechado. Visitante sem sessão vai para /login.
  // Quem já está autenticado segue no bloco abaixo, para a área do app.
  if (!user && isClosedSignupRoute(pathname)) {
    return redirectToLogin(request, supabaseResponse);
  }

  // 1. Não autenticado acessando rota protegida -> /login?redirectTo=...
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // 2. Autenticado acessando /login ou /cadastro -> redirecionar para /geracao/instagram/posts.
  // Server action (cabeçalho next-action) é POST nesta mesma rota e precisa da resposta da action.
  if (user && isAuthRoute && !request.headers.has("next-action")) {
    const url = request.nextUrl.clone();
    url.pathname = "/geracao/instagram/posts";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // 3. Rota raiz / (Landing Page) e outras rotas públicas permanecem acessíveis
  return supabaseResponse;
}

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Ignora arquivos estáticos: _next/static, _next/image, favicon.ico e imagens
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

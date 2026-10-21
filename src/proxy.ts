import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-token";

// Checagem otimista: apenas redireciona. As rotas de API validam a sessão de novo.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const email = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/dashboard") && !email) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && email) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};

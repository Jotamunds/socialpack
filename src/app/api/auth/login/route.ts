import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/auth-token";
import { checkCredentials } from "@/lib/session";
import { createClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    const supabase = createClient();
    let authenticated = false;
    let authErrorMsg = "E-mail ou senha incorretos.";

    if (supabase) {
      // Validação real usando o Supabase Auth diretamente
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.session) {
        authenticated = true;
      } else {
        if (error?.message) {
          authErrorMsg = error.message;
        }
        // Fallback seguro caso as credenciais locais correspondam ao .env (ex: demo/testes)
        if (checkCredentials(email, password)) {
          authenticated = true;
        }
      }
    } else {
      // Fallback caso as chaves do Supabase ainda não estejam configuradas no ambiente
      if (checkCredentials(email, password)) {
        authenticated = true;
      }
    }

    if (!authenticated) {
      return NextResponse.json({ error: authErrorMsg }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(email.toLowerCase()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error: unknown) {
    console.error("[Login API] Erro ao autenticar:", error);
    const msg = error instanceof Error ? error.message : "Erro interno no servidor ao realizar login.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
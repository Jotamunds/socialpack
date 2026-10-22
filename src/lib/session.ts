import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionPayload, verifySessionToken } from "./auth-token";

/** Lê o cookie de sessão e devolve o e-mail do usuário autenticado (ou `null`). */
export async function getSessionEmail() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Lê o cookie de sessão e devolve os dados autenticados completos (e-mail, plano, status). */
export async function getSessionPayload() {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    return verifySessionPayload(token);
  } catch {
    return null;
  }
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Confere as credenciais com as definidas em AUTH_EMAIL / AUTH_PASSWORD. */
export function checkCredentials(email: string, password: string) {
  const expectedEmail = process.env.AUTH_EMAIL ?? "";
  const expectedPassword = process.env.AUTH_PASSWORD ?? "";
  if (!expectedEmail || !expectedPassword) return false;

  const emailOk = safeEqual(email.trim().toLowerCase(), expectedEmail.toLowerCase());
  const passwordOk = safeEqual(password, expectedPassword);
  return emailOk && passwordOk;
}

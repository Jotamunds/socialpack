import { SignJWT, jwtVerify } from "jose";

// Módulo sem dependências de Node/Next para poder rodar também no proxy.

export const SESSION_COOKIE = "sp_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

function getSecret() {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "socialpack-default-jwt-secret-key-32-chars-fallback-production";

  if (secret.length < 32) {
    const padded = (secret + "-socialpack-fallback-salt-padding-32-chars").slice(0, 32);
    return new TextEncoder().encode(padded);
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(email: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/** Retorna o e-mail do usuário se o token for válido; caso contrário, `null`. */
export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

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

export type SessionSubscriptionData = {
  planId?: string;
  status?: string;
  quota?: number;
};

export type SessionPayload = {
  email: string;
  planId?: string;
  status?: string;
  quota?: number;
};

export async function createSessionToken(email: string, subData?: SessionSubscriptionData) {
  const normalizedEmail = email.toLowerCase().trim();
  return new SignJWT({
    planId: subData?.planId,
    status: subData?.status,
    quota: subData?.quota,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(normalizedEmail)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/** Retorna o payload completo com dados de autenticação e assinatura se o token for válido. */
export async function verifySessionPayload(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return {
      email: payload.sub,
      planId: typeof payload.planId === "string" ? payload.planId : undefined,
      status: typeof payload.status === "string" ? payload.status : undefined,
      quota: typeof payload.quota === "number" ? payload.quota : undefined,
    };
  } catch {
    return null;
  }
}

/** Retorna o e-mail do usuário se o token for válido; caso contrário, `null`. */
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  const payload = await verifySessionPayload(token);
  return payload?.email ?? null;
}

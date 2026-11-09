/**
 * Sanitiza mensagens de erro públicas (zero information leakage).
 * Teto: 480 caracteres.
 */
export function sanitizePublicErrorMessage(err: unknown): string {
  if (!err) return "Something went wrong while processing the request.";
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("P0003") || msg.toLowerCase().includes("limite de empresas")) {
    return "Company limit reached.";
  }
  if (msg.includes("P0002") || msg.toLowerCase().includes("assinatura")) {
    return "Subscription inactive or expired.";
  }
  if (msg.includes("JWT") || msg.includes("apikey") || msg.includes("service_role")) {
    return "Authorization failed.";
  }
  if (msg.includes("22000") || msg.toLowerCase().includes("transição")) {
    return "This post can't change status.";
  }
  if (msg.toLowerCase().includes("daily_pack_limit") || msg.toLowerCase().includes("limite diário")) {
    return "Daily generation limit reached for this company.";
  }

  let sanitized = msg.replace(/:\/\/[^:]+:[^@]+@/gi, "://[hidden-credentials]@");
  sanitized = sanitized.replace(/[a-zA-Z]:\\[^:\s]+/gi, "[local-path]");
  sanitized = sanitized.replace(/\/(Users|home|var|tmp|etc|usr|opt)\/[^\s]+/gi, "[local-path]");
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [hidden]");

  return sanitized.slice(0, 480);
}

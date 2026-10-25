/**
 * Sanitiza mensagens de erro públicas (zero information leakage).
 * Teto: 480 caracteres.
 */
export function sanitizePublicErrorMessage(err: unknown): string {
  if (!err) return "Erro desconhecido ao processar requisição.";
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("P0003") || msg.toLowerCase().includes("limite de empresas")) {
    return "Limite de empresas atingido para o seu plano.";
  }
  if (msg.includes("P0002") || msg.toLowerCase().includes("assinatura")) {
    return "Assinatura inativa ou expirada.";
  }
  if (msg.includes("JWT") || msg.includes("apikey") || msg.includes("service_role")) {
    return "Falha de credenciais ou autorização interna.";
  }
  if (msg.includes("22000") || msg.toLowerCase().includes("transição")) {
    return "Transição de ciclo de vida do post inválida.";
  }
  if (msg.toLowerCase().includes("daily_pack_limit") || msg.toLowerCase().includes("limite diário")) {
    return "Limite diário de geração atingido para esta empresa.";
  }

  let sanitized = msg.replace(/:\/\/[^:]+:[^@]+@/gi, "://[credenciais-ocultas]@");
  sanitized = sanitized.replace(/[a-zA-Z]:\\[^:\s]+/gi, "[caminho-local]");
  sanitized = sanitized.replace(/\/(Users|home|var|tmp|etc|usr|opt)\/[^\s]+/gi, "[caminho-local]");
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [oculto]");

  return sanitized.slice(0, 480);
}

import "server-only";

/**
 * Valida que um caminho do bucket generated-arts pertence ao userId da sessão.
 * Rejeita path vazio, travessia (..), caminho absoluto e primeiro segmento ≠ userId.
 */
export function assertOwnedStoragePath(
  userId: string,
  path: string | null | undefined
): string {
  if (!userId) {
    throw new Error("Account ID is required to check this file path.");
  }

  if (typeof path !== "string" || !path.trim()) {
    throw new Error("Missing or invalid file path.");
  }

  const normalized = path.trim().replace(/\\/g, "/");

  if (normalized.startsWith("/") || normalized.includes("://")) {
    throw new Error("That file path isn't allowed.");
  }

  if (normalized.split("/").some((segment) => segment === ".." || segment === "")) {
    throw new Error("That file path isn't allowed.");
  }

  const firstSegment = normalized.split("/")[0];
  if (firstSegment !== userId) {
    throw new Error("That file doesn't belong to this account.");
  }

  return normalized;
}

/**
 * Retorna o path validado ou null quando o arquivo ainda não existe / não passa na checagem.
 * Não lança: útil em listagens onde um post inválido deve ser omitido da URL assinada.
 */
export function getOwnedStoragePathOrNull(
  userId: string,
  path: string | null | undefined
): string | null {
  try {
    return assertOwnedStoragePath(userId, path);
  } catch {
    return null;
  }
}

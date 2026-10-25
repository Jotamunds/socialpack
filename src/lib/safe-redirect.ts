const FALLBACK_PATH = "/perfil";

const SCHEME = /[a-z][a-z0-9+.-]*:/i;
const LINE_BREAK = /[\r\n\u2028\u2029]/;

/**
 * Caminho interno para o pós-login.
 * Aceita só path que começa com `/` e não é protocol-relative, com barra invertida,
 * esquema ou quebra de linha. Qualquer outro valor volta para /perfil.
 */
export function safeInternalRedirect(value: string | null | undefined): string {
  if (!value) return FALLBACK_PATH;

  const path = value.trim();
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\") ||
    SCHEME.test(path) ||
    LINE_BREAK.test(path)
  ) {
    return FALLBACK_PATH;
  }

  return path;
}

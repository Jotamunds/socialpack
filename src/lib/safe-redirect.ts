const FALLBACK_PATH = "/perfil";

const SCHEME = /[a-z][a-z0-9+.-]*:/i;
const CONTROL_CHAR = /[\u0000-\u001f\u007f\u2028\u2029]/;

/**
 * Caminho interno para o pós-login.
 * Aceita só path que começa com `/` e não é protocol-relative, com barra invertida,
 * esquema ou caractere de controle. Qualquer outro valor volta para /perfil.
 */
export function safeInternalRedirect(value: string | null | undefined): string {
  if (!value) return FALLBACK_PATH;

  const path = value.trim();
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\") ||
    SCHEME.test(path) ||
    CONTROL_CHAR.test(path)
  ) {
    return FALLBACK_PATH;
  }

  return path;
}

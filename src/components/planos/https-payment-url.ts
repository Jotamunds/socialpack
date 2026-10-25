/** Aceita só URL https absoluta. Não fixa domínio de cobrança. */
export function isHttpsPaymentUrl(value: string | null | undefined): value is string {
  if (typeof value !== "string" || value.length === 0) return false;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

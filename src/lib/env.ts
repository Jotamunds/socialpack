import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY é obrigatória no ambiente de servidor"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL deve ser uma URL válida").optional(),
  ASAAS_API_KEY: z.string().min(1, "ASAAS_API_KEY não configurada").optional(),
  ASAAS_WEBHOOK_TOKEN: z.string().min(1, "ASAAS_WEBHOOK_TOKEN não configurado").optional(),
  ASAAS_ENV: z.enum(["sandbox", "production"]).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

/**
 * Valida e memoiza as variáveis de ambiente do servidor.
 * A service role é obrigatória — falha cedo no boot se estiver ausente.
 */
export function validateEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Configuração de ambiente inválida: ${details}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/** Alias explícito para o boot (instrumentation). */
export function assertServerEnv(): ServerEnv {
  return validateEnv();
}

/**
 * Retorna as credenciais e endpoint base do Asaas.
 * Dispara erro caso ASAAS_API_KEY não esteja configurada no momento da cobrança.
 */
export function getAsaasConfig() {
  const env = validateEnv();
  const apiKey = env.ASAAS_API_KEY || process.env.ASAAS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ASAAS_API_KEY não está configurada no ambiente. Configure a chave de API do Asaas."
    );
  }

  const isExplicitSandbox = env.ASAAS_ENV === "sandbox" || process.env.ASAAS_ENV === "sandbox";
  const isKeySandbox = apiKey.startsWith("$aact_hmlg_");
  const isSandbox = isExplicitSandbox || isKeySandbox;

  const baseUrl = isSandbox
    ? "https://api-sandbox.asaas.com/v3"
    : "https://api.asaas.com/v3";

  return {
    apiKey,
    baseUrl,
    isSandbox,
    webhookToken: env.ASAAS_WEBHOOK_TOKEN || process.env.ASAAS_WEBHOOK_TOKEN || "",
  };
}

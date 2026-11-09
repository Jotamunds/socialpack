/**
 * Limites por usuário. A geração semanal renderiza 7 artes; 4 por hora cobre
 * as 3 empresas e uma nova tentativa, e 12 por dia acompanha o teto já
 * existente (3 empresas × 4 pacotes). O ZIP baixa até 30 arquivos: 6 por hora
 * e 24 por dia. Env ausente ou inválida usa estes números.
 */
export const RATE_LIMIT_DEFAULTS = {
  weeklyPerHour: 4,
  weeklyPerDay: 12,
  historyZipPerHour: 6,
  historyZipPerDay: 24,
} as const;

export const RATE_LIMIT_EXCEEDED_MESSAGE =
  "Too many requests. Try again in a few minutes.";

export const RATE_LIMIT_UNAVAILABLE_MESSAGE =
  "We couldn't process the request right now. Try again in a few minutes.";

export const RATE_LIMIT_SCOPE = {
  weeklyGenerate: "weekly_generate",
  historyZip: "history_zip",
} as const;

export type RateLimitScope = (typeof RATE_LIMIT_SCOPE)[keyof typeof RATE_LIMIT_SCOPE];

const WINDOW_HOUR_SECONDS = 3600;
const WINDOW_DAY_SECONDS = 86400;
const LIMIT_MIN = 1;
const LIMIT_MAX = 10_000;
const FAIL_CLOSED_RETRY_AFTER_SECONDS = 60;
const MAX_RETRY_AFTER_SECONDS = WINDOW_DAY_SECONDS;

const USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RateLimitWindow = {
  window_seconds: typeof WINDOW_HOUR_SECONDS | typeof WINDOW_DAY_SECONDS;
  limit: number;
};

export type RateLimitDecision =
  | { allowed: true }
  | {
      allowed: false;
      status: 429 | 503;
      retryAfterSeconds: number;
      message: string;
    };

export function isRateLimitUserId(userId: string): boolean {
  return USER_ID_PATTERN.test(userId);
}

export function parseOptionalPositiveInt(raw: string | undefined, fallback: number): number {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!/^[0-9]+$/.test(trimmed)) return fallback;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < LIMIT_MIN || value > LIMIT_MAX) return fallback;
  return value;
}

export function windowsForScope(
  scope: RateLimitScope,
  env: { [key: string]: string | undefined } = process.env
): readonly [RateLimitWindow, RateLimitWindow] {
  switch (scope) {
    case RATE_LIMIT_SCOPE.weeklyGenerate:
      return [
        {
          window_seconds: WINDOW_HOUR_SECONDS,
          limit: parseOptionalPositiveInt(
            env.RATE_LIMIT_WEEKLY_PER_HOUR,
            RATE_LIMIT_DEFAULTS.weeklyPerHour
          ),
        },
        {
          window_seconds: WINDOW_DAY_SECONDS,
          limit: parseOptionalPositiveInt(
            env.RATE_LIMIT_WEEKLY_PER_DAY,
            RATE_LIMIT_DEFAULTS.weeklyPerDay
          ),
        },
      ];
    case RATE_LIMIT_SCOPE.historyZip:
      return [
        {
          window_seconds: WINDOW_HOUR_SECONDS,
          limit: parseOptionalPositiveInt(
            env.RATE_LIMIT_HISTORY_ZIP_PER_HOUR,
            RATE_LIMIT_DEFAULTS.historyZipPerHour
          ),
        },
        {
          window_seconds: WINDOW_DAY_SECONDS,
          limit: parseOptionalPositiveInt(
            env.RATE_LIMIT_HISTORY_ZIP_PER_DAY,
            RATE_LIMIT_DEFAULTS.historyZipPerDay
          ),
        },
      ];
    default: {
      const unreachable: never = scope;
      return unreachable;
    }
  }
}

function unavailableDecision(): RateLimitDecision {
  return {
    allowed: false,
    status: 503,
    retryAfterSeconds: FAIL_CLOSED_RETRY_AFTER_SECONDS,
    message: RATE_LIMIT_UNAVAILABLE_MESSAGE,
  };
}

function normalizeRetryAfter(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return FAIL_CLOSED_RETRY_AFTER_SECONDS;
  }
  if (value > MAX_RETRY_AFTER_SECONDS) return MAX_RETRY_AFTER_SECONDS;
  return value;
}

/** Lê o jsonb da RPC. Payload inesperado fecha a rota (não libera o trabalho). */
export function interpretConsumeResult(data: unknown): RateLimitDecision {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return unavailableDecision();
  }

  const record = data as Record<string, unknown>;
  if (record.allowed === true) return { allowed: true };
  if (record.allowed !== false) return unavailableDecision();

  return {
    allowed: false,
    status: 429,
    retryAfterSeconds: normalizeRetryAfter(record.retry_after_seconds),
    message: RATE_LIMIT_EXCEEDED_MESSAGE,
  };
}

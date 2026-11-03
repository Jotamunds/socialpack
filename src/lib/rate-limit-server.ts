import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  interpretConsumeResult,
  isRateLimitUserId,
  type RateLimitDecision,
  type RateLimitScope,
  windowsForScope,
} from "@/lib/rate-limit";

export { RATE_LIMIT_SCOPE } from "@/lib/rate-limit";

/**
 * Consome o limite do user.id já confirmado por auth.getUser().
 * Falha do contador devolve 503: a rota não segue para o trabalho caro.
 */
export async function consumeUserRateLimit(
  userId: string,
  scope: RateLimitScope
): Promise<RateLimitDecision> {
  if (!isRateLimitUserId(userId)) {
    console.error("Falha ao consultar limite de uso.");
    return interpretConsumeResult(null);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_user_rate_limit", {
      p_user_id: userId,
      p_scope: scope,
      p_windows: windowsForScope(scope),
    });

    if (error || data == null) {
      console.error("Falha ao consultar limite de uso.");
      return interpretConsumeResult(null);
    }

    const decision = interpretConsumeResult(data);
    if (!decision.allowed && decision.status === 503) {
      console.error("Falha ao consultar limite de uso.");
    }
    return decision;
  } catch {
    console.error("Falha ao consultar limite de uso.");
    return interpretConsumeResult(null);
  }
}

export function rateLimitDeniedResponse(
  decision: Exclude<RateLimitDecision, { allowed: true }>
): NextResponse {
  return NextResponse.json(
    { ok: false, error: decision.message },
    {
      status: decision.status,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(decision.retryAfterSeconds),
      },
    }
  );
}

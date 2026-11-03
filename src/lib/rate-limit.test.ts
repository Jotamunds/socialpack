import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  interpretConsumeResult,
  isRateLimitUserId,
  parseOptionalPositiveInt,
  RATE_LIMIT_DEFAULTS,
  RATE_LIMIT_EXCEEDED_MESSAGE,
  RATE_LIMIT_SCOPE,
  RATE_LIMIT_UNAVAILABLE_MESSAGE,
  windowsForScope,
} from "./rate-limit";

const USER_ID = "11111111-1111-4111-8111-111111111111";

describe("rate limit env", () => {
  it("usa o padrão quando a env falta ou é inválida", () => {
    assert.equal(parseOptionalPositiveInt(undefined, 4), 4);
    assert.equal(parseOptionalPositiveInt("", 4), 4);
    assert.equal(parseOptionalPositiveInt("  ", 4), 4);
    assert.equal(parseOptionalPositiveInt("0", 4), 4);
    assert.equal(parseOptionalPositiveInt("-3", 4), 4);
    assert.equal(parseOptionalPositiveInt("1.5", 4), 4);
    assert.equal(parseOptionalPositiveInt("4e1", 4), 4);
    assert.equal(parseOptionalPositiveInt("abc", 4), 4);
    assert.equal(parseOptionalPositiveInt("10001", 4), 4);
    assert.equal(parseOptionalPositiveInt(" 8 ", 4), 8);
    assert.equal(parseOptionalPositiveInt("10000", 4), 10000);
  });

  it("monta hora e dia sem misturar geração e ZIP", () => {
    const weekly = windowsForScope(RATE_LIMIT_SCOPE.weeklyGenerate, {
      RATE_LIMIT_WEEKLY_PER_HOUR: "2",
      RATE_LIMIT_WEEKLY_PER_DAY: "nope",
      RATE_LIMIT_HISTORY_ZIP_PER_HOUR: "99",
    });
    assert.deepEqual(weekly, [
      { window_seconds: 3600, limit: 2 },
      { window_seconds: 86400, limit: RATE_LIMIT_DEFAULTS.weeklyPerDay },
    ]);

    const zip = windowsForScope(RATE_LIMIT_SCOPE.historyZip, {});
    assert.deepEqual(zip, [
      { window_seconds: 3600, limit: RATE_LIMIT_DEFAULTS.historyZipPerHour },
      { window_seconds: 86400, limit: RATE_LIMIT_DEFAULTS.historyZipPerDay },
    ]);
  });
});

describe("rate limit decision", () => {
  it("aceita só o user.id no formato uuid", () => {
    assert.equal(isRateLimitUserId(USER_ID), true);
    assert.equal(isRateLimitUserId("user-1"), false);
    assert.equal(isRateLimitUserId(`${USER_ID} extra`), false);
  });

  it("responde 429 com a mensagem fixa quando o contador recusa", () => {
    const decision = interpretConsumeResult({ allowed: false, retry_after_seconds: 90 });
    assert.deepEqual(decision, {
      allowed: false,
      status: 429,
      retryAfterSeconds: 90,
      message: RATE_LIMIT_EXCEEDED_MESSAGE,
    });
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.ok(decision.message.length <= 180);
      assert.equal(decision.message, "Muitas solicitações. Tente novamente em alguns minutos.");
    }
  });

  it("fecha quando o payload do contador não é confiável", () => {
    for (const payload of [null, undefined, [], { allowed: "false" }, { allowed: false, retry_after_seconds: "90" }]) {
      const decision = interpretConsumeResult(payload);
      assert.equal(decision.allowed, false);
      if (!decision.allowed) {
        assert.equal(decision.status, payload && !Array.isArray(payload) && (payload as { allowed?: unknown }).allowed === false ? 429 : 503);
        if (decision.status === 503) {
          assert.equal(decision.message, RATE_LIMIT_UNAVAILABLE_MESSAGE);
          assert.equal(decision.retryAfterSeconds, 60);
        }
      }
    }

    const overDay = interpretConsumeResult({ allowed: false, retry_after_seconds: 999999 });
    assert.equal(overDay.allowed, false);
    if (!overDay.allowed) assert.equal(overDay.retryAfterSeconds, 86400);

    assert.deepEqual(interpretConsumeResult({ allowed: true, retry_after_seconds: 10 }), { allowed: true });
  });
});

describe("rate limit wiring", () => {
  it("só libera a geração depois da sessão e antes do render", () => {
    const source = readFileSync(new URL("../app/api/generate/weekly/route.ts", import.meta.url), "utf8");
    const unauthorizedAt = source.indexOf("status: 401");
    const limitAt = source.indexOf("consumeUserRateLimit(user.id, RATE_LIMIT_SCOPE.weeklyGenerate)");
    const bodyAt = source.indexOf("request.json(");
    const renderAt = source.indexOf("renderPostToPngBuffer(");
    assert.ok(unauthorizedAt !== -1 && limitAt > unauthorizedAt && bodyAt > limitAt && renderAt > bodyAt);
    const line = source.split("\n").find((row) => row.includes("consumeUserRateLimit("));
    assert.match(line ?? "", /user\.id/);
    assert.equal(line?.includes("companyId"), false);
  });

  it("a migration não abre o contador para o cliente", () => {
    const sql = readFileSync(
      new URL("../../supabase/migrations/20261103231432_user_rate_limit.sql", import.meta.url),
      "utf8"
    );
    assert.match(sql, /security definer/);
    assert.match(sql, /set search_path = ''/);
    assert.match(sql, /enable row level security/);
    assert.match(sql, /revoke all on table public\.user_rate_limit_buckets from anon/);
    assert.match(sql, /revoke all on table public\.user_rate_limit_buckets from authenticated/);
    assert.match(sql, /revoke all on table public\.user_rate_limit_buckets from service_role/);
    assert.match(sql, /auth\.role\(\) is distinct from 'service_role'/);
    assert.match(sql, /auth\.uid\(\) is distinct from p_user_id/);
    assert.match(
      sql,
      /grant execute on function public\.consume_user_rate_limit\(uuid, text, jsonb\) to service_role;/
    );
    assert.doesNotMatch(sql, /create policy/i);
    assert.doesNotMatch(sql, /grant\s+(select|insert|update|delete|all)/i);
    assert.doesNotMatch(sql, /grant execute[^;]*authenticated/i);
  });
});

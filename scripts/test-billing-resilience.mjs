import { spawnSync } from "node:child_process";
import Module from "node:module";

// Se executado diretamente com "node scripts/test-billing-resilience.mjs", delega para tsx garantindo resolução TS
if (!process.env.__TSX_RUNNING__) {
  const result = spawnSync("npx", ["tsx", "scripts/test-billing-resilience.mjs"], {
    shell: true,
    stdio: "pipe",
    encoding: "utf-8",
    env: { ...process.env, __TSX_RUNNING__: "1" },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 0);
}

// Interceptar server-only para execução segura em ambiente de teste Node
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.apply(this, [request, ...args]);
};

import assert from "node:assert/strict";

/**
 * Cria um cliente Supabase simulado em memória com suporte às operações reais
 * utilizadas pelo processAsaasWebhookEvent e pelas Server Actions.
 */
function createMockSupabaseAdmin(initialData = {}) {
  const tables = {
    billing_webhook_events: new Map(initialData.webhook_events || []),
    subscriptions: new Map(initialData.subscriptions || []),
    billing_payments: new Map(initialData.payments || []),
  };

  let failNextUpdateSubscriptions = false;
  let failNextUpsertPayments = false;
  let failNextRpc = false;

  const client = {
    tables,
    setFailNextRpc(val) {
      failNextRpc = val;
    },
    setFailNextUpdateSubscriptions(val) {
      failNextUpdateSubscriptions = val;
    },
    setFailNextUpsertPayments(val) {
      failNextUpsertPayments = val;
    },
    async rpc(fnName, params) {
      if (failNextRpc) {
        failNextRpc = false;
        return { data: null, error: new Error("RPC acquire_billing_webhook_event indisponível (falha simulada)") };
      }
      if (fnName === "acquire_billing_webhook_event") {
        const { p_event_id, p_event_type, p_payload, p_timeout_seconds = 60 } = params;
        const row = tables.billing_webhook_events.get(p_event_id);
        const now = new Date();

        if (!row) {
          tables.billing_webhook_events.set(p_event_id, {
            id: p_event_id,
            event: p_event_type,
            status: "processing",
            payload: p_payload,
            attempts: 1,
            created_at: now.toISOString(),
            last_attempt_at: now.toISOString(),
          });
          return { data: "acquired", error: null };
        }

        if (row.status === "processed") {
          return { data: "already_processed", error: null };
        }

        if (row.status === "processing") {
          const lastTime = new Date(row.last_attempt_at || row.created_at).getTime();
          const diffSec = (now.getTime() - lastTime) / 1000;
          if (diffSec < p_timeout_seconds) {
            return { data: "in_progress", error: null };
          }
        }

        // failed ou processing expirado
        row.status = "processing";
        row.attempts = (row.attempts || 1) + 1;
        row.last_attempt_at = now.toISOString();
        row.payload = p_payload;
        row.error_message = null;
        return { data: "acquired", error: null };
      }
      return { data: null, error: new Error(`RPC ${fnName} não implementada`) };
    },
    from(tableName) {
      const table = tables[tableName];
      if (!table) throw new Error(`Tabela inexistente no mock: ${tableName}`);

      return {
        select() {
          let filter = null;
          let orFilter = null;

          const query = {
            eq(col, val) {
              filter = { col, val };
              return query;
            },
            or(expr) {
              orFilter = expr;
              return query;
            },
            async maybeSingle() {
              if (filter) {
                for (const row of table.values()) {
                  if (row[filter.col] === filter.val) {
                    return { data: { ...row }, error: null };
                  }
                }
                return { data: null, error: null };
              }
              if (orFilter) {
                // Parsing de or expressions: "gateway_subscription_id.eq.X,previous_gateway_subscription_id.eq.X"
                const parts = orFilter.split(",").map((p) => p.trim());
                for (const row of table.values()) {
                  for (const part of parts) {
                    const match = part.match(/^([^.]+)\.eq\.(.+)$/);
                    if (match && row[match[1]] === match[2]) {
                      return { data: { ...row }, error: null };
                    }
                  }
                }
                return { data: null, error: null };
              }
              return { data: null, error: null };
            },
          };
          return query;
        },
        async insert(data) {
          if (table.has(data.id)) {
            return { error: { code: "23505", message: "duplicate key value" } };
          }
          table.set(data.id, { ...data });
          return { data, error: null };
        },
        update(data) {
          return {
            eq(col, val) {
              return {
                async maybeSingle() {
                  return this;
                },
                select() {
                  return this;
                },
                then(resolve) {
                  if (tableName === "subscriptions" && failNextUpdateSubscriptions) {
                    failNextUpdateSubscriptions = false;
                    resolve({ data: null, error: new Error("Falha simulada de persistência no Supabase") });
                    return;
                  }
                  for (const [k, row] of table.entries()) {
                    if (row[col] === val) {
                      const updated = { ...row, ...data };
                      table.set(k, updated);
                      resolve({ data: [{ ...updated }], error: null });
                      return;
                    }
                  }
                  resolve({ data: [], error: null });
                },
              };
            },
          };
        },
        async upsert(data, opts) {
          if (failNextUpsertPayments) {
            failNextUpsertPayments = false;
            return { error: new Error("Falha simulada no upsert de billing_payments") };
          }
          const conflictKey = opts?.onConflict || "id";
          let existingKey = null;
          for (const [k, row] of table.entries()) {
            if (row[conflictKey] === data[conflictKey]) {
              existingKey = k;
              break;
            }
          }
          const id = existingKey || data.id || `gen_${Date.now()}`;
          table.set(id, { ...table.get(id), ...data, id });
          return { data, error: null };
        },
      };
    },
  };

  return client;
}

async function runRealResilienceTests() {
  console.log("=== INICIANDO TESTES FUNCIONAIS REAIS DE RESILIÊNCIA E COBRANÇA ASAAS ===\n");

  const {
    addBusinessDays,
    calculatePeriodEnd,
    validatePaymentAmountForPlan,
  } = await import("../src/lib/billing/plans");

  const {
    processAsaasWebhookEvent,
  } = await import("../src/lib/billing/webhook-processor");

  // ==========================================================================
  // BLOCO 1: REGRAS DE DATAS, FINS DE MÊS, DIAS ÚTEIS E TOLERÂNCIA PÓS-CICLO
  // ==========================================================================
  console.log("[BLOCO 1] Validação de cálculo de período, fim de mês, ano bissexto e tolerância...");
  {
    // Cenário 1.1: 31 de janeiro num ano não bissexto (2026-01-31)
    // +1 mês civil: 2026-02-28 (Sábado).
    // +3 dias úteis: seg(02/03), ter(03/03), qua(04/03/2026).
    const endJan2026 = calculatePeriodEnd("2026-01-31");
    assert.equal(endJan2026.getUTCFullYear(), 2026);
    assert.equal(endJan2026.getUTCMonth(), 2); // Março (0-indexed: 2)
    assert.equal(endJan2026.getUTCDate(), 4);
    assert.equal(endJan2026.getUTCDay(), 3); // Quarta-feira

    // Cenário 1.2: 31 de janeiro num ano bissexto (2024-01-31)
    // +1 mês civil: 2024-02-29 (Quinta-feira).
    // +3 dias úteis: sex(01/03), seg(04/03), ter(05/03/2024).
    const endJan2024 = calculatePeriodEnd("2024-01-31");
    assert.equal(endJan2024.getUTCFullYear(), 2024);
    assert.equal(endJan2024.getUTCMonth(), 2); // Março
    assert.equal(endJan2024.getUTCDate(), 5);
    assert.equal(endJan2024.getUTCDay(), 2); // Terça-feira

    // Cenário 1.3: 29 de fevereiro num ano bissexto (2024-02-29)
    // +1 mês civil: 2024-03-29 (Sexta-feira).
    // +3 dias úteis: seg(01/04), ter(02/04), qua(03/04/2024).
    const endFeb2024 = calculatePeriodEnd("2024-02-29");
    assert.equal(endFeb2024.getUTCFullYear(), 2024);
    assert.equal(endFeb2024.getUTCMonth(), 3); // Abril (0-indexed: 3)
    assert.equal(endFeb2024.getUTCDate(), 3);
    assert.equal(endFeb2024.getUTCDay(), 3); // Quarta-feira

    // Cenário 1.4: 31 de agosto (2026-08-31)
    // +1 mês civil: 2026-09-30 (Quarta-feira).
    // +3 dias úteis: qui(01/10), sex(02/10), seg(05/10/2026).
    const endAug2026 = calculatePeriodEnd("2026-08-31");
    assert.equal(endAug2026.getUTCFullYear(), 2026);
    assert.equal(endAug2026.getUTCMonth(), 9); // Outubro (0-indexed: 9)
    assert.equal(endAug2026.getUTCDate(), 5);
    assert.equal(endAug2026.getUTCDay(), 1); // Segunda-feira

    // Cenário 1.5: Data base padrão (addBusinessDays pulando fins de semana)
    const friday = new Date(Date.UTC(2026, 9, 23, 12, 0, 0)); // Sexta
    const nextBusinessDay = addBusinessDays(friday, 1);
    assert.equal(nextBusinessDay.getUTCDay(), 1, "1 dia útil após sexta deve ser segunda");
    assert.equal(nextBusinessDay.getUTCDate(), 26);

    console.log("   ✓ Todos os casos de transição de mês, anos bissextos e fins de semana calculados perfeitamente.");
  }

  // ==========================================================================
  // BLOCO 2: INTEGRIDADE FINANCEIRA E VALIDAÇÃO ESTREITA EM CENTAVOS
  // ==========================================================================
  console.log("\n[BLOCO 2] Validação estrita de valores em centavos inteiros...");
  {
    // Starter: R$ 49,90 (4990 centavos)
    assert.equal(validatePaymentAmountForPlan("starter", 49.9), true, "R$ 49,90 aceito para Starter");
    assert.equal(validatePaymentAmountForPlan("starter", 49.90), true, "R$ 49.90 aceito para Starter");
    assert.equal(validatePaymentAmountForPlan("starter", 50.0), true, "R$ 50,00 aceito para Starter");
    assert.equal(validatePaymentAmountForPlan("starter", 49.89), false, "R$ 49,89 estritamente rejeitado para Starter");
    assert.equal(validatePaymentAmountForPlan("starter", 0.0), false, "R$ 0,00 rejeitado");
    assert.equal(validatePaymentAmountForPlan("starter", -10), false, "Valor negativo rejeitado");

    // Pro: R$ 97,00 (9700 centavos)
    assert.equal(validatePaymentAmountForPlan("pro", 97.0), true, "R$ 97,00 aceito para Pro");
    assert.equal(validatePaymentAmountForPlan("pro", 97.00), true, "R$ 97.00 aceito para Pro");
    assert.equal(validatePaymentAmountForPlan("pro", 100.0), true, "R$ 100,00 aceito para Pro");
    assert.equal(validatePaymentAmountForPlan("pro", 96.95), false, "R$ 96,95 ESTRITAMENTE rejeitado para Pro (sem tolerância)");
    assert.equal(validatePaymentAmountForPlan("pro", 96.99), false, "R$ 96,99 estritamente rejeitado para Pro");
    assert.equal(validatePaymentAmountForPlan("pro", 49.9), false, "R$ 49,90 rejeitado para Pro");

    console.log("   ✓ Validação estrita em centavos inteiros aprovada com 0 tolerância indevida.");
  }

  // ==========================================================================
  // BLOCO 3: IDEMPOTÊNCIA ATÔMICA, RETENTATIVAS E CONCORRÊNCIA REAL DO WEBHOOK
  // ==========================================================================
  console.log("\n[BLOCO 3] Idempotência atômica, lock concorrente e retentativa com o processador real...");
  {
    const mockDb = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_user_1",
          {
            id: "sub_1",
            user_id: "usr_user_1",
            plan: "starter",
            status: "incomplete",
            company_quota: 1,
            payment_link_id: "link_starter_1",
          },
        ],
      ],
    });

    let asaasHealthy = false;
    const mockGetPayment = async (id) => {
      if (!asaasHealthy) {
        throw new Error("Asaas API Gateway Timeout (504)");
      }
      return {
        id,
        value: 49.9,
        status: "CONFIRMED",
        paymentLink: "link_starter_1",
        dueDate: "2026-10-25",
        billingType: "PIX",
      };
    };

    const payload = {
      id: "evt_webhook_001",
      event: "PAYMENT_CONFIRMED",
      payment: { id: "pay_starter_001" },
    };

    // 3.1 Falha transitória na API do Asaas -> HTTP 500
    const res1 = await processAsaasWebhookEvent(payload, {
      admin: mockDb,
      getAsaasPayment: mockGetPayment,
    });
    assert.equal(res1.statusCode, 500, "Deve retornar 500 em falha transitória do Asaas");
    const eventRow1 = mockDb.tables.billing_webhook_events.get("evt_webhook_001");
    assert.equal(eventRow1.status, "failed");
    assert.equal(mockDb.tables.subscriptions.get("usr_user_1").status, "incomplete", "Assinatura não pode ativar na falha");

    // 3.2 Nova tentativa (retry) com API restabelecida -> HTTP 200 e ativação
    asaasHealthy = true;
    const res2 = await processAsaasWebhookEvent(payload, {
      admin: mockDb,
      getAsaasPayment: mockGetPayment,
    });
    assert.equal(res2.statusCode, 200, "Deve retornar 200 após recuperação");
    assert.equal(res2.body.processed, true);
    const eventRow2 = mockDb.tables.billing_webhook_events.get("evt_webhook_001");
    assert.equal(eventRow2.status, "processed");
    assert.equal(eventRow2.attempts, 2, "Tentativas incrementadas");
    assert.equal(mockDb.tables.subscriptions.get("usr_user_1").status, "active");
    assert.equal(mockDb.tables.subscriptions.get("usr_user_1").plan, "starter");

    // 3.3 Reentrega do mesmo evento já processado -> HTTP 200 duplicate sem mutação
    const res3 = await processAsaasWebhookEvent(payload, {
      admin: mockDb,
      getAsaasPayment: mockGetPayment,
    });
    assert.equal(res3.statusCode, 200);
    assert.equal(res3.body.duplicate, true);

    // 3.4 Concorrência simultânea (outro worker com evento in_progress)
    mockDb.tables.billing_webhook_events.set("evt_concurrent_99", {
      id: "evt_concurrent_99",
      event: "PAYMENT_CONFIRMED",
      status: "processing",
      created_at: new Date().toISOString(),
      last_attempt_at: new Date().toISOString(),
      attempts: 1,
    });

    const resConcurrent = await processAsaasWebhookEvent(
      { id: "evt_concurrent_99", event: "PAYMENT_CONFIRMED", payment: { id: "pay_any" } },
      { admin: mockDb, getAsaasPayment: mockGetPayment }
    );
    assert.equal(resConcurrent.statusCode, 409, "Worker concorrente deve receber 409 in_progress e não 200");

    // 3.5 Evento abandonado em processamento além do timeout (expirado) -> reaquisição
    const staleDate = new Date(Date.now() - 120 * 1000).toISOString(); // 2 minutos atrás
    mockDb.tables.billing_webhook_events.set("evt_stale_88", {
      id: "evt_stale_88",
      event: "PAYMENT_CONFIRMED",
      status: "processing",
      created_at: staleDate,
      last_attempt_at: staleDate,
      attempts: 1,
    });

    const resStale = await processAsaasWebhookEvent(
      { id: "evt_stale_88", event: "PAYMENT_CONFIRMED", payment: { id: "pay_starter_001" } },
      { admin: mockDb, getAsaasPayment: mockGetPayment }
    );
    assert.equal(resStale.statusCode, 200, "Evento preso há mais de 60s deve ser re-adquirido com sucesso");
    const staleRow = mockDb.tables.billing_webhook_events.get("evt_stale_88");
    assert.equal(staleRow.status, "processed");
    assert.equal(staleRow.attempts, 2);

    console.log("   ✓ Idempotência atômica, locks concorrentes e retentativas validados com código de produção.");
  }

  // ==========================================================================
  // BLOCO 4: TRANSIÇÃO STARTER -> PRO E PREVENÇÃO DE COBRANÇA DUPLA
  // ==========================================================================
  console.log("\n[BLOCO 4] Transição de plano Starter -> Pro com cancelamento da assinatura antiga...");
  {
    let cancelledSubId = null;
    let cancelShouldFail = false;

    const mockCancelSub = async (subId) => {
      if (cancelShouldFail) {
        throw new Error("Falha remota Asaas ao cancelar assinatura");
      }
      cancelledSubId = subId;
    };

    const mockDb = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_upgrade_user",
          {
            id: "sub_upgrade_1",
            user_id: "usr_upgrade_user",
            plan: "starter",
            status: "active",
            company_quota: 1,
            gateway_subscription_id: "sub_starter_old_111",
            previous_gateway_subscription_id: "sub_starter_old_111",
            pending_plan: "pro",
            pending_checkout_id: "chk_pro_abc",
            payment_link_id: "link_pro_222",
          },
        ],
      ],
    });

    const mockGetProPayment = async (id) => ({
      id,
      subscription: "sub_pro_new_333",
      value: 97.0,
      status: "CONFIRMED",
      paymentLink: "link_pro_222",
      dueDate: "2026-10-25",
      externalReference: "usr_upgrade_user:pro:chk_pro_abc",
    });

    // 4.1 Cenário de falha no cancelamento da assinatura antiga:
    // O webhook DEVE falhar com 500, NÃO pode limpar previous_gateway_subscription_id e NÃO pode marcar processed
    cancelShouldFail = true;
    const resFailCancel = await processAsaasWebhookEvent(
      { id: "evt_upgrade_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_pro_fail" } },
      {
        admin: mockDb,
        getAsaasPayment: mockGetProPayment,
        cancelAsaasSubscription: mockCancelSub,
      }
    );
    assert.equal(resFailCancel.statusCode, 500, "Falha ao cancelar assinatura antiga deve resultar em HTTP 500");
    const subAfterFail = mockDb.tables.subscriptions.get("usr_upgrade_user");
    assert.equal(
      subAfterFail.previous_gateway_subscription_id,
      "sub_starter_old_111",
      "Identificador da assinatura anterior DEVE ser preservado em caso de falha de cancelamento"
    );
    assert.equal(subAfterFail.plan, "starter", "Plano não pode ter sido promovido enquanto cancelamento falhou");

    // 4.2 Retentativa onde cancelamento remoto é confirmado:
    cancelShouldFail = false;
    const resSuccessCancel = await processAsaasWebhookEvent(
      { id: "evt_upgrade_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_pro_fail" } },
      {
        admin: mockDb,
        getAsaasPayment: mockGetProPayment,
        cancelAsaasSubscription: mockCancelSub,
      }
    );
    assert.equal(resSuccessCancel.statusCode, 200);
    assert.equal(cancelledSubId, "sub_starter_old_111", "Assinatura Starter antiga cancelada no Asaas");
    const subAfterSuccess = mockDb.tables.subscriptions.get("usr_upgrade_user");
    assert.equal(subAfterSuccess.plan, "pro", "Plano atualizado para Pro");
    assert.equal(subAfterSuccess.company_quota, 3, "Cota atualizada para 3");
    assert.equal(subAfterSuccess.gateway_subscription_id, "sub_pro_new_333");
    assert.equal(subAfterSuccess.previous_gateway_subscription_id, null, "previous_gateway_subscription_id limpo após sucesso confirmado");

    console.log("   ✓ Transição e cancelamento seguro comprovados: falhas não mascaradas e recuperação garantida.");
  }

  // ==========================================================================
  // BLOCO 5: PRIORIDADE P0 - PAGAMENTO DA ASSINATURA ANTIGA NUNCA FAZ DOWNGRADE
  // ==========================================================================
  console.log("\n[BLOCO 5] Prioridade P0: Pagamento de assinatura anterior em transição NÃO altera plano Pro...");
  {
    let oldSubCancelAttempts = 0;
    const mockCancelSub = async () => {
      oldSubCancelAttempts++;
    };

    // Usuário já está no plano Pro (cota 3), mas ainda tem previous_gateway_subscription_id registrado
    const mockDb = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_pro_safe",
          {
            id: "sub_pro_user",
            user_id: "usr_pro_safe",
            plan: "pro",
            status: "active",
            company_quota: 3,
            gateway_subscription_id: "sub_pro_active_999",
            previous_gateway_subscription_id: "sub_starter_old_888",
            pending_plan: null,
            pending_checkout_id: null,
          },
        ],
      ],
    });

    // Cobrança tardia gerada pela assinatura Starter antiga (R$ 49,90)
    const mockGetLateStarterPayment = async (id) => ({
      id,
      subscription: "sub_starter_old_888", // Correspondência com previous_gateway_subscription_id
      value: 49.9,
      status: "CONFIRMED",
      dueDate: "2026-10-26",
      externalReference: "usr_pro_safe:starter",
    });

    const latePayload = {
      id: "evt_late_starter_payment_01",
      event: "PAYMENT_RECEIVED",
      payment: { id: "pay_late_starter_001" },
    };

    const resLate = await processAsaasWebhookEvent(latePayload, {
      admin: mockDb,
      getAsaasPayment: mockGetLateStarterPayment,
      cancelAsaasSubscription: mockCancelSub,
    });

    assert.equal(resLate.statusCode, 200, "Pagamento tardio deve ser aceito e registrado");
    assert.equal(oldSubCancelAttempts, 1, "Tentativa de cancelamento da assinatura antiga deve ser acionada");

    // VERIFICAÇÕES OBRIGATÓRIAS P0:
    const subFinal = mockDb.tables.subscriptions.get("usr_pro_safe");
    assert.equal(subFinal.plan, "pro", "CRÍTICO P0: Plano DEVE permanecer Pro (PROIBIDO DOWNGRADE)");
    assert.equal(subFinal.company_quota, 3, "CRÍTICO P0: Cota de empresas DEVE permanecer 3");
    assert.equal(
      subFinal.gateway_subscription_id,
      "sub_pro_active_999",
      "CRÍTICO P0: gateway_subscription_id DEVE continuar sendo a assinatura Pro"
    );

    // O pagamento tardio DEVE constar registrado na tabela de auditoria financeira com plano starter
    let recordedLatePayment = null;
    for (const payment of mockDb.tables.billing_payments.values()) {
      if (payment.asaas_payment_id === "pay_late_starter_001") {
        recordedLatePayment = payment;
        break;
      }
    }
    assert.ok(recordedLatePayment, "Pagamento tardio deve ser registrado em billing_payments");
    assert.equal(recordedLatePayment.plan, "starter", "Pagamento registrado com seu plano real (starter)");
    assert.equal(recordedLatePayment.user_id, "usr_pro_safe");

    console.log("   ✓ CRÍTICO P0 CONFIRMADO: Pagamento de assinatura anterior gravado sem rebaixar conta Pro.");
  }

  // ==========================================================================
  // BLOCO 6: ISOLAMENTO ENTRE USUÁRIOS E REJEIÇÃO DE PAGAMENTOS DESCONHECIDOS
  // ==========================================================================
  console.log("\n[BLOCO 6] Isolamento entre usuários, valores insuficientes e persistência segura...");
  {
    const mockDb = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_user_A",
          {
            id: "sub_A",
            user_id: "usr_user_A",
            plan: "starter",
            status: "incomplete",
            company_quota: 1,
            payment_link_id: "link_A",
          },
        ],
      ],
    });

    // 6.1 Pagamento com externalReference de outro usuário (User B tenta ativar User A)
    const mockSpoofedPayment = async (id) => ({
      id,
      value: 49.9,
      status: "CONFIRMED",
      paymentLink: "link_A",
      externalReference: "usr_user_B:starter",
    });

    const resSpoofed = await processAsaasWebhookEvent(
      { id: "evt_spoof_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_spoof" } },
      { admin: mockDb, getAsaasPayment: mockSpoofedPayment }
    );
    assert.equal(resSpoofed.statusCode, 500, "Tentativa de cruzamento de usuário deve falhar");
    assert.equal(mockDb.tables.subscriptions.get("usr_user_A").status, "incomplete");

    // 6.2 Pagamento insuficiente para Pro (R$ 50,00 quando exige R$ 97,00)
    mockDb.tables.subscriptions.set("usr_underpaid", {
      id: "sub_under",
      user_id: "usr_underpaid",
      plan: "starter",
      status: "incomplete",
      pending_plan: "pro",
      payment_link_id: "link_pro_under",
      company_quota: 1,
    });

    const mockUnderPayment = async (id) => ({
      id,
      value: 50.0, // Insuficiente para Pro
      status: "CONFIRMED",
      paymentLink: "link_pro_under",
      externalReference: "usr_underpaid:pro",
    });

    const resUnder = await processAsaasWebhookEvent(
      { id: "evt_under_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_under" } },
      { admin: mockDb, getAsaasPayment: mockUnderPayment }
    );
    assert.equal(resUnder.statusCode, 500, "Pagamento insuficiente deve rejeitar ativação");
    const subUnder = mockDb.tables.subscriptions.get("usr_underpaid");
    assert.equal(subUnder.status, "incomplete", "Status deve permanecer incomplete");
    assert.equal(subUnder.plan, "starter", "Não pode haver fallback espúrio para Starter");

    // 6.3 Falha de escrita no Supabase não mascara como sucesso
    mockDb.setFailNextUpdateSubscriptions(true);
    const mockValidPayment = async (id) => ({
      id,
      value: 49.9,
      status: "CONFIRMED",
      paymentLink: "link_A",
      externalReference: "usr_user_A:starter",
    });

    const resDbFail = await processAsaasWebhookEvent(
      { id: "evt_db_fail_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_db_fail" } },
      { admin: mockDb, getAsaasPayment: mockValidPayment }
    );
    assert.equal(resDbFail.statusCode, 500, "Falha de persistência no Supabase não pode responder sucesso 200");

    console.log("   ✓ Isolamento entre usuários, rejeição de sub-valores e integridade de persistência validados.");
  }

  // ==========================================================================
  // BLOCO 7: ETAPA 1 - TRANSIÇÃO ENTRE ASSINATURAS DO ASAAS (TESTES OBRIGATÓRIOS)
  // ==========================================================================
  console.log("\n[BLOCO 7] Testes obrigatórios de transição entre assinaturas do Asaas (Etapa 1)...");
  {
    // ------------------------------------------------------------------------
    // 7.1 Pagamento Starter recebido enquanto gateway_subscription_id e previous_gateway_subscription_id são iguais
    // ------------------------------------------------------------------------
    console.log("   -> 7.1 Pagamento Starter recebido com gateway_subscription_id e previous_gateway_subscription_id iguais...");
    const cancelledSubs71 = [];
    const mockCancelSub71 = async (subId) => {
      cancelledSubs71.push(subId);
    };

    const mockDb71 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_starter_equal_ids",
          {
            id: "sub_equal_1",
            user_id: "usr_starter_equal_ids",
            plan: "starter",
            status: "active",
            company_quota: 1,
            gateway_subscription_id: "sub_starter_eq_999",
            previous_gateway_subscription_id: "sub_starter_eq_999", // IGUAIS!
            pending_plan: "pro",
            pending_checkout_id: "chk_pro_wait_equal",
            payment_link_id: "link_pro_wait_equal",
            current_period_end: "2026-10-31T00:00:00.000Z",
          },
        ],
      ],
    });

    const mockGetStarterPayment71 = async (id) => ({
      id,
      subscription: "sub_starter_eq_999", // Mesmo ID do Starter ativo
      value: 49.9,
      status: "CONFIRMED",
      dueDate: "2026-11-30",
    });

    const resEqualIds = await processAsaasWebhookEvent(
      { id: "evt_starter_eq_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_starter_eq_1" } },
      {
        admin: mockDb71,
        getAsaasPayment: mockGetStarterPayment71,
        cancelAsaasSubscription: mockCancelSub71,
      }
    );

    assert.equal(resEqualIds.statusCode, 200, "Webhook deve retornar HTTP 200");
    assert.equal(resEqualIds.body.processed, true);
    assert.equal(
      cancelledSubs71.length,
      0,
      "NUNCA deve cancelar a assinatura Starter atual quando identificador for igual a gateway_subscription_id"
    );

    const subEqualAfter = mockDb71.tables.subscriptions.get("usr_starter_equal_ids");
    assert.equal(subEqualAfter.plan, "starter", "Plano deve permanecer starter");
    assert.equal(subEqualAfter.status, "active", "Assinatura deve permanecer ativa");
    assert.equal(subEqualAfter.company_quota, 1, "Cota de empresas deve permanecer 1");
    assert.equal(subEqualAfter.gateway_subscription_id, "sub_starter_eq_999");
    assert.equal(subEqualAfter.previous_gateway_subscription_id, "sub_starter_eq_999", "previous_gateway_subscription_id preservado");
    assert.equal(subEqualAfter.pending_plan, "pro", "Upgrade pendente preservado para conclusão posterior");
    assert.equal(subEqualAfter.pending_checkout_id, "chk_pro_wait_equal");
    assert.equal(subEqualAfter.payment_link_id, "link_pro_wait_equal");
    assert.ok(
      new Date(subEqualAfter.current_period_end).getTime() > new Date("2026-10-31T00:00:00.000Z").getTime(),
      "Ciclo da assinatura Starter deve ter sido estendido"
    );

    // ------------------------------------------------------------------------
    // 7.2 Ausência de cancelamento da assinatura atual antes da confirmação do upgrade
    // ------------------------------------------------------------------------
    console.log("   -> 7.2 Ausência de cancelamento da assinatura atual antes da confirmação do upgrade...");
    const cancelledSubs72 = [];
    const mockCancelSub72 = async (subId) => {
      cancelledSubs72.push(subId);
    };

    // Cenário A: Pagamento com checkout divergente/desconhecido tenta se passar por confirmação
    const mockGetDivergentPayment72 = async (id) => ({
      id,
      subscription: "sub_other_unknown",
      value: 97.0,
      status: "CONFIRMED",
      externalReference: "usr_starter_equal_ids:pro:chk_divergent_different",
    });

    const resDivergent = await processAsaasWebhookEvent(
      { id: "evt_divergent_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_divergent_1" } },
      {
        admin: mockDb71,
        getAsaasPayment: mockGetDivergentPayment72,
        cancelAsaasSubscription: mockCancelSub72,
      }
    );

    assert.equal(resDivergent.statusCode, 200, "Webhook de checkout descorrelacionado registrado com segurança");
    assert.equal(cancelledSubs72.length, 0, "NÃO cancela Starter ativo para checkouts divergentes");
    const subCheck72 = mockDb71.tables.subscriptions.get("usr_starter_equal_ids");
    assert.equal(subCheck72.plan, "starter", "Conta NÃO pode ser promovida com checkout divergente");
    assert.equal(subCheck72.gateway_subscription_id, "sub_starter_eq_999");

    // Cenário B: Agora o pagamento legítimo e correlacionado do Pro chega
    const mockGetValidProPayment72 = async (id) => ({
      id,
      subscription: "sub_pro_confirmed_777",
      value: 97.0,
      status: "CONFIRMED",
      paymentLink: "link_pro_wait_equal",
      externalReference: "usr_starter_equal_ids:pro:chk_pro_wait_equal",
      dueDate: "2026-11-25",
    });

    const resProConfirmed = await processAsaasWebhookEvent(
      { id: "evt_pro_confirmed_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_pro_confirmed_1" } },
      {
        admin: mockDb71,
        getAsaasPayment: mockGetValidProPayment72,
        cancelAsaasSubscription: mockCancelSub72,
      }
    );

    assert.equal(resProConfirmed.statusCode, 200);
    assert.equal(
      cancelledSubs72.includes("sub_starter_eq_999"),
      true,
      "Assinatura Starter antiga é cancelada no Asaas SOMENTE APÓS confirmação legítima do Pro"
    );
    const subProActive = mockDb71.tables.subscriptions.get("usr_starter_equal_ids");
    assert.equal(subProActive.plan, "pro", "Plano agora ativado para Pro");
    assert.equal(subProActive.company_quota, 3, "Cota agora 3 empresas");
    assert.equal(subProActive.gateway_subscription_id, "sub_pro_confirmed_777");
    assert.equal(subProActive.previous_gateway_subscription_id, null, "previous_gateway_subscription_id limpo");
    assert.equal(subProActive.pending_plan, null);

    // ------------------------------------------------------------------------
    // 7.3 Falha ao cancelar a assinatura antiga no recebimento de pagamento atrasado
    // ------------------------------------------------------------------------
    console.log("   -> 7.3 Falha ao cancelar assinatura antiga e não conclusão silenciosa...");
    let failCancelOldSub = true;
    const mockCancelSub73 = async () => {
      if (failCancelOldSub) {
        throw new Error("Erro de comunicação com Asaas API ao cancelar");
      }
    };

    const mockDb73 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_late_retry_user",
          {
            id: "sub_late_retry",
            user_id: "usr_late_retry_user",
            plan: "pro",
            status: "active",
            company_quota: 3,
            gateway_subscription_id: "sub_pro_active_888",
            previous_gateway_subscription_id: "sub_starter_old_888",
          },
        ],
      ],
    });

    const mockGetLatePayment73 = async (id) => ({
      id,
      subscription: "sub_starter_old_888",
      value: 49.9,
      status: "CONFIRMED",
      dueDate: "2026-10-25",
    });

    const resLateFail = await processAsaasWebhookEvent(
      { id: "evt_late_cancel_fail", event: "PAYMENT_CONFIRMED", payment: { id: "pay_late_fail" } },
      {
        admin: mockDb73,
        getAsaasPayment: mockGetLatePayment73,
        cancelAsaasSubscription: mockCancelSub73,
      }
    );

    assert.equal(resLateFail.statusCode, 500, "Falha de cancelamento deve resultar em HTTP 500 para retentativa");
    const eventFailRow = mockDb73.tables.billing_webhook_events.get("evt_late_cancel_fail");
    assert.equal(eventFailRow.status, "failed", "Evento NÃO pode ser marcado como processed quando cancelamento falha");
    const subAfterLateFail = mockDb73.tables.subscriptions.get("usr_late_retry_user");
    assert.equal(
      subAfterLateFail.previous_gateway_subscription_id,
      "sub_starter_old_888",
      "previous_gateway_subscription_id DEVE ser preservado em falha de cancelamento"
    );
    assert.equal(subAfterLateFail.plan, "pro", "Plano Pro preservado contra downgrade");

    // ------------------------------------------------------------------------
    // 7.4 Retentativa após falha de cancelamento
    // ------------------------------------------------------------------------
    console.log("   -> 7.4 Retentativa com sucesso após falha de cancelamento...");
    failCancelOldSub = false; // Recuperação da API do Asaas

    const resLateRetrySuccess = await processAsaasWebhookEvent(
      { id: "evt_late_cancel_fail", event: "PAYMENT_CONFIRMED", payment: { id: "pay_late_fail" } },
      {
        admin: mockDb73,
        getAsaasPayment: mockGetLatePayment73,
        cancelAsaasSubscription: mockCancelSub73,
      }
    );

    assert.equal(resLateRetrySuccess.statusCode, 200, "Retentativa bem-sucedida resulta em HTTP 200");
    assert.equal(resLateRetrySuccess.body.processed, true);
    const eventSuccessRow = mockDb73.tables.billing_webhook_events.get("evt_late_cancel_fail");
    assert.equal(eventSuccessRow.status, "processed", "Evento marcado como processed após sucesso");
    assert.equal(eventSuccessRow.attempts, 2, "Contador de tentativas incrementado");
    const subAfterLateSuccess = mockDb73.tables.subscriptions.get("usr_late_retry_user");
    assert.equal(
      subAfterLateSuccess.previous_gateway_subscription_id,
      null,
      "previous_gateway_subscription_id limpo com sucesso após cancelamento confirmado"
    );
    assert.equal(subAfterLateSuccess.plan, "pro");

    // ------------------------------------------------------------------------
    // 7.5 Falha de persistência durante a transição
    // ------------------------------------------------------------------------
    console.log("   -> 7.5 Falha de persistência durante a transição (Starter -> Pro)...");
    const mockDb75 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_persist_fail_user",
          {
            id: "sub_persist_1",
            user_id: "usr_persist_fail_user",
            plan: "starter",
            status: "active",
            company_quota: 1,
            gateway_subscription_id: "sub_starter_persist_111",
            previous_gateway_subscription_id: "sub_starter_persist_111",
            pending_plan: "pro",
            pending_checkout_id: "chk_persist_pro",
            payment_link_id: "link_persist_pro",
          },
        ],
      ],
    });

    const mockGetProPayment75 = async (id) => ({
      id,
      subscription: "sub_pro_persist_222",
      value: 97.0,
      status: "CONFIRMED",
      paymentLink: "link_persist_pro",
      externalReference: "usr_persist_fail_user:pro:chk_persist_pro",
    });

    // Simula falha crítica de escrita no banco durante a transição
    mockDb75.setFailNextUpdateSubscriptions(true);

    const resPersistFail = await processAsaasWebhookEvent(
      { id: "evt_persist_fail_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_persist_fail_1" } },
      {
        admin: mockDb75,
        getAsaasPayment: mockGetProPayment75,
        cancelAsaasSubscription: async () => {},
      }
    );

    assert.equal(resPersistFail.statusCode, 500, "Falha de persistência durante transição deve resultar em HTTP 500");
    const persistEventRow = mockDb75.tables.billing_webhook_events.get("evt_persist_fail_01");
    assert.equal(persistEventRow.status, "failed", "Evento de transição com falha no banco NÃO pode marcar processed");
    const subPersistAfter = mockDb75.tables.subscriptions.get("usr_persist_fail_user");
    assert.equal(subPersistAfter.plan, "starter", "Plano não pode atualizar se a persistência falhou");

    // Retentativa com persistência normalizada
    const resPersistRetry = await processAsaasWebhookEvent(
      { id: "evt_persist_fail_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_persist_fail_1" } },
      {
        admin: mockDb75,
        getAsaasPayment: mockGetProPayment75,
        cancelAsaasSubscription: async () => {},
      }
    );

    assert.equal(resPersistRetry.statusCode, 200, "Retentativa após persistência normalizada resulta em HTTP 200");
    const subPersistFinal = mockDb75.tables.subscriptions.get("usr_persist_fail_user");
    assert.equal(subPersistFinal.plan, "pro", "Plano promovido para Pro após persistência bem-sucedida");
    assert.equal(subPersistFinal.previous_gateway_subscription_id, null);

    // ------------------------------------------------------------------------
    // 7.6 Validação de atualização afetando 0 registros (registro concorrente ausente)
    // ------------------------------------------------------------------------
    console.log("   -> 7.6 Validação estrita de 0 registros afetados em atualizações críticas...");
    const mockDb76 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_ghost_user",
          {
            id: "sub_ghost",
            user_id: "usr_ghost_user",
            plan: "starter",
            status: "active",
            gateway_subscription_id: "sub_ghost_1",
          },
        ],
      ],
    });

    const mockGetGhostPayment = async (id) => ({
      id,
      subscription: "sub_ghost_1",
      value: 49.9,
      status: "CONFIRMED",
    });

    // Remove o usuário da tabela após a busca inicial para simular deleção concorrente antes do update
    const origFrom = mockDb76.from.bind(mockDb76);
    mockDb76.from = (table) => {
      const q = origFrom(table);
      if (table === "subscriptions") {
        const origUpdate = q.update.bind(q);
        q.update = (data) => {
          // Deleta a linha para garantir que o update afetará 0 registros
          mockDb76.tables.subscriptions.clear();
          return origUpdate(data);
        };
      }
      return q;
    };

    const resGhost = await processAsaasWebhookEvent(
      { id: "evt_ghost_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_ghost_1" } },
      {
        admin: mockDb76,
        getAsaasPayment: mockGetGhostPayment,
        cancelAsaasSubscription: async () => {},
      }
    );

    assert.equal(resGhost.statusCode, 500, "Atualização que afeta 0 registros DEVE falhar com HTTP 500");
    const ghostEvent = mockDb76.tables.billing_webhook_events.get("evt_ghost_01");
    assert.equal(ghostEvent.status, "failed");
    assert.ok(
      ghostEvent.error_message?.includes("Nenhum registro atualizado"),
      "Mensagem de erro deve acusar que nenhum registro foi atualizado"
    );

    console.log("   ✓ Todos os 6 cenários obrigatórios de transição Asaas aprovados com sucesso.");
  }

  // ============================================================================
  // [BLOCO 8] TESTES OBRIGATÓRIOS DE VALIDAÇÃO DE CORRELAÇÃO (ETAPA 2)
  // ============================================================================
  {
    console.log("\n[BLOCO 8] Testes obrigatórios de correlação entre checkout, pagamento e plano (Etapa 2)...");

    // ------------------------------------------------------------------------
    // 8.1 Pagamento do checkout pendente correto
    // ------------------------------------------------------------------------
    console.log("   -> 8.1 Pagamento do checkout pendente correto ativa e promove a assinatura...");
    const mockDb81 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e2_valid",
          {
            id: "sub_e2_1",
            user_id: "usr_e2_valid",
            plan: "starter",
            status: "incomplete",
            company_quota: 1,
            pending_plan: "pro",
            pending_checkout_id: "chk_valid_100",
            payment_link_id: "link_valid_100",
          },
        ],
      ],
    });

    const mockGetPayment81 = async (id) => ({
      id,
      subscription: "sub_asaas_new_100",
      value: 97.0,
      status: "CONFIRMED",
      paymentLink: "link_valid_100",
      externalReference: "usr_e2_valid:pro:chk_valid_100",
      dueDate: "2026-11-25",
    });

    const res81 = await processAsaasWebhookEvent(
      { id: "evt_e2_81", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e2_81" } },
      {
        admin: mockDb81,
        getAsaasPayment: mockGetPayment81,
        cancelAsaasSubscription: async () => {},
      }
    );

    assert.equal(res81.statusCode, 200, "Pagamento correlacionado com sucesso retorna 200");
    const sub81 = mockDb81.tables.subscriptions.get("usr_e2_valid");
    assert.equal(sub81.status, "active", "Assinatura ativada como active");
    assert.equal(sub81.plan, "pro", "Plano promovido para Pro");
    assert.equal(sub81.company_quota, 3, "Cota Pro atribuída (3)");
    assert.equal(sub81.pending_checkout_id, null, "pending_checkout_id limpo após confirmação");

    // ------------------------------------------------------------------------
    // 8.2 Pagamento de checkout antigo após criação de um novo
    // ------------------------------------------------------------------------
    console.log("   -> 8.2 Pagamento de checkout antigo após novo checkout não ativa a assinatura...");
    const mockDb82 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e2_replaced",
          {
            id: "sub_e2_2",
            user_id: "usr_e2_replaced",
            plan: "starter",
            status: "incomplete",
            pending_plan: "pro",
            pending_checkout_id: "chk_new_200",
            payment_link_id: "link_new_200",
          },
        ],
      ],
    });

    const mockGetPayment82 = async (id) => ({
      id,
      value: 97.0,
      status: "CONFIRMED",
      paymentLink: "link_old_100",
      externalReference: "usr_e2_replaced:pro:chk_old_100",
      dueDate: "2026-11-25",
    });

    const res82 = await processAsaasWebhookEvent(
      { id: "evt_e2_82", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e2_82" } },
      {
        admin: mockDb82,
        getAsaasPayment: mockGetPayment82,
        cancelAsaasSubscription: async () => {},
      }
    );

    assert.equal(res82.statusCode, 200);
    const sub82 = mockDb82.tables.subscriptions.get("usr_e2_replaced");
    assert.equal(sub82.status, "incomplete", "Checkout antigo NÃO ativa conta em estado incomplete");
    assert.equal(sub82.pending_checkout_id, "chk_new_200", "Preserva o novo checkout pendente");
    const payment82 = Array.from(mockDb82.tables.billing_payments.values()).find(
      (p) => p.asaas_payment_id === "pay_e2_82"
    );
    assert.ok(payment82, "Pagamento antigo gravado em billing_payments para rastreabilidade");

    // ------------------------------------------------------------------------
    // 8.3 Pagamento Starter atrasado durante ou depois de um upgrade (não-rebaixamento)
    // ------------------------------------------------------------------------
    console.log("   -> 8.3 Pagamento Starter atrasado após upgrade NUNCA rebaixa conta Pro...");
    const mockDb83 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e2_pro",
          {
            id: "sub_e2_3",
            user_id: "usr_e2_pro",
            plan: "pro",
            status: "active",
            company_quota: 3,
            gateway_subscription_id: "sub_pro_active_300",
          },
        ],
      ],
    });

    const mockGetPayment83 = async (id) => ({
      id,
      value: 49.9,
      status: "CONFIRMED",
      externalReference: "usr_e2_pro:starter:chk_starter_ancient",
      dueDate: "2026-10-01",
    });

    const res83 = await processAsaasWebhookEvent(
      { id: "evt_e2_83", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e2_83" } },
      {
        admin: mockDb83,
        getAsaasPayment: mockGetPayment83,
        cancelAsaasSubscription: async () => {},
      }
    );

    assert.equal(res83.statusCode, 200);
    const sub83 = mockDb83.tables.subscriptions.get("usr_e2_pro");
    assert.equal(sub83.plan, "pro", "Invariante de P0: Conta Pro NUNCA sofre rebaixamento para Starter");
    assert.equal(sub83.company_quota, 3, "Cota Pro mantida intacta");

    // ------------------------------------------------------------------------
    // 8.4 externalReference de usuário diferente do dono da assinatura
    // ------------------------------------------------------------------------
    console.log("   -> 8.4 externalReference com usuário divergente é terminantemente rejeitado...");
    const mockDb84 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_owner_alpha",
          {
            id: "sub_e2_4",
            user_id: "usr_owner_alpha",
            plan: "starter",
            status: "active",
            payment_link_id: "link_alpha_400",
          },
        ],
      ],
    });

    const mockGetPayment84 = async (id) => ({
      id,
      value: 49.9,
      status: "CONFIRMED",
      paymentLink: "link_alpha_400",
      externalReference: "usr_attacker_beta:starter:chk_beta_400",
    });

    const res84 = await processAsaasWebhookEvent(
      { id: "evt_e2_84", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e2_84" } },
      {
        admin: mockDb84,
        getAsaasPayment: mockGetPayment84,
        cancelAsaasSubscription: async () => {},
      }
    );

    assert.equal(res84.statusCode, 500, "Tentativa de cross-user spoofing resulta em HTTP 500");
    const event84 = mockDb84.tables.billing_webhook_events.get("evt_e2_84");
    assert.equal(event84.status, "failed");
    assert.ok(
      event84.error_message?.includes("Inconsistência de segurança"),
      "Erro acusa inconsistência de segurança por divergência de usuário"
    );

    // ------------------------------------------------------------------------
    // 8.5 Checkout com plano diferente do plano pendente
    // ------------------------------------------------------------------------
    console.log("   -> 8.5 Checkout com plano diferente do plano pendente não ativa assinatura...");
    const mockDb85 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e2_pending_pro",
          {
            id: "sub_e2_5",
            user_id: "usr_e2_pending_pro",
            plan: "starter",
            status: "active",
            pending_plan: "pro",
            pending_checkout_id: "chk_pro_500",
            payment_link_id: "link_pro_500",
          },
        ],
      ],
    });

    // Pagamento chega identificado como Starter
    const mockGetPayment85 = async (id) => ({
      id,
      value: 49.9,
      status: "CONFIRMED",
      externalReference: "usr_e2_pending_pro:starter:chk_pro_500",
    });

    const res85 = await processAsaasWebhookEvent(
      { id: "evt_e2_85", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e2_85" } },
      {
        admin: mockDb85,
        getAsaasPayment: mockGetPayment85,
        cancelAsaasSubscription: async () => {},
      }
    );

    assert.equal(res85.statusCode, 200);
    const sub85 = mockDb85.tables.subscriptions.get("usr_e2_pending_pro");
    assert.equal(sub85.plan, "starter", "Plano não alterado por plano divergente");
    assert.equal(sub85.pending_plan, "pro", "Pendência de Pro mantida intacta");

    // ------------------------------------------------------------------------
    // 8.6 Pagamento recorrente de assinatura ativa sem exigir checkoutId
    // ------------------------------------------------------------------------
    console.log("   -> 8.6 Pagamento recorrente de assinatura ativa renova sem exigir checkoutId...");
    const mockDb86 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e2_active_recur",
          {
            id: "sub_e2_6",
            user_id: "usr_e2_active_recur",
            plan: "starter",
            status: "active",
            company_quota: 1,
            gateway_subscription_id: "sub_active_recur_600",
            current_period_end: "2026-10-25T00:00:00Z",
          },
        ],
      ],
    });

    // Ciclo recorrente gerado automaticamente pelo Asaas sem checkoutId
    const mockGetPayment86 = async (id) => ({
      id,
      subscription: "sub_active_recur_600",
      value: 49.9,
      status: "CONFIRMED",
      dueDate: "2026-11-25",
    });

    const res86 = await processAsaasWebhookEvent(
      { id: "evt_e2_86", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e2_86" } },
      {
        admin: mockDb86,
        getAsaasPayment: mockGetPayment86,
        cancelAsaasSubscription: async () => {},
      }
    );

    assert.equal(res86.statusCode, 200);
    const sub86 = mockDb86.tables.subscriptions.get("usr_e2_active_recur");
    assert.equal(sub86.status, "active", "Assinatura mantida como active");
    assert.ok(
      new Date(sub86.current_period_end).getTime() > new Date("2026-10-25T00:00:00Z").getTime(),
      "current_period_end renovado com sucesso"
    );

    // ------------------------------------------------------------------------
    // 8.7 Pagamento sem dados suficientes para uma correlação segura
    // ------------------------------------------------------------------------
    console.log("   -> 8.7 Pagamento sem dados suficientes não ativa nem altera a assinatura...");
    const mockDb87 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e2_sparse",
          {
            id: "sub_e2_7",
            user_id: "usr_e2_sparse",
            plan: "starter",
            status: "incomplete",
            pending_checkout_id: "chk_secure_anchor_700",
          },
        ],
      ],
    });

    // Pagamento avulso apenas com targetUserId, sem checkoutId e sem paymentLink
    const mockGetPayment87 = async (id) => ({
      id,
      value: 49.9,
      status: "CONFIRMED",
      externalReference: "usr_e2_sparse",
    });

    const res87 = await processAsaasWebhookEvent(
      { id: "evt_e2_87", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e2_87" } },
      {
        admin: mockDb87,
        getAsaasPayment: mockGetPayment87,
        cancelAsaasSubscription: async () => {},
      }
    );

    assert.equal(res87.statusCode, 200);
    const sub87 = mockDb87.tables.subscriptions.get("usr_e2_sparse");
    assert.equal(sub87.status, "incomplete", "Status permanece incomplete por falta de correlação");
    assert.equal(sub87.pending_checkout_id, "chk_secure_anchor_700", "Preserva o checkout pendente");

    // ------------------------------------------------------------------------
    // 8.8 Estados incomplete e past_due com checkout antigo
    // ------------------------------------------------------------------------
    console.log("   -> 8.8 Estados incomplete e past_due NÃO são ativados por checkout antigo...");
    const mockDb88 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e2_incomplete",
          {
            id: "sub_e2_8a",
            user_id: "usr_e2_incomplete",
            plan: "starter",
            status: "incomplete",
            pending_checkout_id: "chk_inc_recent_800",
          },
        ],
        [
          "usr_e2_pastdue",
          {
            id: "sub_e2_8b",
            user_id: "usr_e2_pastdue",
            plan: "starter",
            status: "past_due",
            pending_checkout_id: "chk_past_recent_801",
          },
        ],
      ],
    });

    // Pagamento antigo para o usuário em incomplete
    const mockGetPayment88a = async (id) => ({
      id,
      value: 49.9,
      status: "CONFIRMED",
      externalReference: "usr_e2_incomplete:starter:chk_inc_ancient_old",
    });

    await processAsaasWebhookEvent(
      { id: "evt_e2_88a", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e2_88a" } },
      {
        admin: mockDb88,
        getAsaasPayment: mockGetPayment88a,
        cancelAsaasSubscription: async () => {},
      }
    );

    const sub88a = mockDb88.tables.subscriptions.get("usr_e2_incomplete");
    assert.equal(sub88a.status, "incomplete", "Assinatura incomplete NÃO foi ativada por checkout antigo");

    // Pagamento antigo para o usuário em past_due
    const mockGetPayment88b = async (id) => ({
      id,
      value: 49.9,
      status: "CONFIRMED",
      externalReference: "usr_e2_pastdue:starter:chk_past_ancient_old",
    });

    await processAsaasWebhookEvent(
      { id: "evt_e2_88b", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e2_88b" } },
      {
        admin: mockDb88,
        getAsaasPayment: mockGetPayment88b,
        cancelAsaasSubscription: async () => {},
      }
    );

    const sub88b = mockDb88.tables.subscriptions.get("usr_e2_pastdue");
    assert.equal(sub88b.status, "past_due", "Assinatura past_due NÃO foi ativada por checkout antigo");

    console.log("   ✓ Todos os 8 cenários obrigatórios de correlação da Etapa 2 aprovados com sucesso.");
  }

  // ============================================================================
  // [BLOCO 9] TESTES OBRIGATÓRIOS DE IDEMPOTÊNCIA, CONCORRÊNCIA E RECUPERAÇÃO (ETAPA 3)
  // ============================================================================
  {
    console.log("\n[BLOCO 9] Idempotência atômica, concorrência e recuperação de webhooks (Etapa 3)...");

    // ------------------------------------------------------------------------
    // 9.1 Mesmo evento recebido duas vezes
    // ------------------------------------------------------------------------
    console.log("   -> 9.1 Mesmo evento recebido duas vezes não reprocessa e retorna duplicate...");
    const mockDb91 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e3_twice",
          {
            id: "sub_e3_1",
            user_id: "usr_e3_twice",
            plan: "starter",
            status: "incomplete",
            company_quota: 1,
            payment_link_id: "link_e3_1",
          },
        ],
      ],
    });

    const mockGetPayment91 = async (id) => ({
      id,
      value: 49.9,
      status: "CONFIRMED",
      paymentLink: "link_e3_1",
      externalReference: "usr_e3_twice:starter:chk_e3_1",
      dueDate: "2026-11-25",
    });

    const payload91 = {
      id: "evt_e3_twice_01",
      event: "PAYMENT_CONFIRMED",
      payment: { id: "pay_e3_twice_1" },
    };

    // Primeira entrega: processamento completo
    const res91a = await processAsaasWebhookEvent(payload91, {
      admin: mockDb91,
      getAsaasPayment: mockGetPayment91,
      cancelAsaasSubscription: async () => {},
    });
    assert.equal(res91a.statusCode, 200);
    assert.equal(res91a.body.processed, true);
    const sub91a = mockDb91.tables.subscriptions.get("usr_e3_twice");
    assert.equal(sub91a.status, "active");

    // Segunda entrega do mesmo evento: resposta idempotente com duplicate: true
    const res91b = await processAsaasWebhookEvent(payload91, {
      admin: mockDb91,
      getAsaasPayment: mockGetPayment91,
      cancelAsaasSubscription: async () => {},
    });
    assert.equal(res91b.statusCode, 200);
    assert.equal(res91b.body.duplicate, true);
    assert.equal(res91b.body.status, "processed");

    // ------------------------------------------------------------------------
    // 9.2 Dois processamentos simultâneos do mesmo evento existente
    // ------------------------------------------------------------------------
    console.log("   -> 9.2 Dois processamentos simultâneos do mesmo evento: segundo recebe 409 in_progress...");
    const mockDb92 = createMockSupabaseAdmin({
      webhook_events: [
        [
          "evt_e3_in_progress",
          {
            id: "evt_e3_in_progress",
            event: "PAYMENT_CONFIRMED",
            status: "processing",
            payload: {},
            attempts: 1,
            created_at: new Date().toISOString(),
            last_attempt_at: new Date().toISOString(),
          },
        ],
      ],
    });

    const res92 = await processAsaasWebhookEvent(
      { id: "evt_e3_in_progress", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e3_2" } },
      { admin: mockDb92, getAsaasPayment: mockGetPayment91 }
    );
    assert.equal(res92.statusCode, 409, "Lock ativo deve retornar HTTP 409");
    assert.equal(res92.body.status, "in_progress");

    // ------------------------------------------------------------------------
    // 9.3 Duas tentativas concorrentes para um evento ainda inexistente
    // ------------------------------------------------------------------------
    console.log("   -> 9.3 Duas tentativas concorrentes para evento novo: uma adquire e outra recebe 409...");
    const mockDb93 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e3_race",
          {
            id: "sub_e3_3",
            user_id: "usr_e3_race",
            plan: "starter",
            status: "incomplete",
            company_quota: 1,
            payment_link_id: "link_e3_race",
          },
        ],
      ],
    });

    const mockGetPayment93 = async (id) => ({
      id,
      value: 49.9,
      status: "CONFIRMED",
      paymentLink: "link_e3_race",
      externalReference: "usr_e3_race:starter:chk_e3_race",
      dueDate: "2026-11-25",
    });

    const racePayload = {
      id: "evt_e3_race_brand_new",
      event: "PAYMENT_CONFIRMED",
      payment: { id: "pay_e3_race_1" },
    };

    // Dispara duas requisições simultâneas reais
    const [raceRes1, raceRes2] = await Promise.all([
      processAsaasWebhookEvent(racePayload, { admin: mockDb93, getAsaasPayment: mockGetPayment93 }),
      processAsaasWebhookEvent(racePayload, { admin: mockDb93, getAsaasPayment: mockGetPayment93 }),
    ]);

    const statusCodes = [raceRes1.statusCode, raceRes2.statusCode].sort();
    assert.deepEqual(statusCodes, [200, 409], "Exatamente uma requisição deve processar (200) e a concorrente receber 409");

    // Verifica que pagamento foi gravado exatamente UMA vez
    const paymentsCount = Array.from(mockDb93.tables.billing_payments.values()).filter(
      (p) => p.asaas_payment_id === "pay_e3_race_1"
    ).length;
    assert.equal(paymentsCount, 1, "Pagamento gravado exatamente 1 vez na corrida");

    // ------------------------------------------------------------------------
    // 9.4 Evento previamente processado
    // ------------------------------------------------------------------------
    console.log("   -> 9.4 Evento previamente processado não executa lógica e retorna 200 duplicate...");
    const mockDb94 = createMockSupabaseAdmin({
      webhook_events: [
        [
          "evt_e3_done",
          {
            id: "evt_e3_done",
            event: "PAYMENT_CONFIRMED",
            status: "processed",
            processed_at: new Date().toISOString(),
          },
        ],
      ],
      subscriptions: [
        [
          "usr_e3_done",
          {
            id: "sub_e3_4",
            user_id: "usr_e3_done",
            plan: "starter",
            status: "active",
          },
        ],
      ],
    });

    let paymentFetched94 = false;
    const res94 = await processAsaasWebhookEvent(
      { id: "evt_e3_done", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e3_done" } },
      {
        admin: mockDb94,
        getAsaasPayment: async (id) => {
          paymentFetched94 = true;
          return { id, value: 49.9, status: "CONFIRMED" };
        },
      }
    );
    assert.equal(res94.statusCode, 200);
    assert.equal(res94.body.duplicate, true);
    assert.equal(paymentFetched94, false, "NÃO deve consultar Asaas nem reprocessar evento já concluído");

    // ------------------------------------------------------------------------
    // 9.5 Evento bloqueado em processing (preso além do timeout de 60s)
    // ------------------------------------------------------------------------
    console.log("   -> 9.5 Evento preso em processing além do timeout é recuperado atomicamente...");
    const expiredTime = new Date(Date.now() - 120 * 1000).toISOString();
    const mockDb95 = createMockSupabaseAdmin({
      webhook_events: [
        [
          "evt_e3_stuck",
          {
            id: "evt_e3_stuck",
            event: "PAYMENT_CONFIRMED",
            status: "processing",
            attempts: 1,
            created_at: expiredTime,
            last_attempt_at: expiredTime,
          },
        ],
      ],
      subscriptions: [
        [
          "usr_e3_stuck",
          {
            id: "sub_e3_5",
            user_id: "usr_e3_stuck",
            plan: "starter",
            status: "incomplete",
            payment_link_id: "link_e3_stuck",
          },
        ],
      ],
    });

    const res95 = await processAsaasWebhookEvent(
      { id: "evt_e3_stuck", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e3_stuck_1" } },
      {
        admin: mockDb95,
        getAsaasPayment: async (id) => ({
          id,
          value: 49.9,
          status: "CONFIRMED",
          paymentLink: "link_e3_stuck",
          externalReference: "usr_e3_stuck:starter:chk_e3_stuck",
          dueDate: "2026-11-25",
        }),
      }
    );
    assert.equal(res95.statusCode, 200, "Evento recuperado com sucesso após expiração do lock");
    const stuckEvtRow = mockDb95.tables.billing_webhook_events.get("evt_e3_stuck");
    assert.equal(stuckEvtRow.status, "processed");
    assert.equal(stuckEvtRow.attempts, 2, "Tentativa incrementada na recuperação");
    assert.equal(mockDb95.tables.subscriptions.get("usr_e3_stuck").status, "active");

    // ------------------------------------------------------------------------
    // 9.6 RPC indisponível ou com erro
    // ------------------------------------------------------------------------
    console.log("   -> 9.6 RPC indisponível ou com falha resulta em erro seguro HTTP 500 sem ativar plano...");
    const mockDb96 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e3_rpc_fail",
          {
            id: "sub_e3_6",
            user_id: "usr_e3_rpc_fail",
            plan: "starter",
            status: "incomplete",
            payment_link_id: "link_e3_rpc",
          },
        ],
      ],
    });

    // Cenário 9.6.1: RPC simulando erro de conexão
    mockDb96.setFailNextRpc(true);
    const resRpcError = await processAsaasWebhookEvent(
      { id: "evt_e3_rpc_err", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e3_rpc_1" } },
      {
        admin: mockDb96,
        getAsaasPayment: async (id) => ({ id, value: 49.9, status: "CONFIRMED" }),
      }
    );
    assert.equal(resRpcError.statusCode, 500, "Erro na RPC deve retornar HTTP 500");
    assert.equal(mockDb96.tables.subscriptions.get("usr_e3_rpc_fail").status, "incomplete", "Assinatura não pode ser ativada");

    // Cenário 9.6.2: Cliente sem método rpc disponível
    const mockDbNoRpc = { ...mockDb96, rpc: undefined };
    const resNoRpc = await processAsaasWebhookEvent(
      { id: "evt_e3_no_rpc", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e3_rpc_2" } },
      {
        admin: mockDbNoRpc,
        getAsaasPayment: async (id) => ({ id, value: 49.9, status: "CONFIRMED" }),
      }
    );
    assert.equal(resNoRpc.statusCode, 500, "Ausência da RPC deve falhar de forma segura com HTTP 500");
    assert.equal(mockDb96.tables.subscriptions.get("usr_e3_rpc_fail").status, "incomplete");

    // ------------------------------------------------------------------------
    // 9.7 Falha transitória de persistência
    // ------------------------------------------------------------------------
    console.log("   -> 9.7 Falha transitória de persistência marca failed e recupera no retry...");
    const mockDb97 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e3_db_fail",
          {
            id: "sub_e3_7",
            user_id: "usr_e3_db_fail",
            plan: "starter",
            status: "incomplete",
            payment_link_id: "link_e3_db",
          },
        ],
      ],
    });

    const mockGetPayment97 = async (id) => ({
      id,
      value: 49.9,
      status: "CONFIRMED",
      paymentLink: "link_e3_db",
      externalReference: "usr_e3_db_fail:starter:chk_e3_db",
      dueDate: "2026-11-25",
    });

    // Simula falha na escrita de subscriptions
    mockDb97.setFailNextUpdateSubscriptions(true);
    const resDbFail97 = await processAsaasWebhookEvent(
      { id: "evt_e3_db_fail_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e3_db_1" } },
      { admin: mockDb97, getAsaasPayment: mockGetPayment97 }
    );
    assert.equal(resDbFail97.statusCode, 500, "Falha de banco retorna HTTP 500 para instruir Asaas a reenviar");
    const evtDbFailRow = mockDb97.tables.billing_webhook_events.get("evt_e3_db_fail_01");
    assert.equal(evtDbFailRow.status, "failed", "Evento registrado como failed");
    assert.equal(mockDb97.tables.subscriptions.get("usr_e3_db_fail").status, "incomplete");

    // Retentativa com banco restabelecido
    const resDbRetry97 = await processAsaasWebhookEvent(
      { id: "evt_e3_db_fail_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e3_db_1" } },
      { admin: mockDb97, getAsaasPayment: mockGetPayment97 }
    );
    assert.equal(resDbRetry97.statusCode, 200, "Retry após recuperação processa com sucesso");
    assert.equal(mockDb97.tables.subscriptions.get("usr_e3_db_fail").status, "active");
    assert.equal(mockDb97.tables.billing_webhook_events.get("evt_e3_db_fail_01").status, "processed");

    // ------------------------------------------------------------------------
    // 9.8 Falha de cancelamento externo e recuperação
    // ------------------------------------------------------------------------
    console.log("   -> 9.8 Falha de cancelamento no Asaas não conclui silenciosamente e recupera...");
    const mockDb98 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e3_cancel_fail",
          {
            id: "sub_e3_8",
            user_id: "usr_e3_cancel_fail",
            plan: "starter",
            status: "active",
            gateway_subscription_id: "sub_starter_live_98",
            pending_plan: "pro",
            pending_checkout_id: "chk_pro_cancel_98",
            payment_link_id: "link_pro_cancel_98",
            previous_gateway_subscription_id: "sub_starter_live_98",
          },
        ],
      ],
    });

    let cancelAsaasSucceeds = false;
    const mockCancelSub98 = async (subId) => {
      if (!cancelAsaasSucceeds) {
        throw new Error(`Asaas API 500 ao cancelar assinatura ${subId}`);
      }
    };

    const mockGetProPayment98 = async (id) => ({
      id,
      subscription: "sub_pro_new_98",
      value: 97.0,
      status: "CONFIRMED",
      paymentLink: "link_pro_cancel_98",
      externalReference: "usr_e3_cancel_fail:pro:chk_pro_cancel_98",
      dueDate: "2026-11-25",
    });

    const resCancelFail98 = await processAsaasWebhookEvent(
      { id: "evt_e3_cancel_fail_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e3_pro_98" } },
      {
        admin: mockDb98,
        getAsaasPayment: mockGetProPayment98,
        cancelAsaasSubscription: mockCancelSub98,
      }
    );
    assert.equal(resCancelFail98.statusCode, 500, "Falha ao cancelar assinatura antiga NÃO pode marcar sucesso");
    const subCancelFail = mockDb98.tables.subscriptions.get("usr_e3_cancel_fail");
    assert.equal(subCancelFail.previous_gateway_subscription_id, "sub_starter_live_98", "Preserva previous_gateway_subscription_id para retentativa");
    assert.equal(mockDb98.tables.billing_webhook_events.get("evt_e3_cancel_fail_01").status, "failed");

    // Retentativa com cancelamento remoto restabelecido
    cancelAsaasSucceeds = true;
    const resCancelRetry98 = await processAsaasWebhookEvent(
      { id: "evt_e3_cancel_fail_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_e3_pro_98" } },
      {
        admin: mockDb98,
        getAsaasPayment: mockGetProPayment98,
        cancelAsaasSubscription: mockCancelSub98,
      }
    );
    assert.equal(resCancelRetry98.statusCode, 200, "Retentativa conclui com sucesso");
    const subCancelSuccess = mockDb98.tables.subscriptions.get("usr_e3_cancel_fail");
    assert.equal(subCancelSuccess.plan, "pro");
    assert.equal(subCancelSuccess.previous_gateway_subscription_id, null, "previous_gateway_subscription_id limpo após confirmação");

    // ------------------------------------------------------------------------
    // 9.9 Pagamento abaixo do valor exigido
    // ------------------------------------------------------------------------
    console.log("   -> 9.9 Pagamento com valor insuficiente rejeita estritamente e registra auditoria...");
    const mockDb99 = createMockSupabaseAdmin({
      subscriptions: [
        [
          "usr_e3_under",
          {
            id: "sub_e3_9",
            user_id: "usr_e3_under",
            plan: "starter",
            status: "incomplete",
            pending_plan: "pro",
            pending_checkout_id: "chk_under_99",
            payment_link_id: "link_under_99",
          },
        ],
      ],
    });

    const resUnder99 = await processAsaasWebhookEvent(
      { id: "evt_e3_under_01", event: "PAYMENT_CONFIRMED", payment: { id: "pay_under_30" } },
      {
        admin: mockDb99,
        getAsaasPayment: async (id) => ({
          id,
          value: 30.0, // Insuficiente para R$ 97,00
          status: "CONFIRMED",
          paymentLink: "link_under_99",
          externalReference: "usr_e3_under:pro:chk_under_99",
        }),
      }
    );
    assert.equal(resUnder99.statusCode, 500, "Valor insuficiente rejeita ativação com HTTP 500");
    const subUnder99 = mockDb99.tables.subscriptions.get("usr_e3_under");
    assert.equal(subUnder99.status, "incomplete", "Plano NÃO ativado");
    const paymentRowUnder = Array.from(mockDb99.tables.billing_payments.values()).find(
      (p) => p.asaas_payment_id === "pay_under_30"
    );
    assert.ok(paymentRowUnder, "Pagamento insuficiente registrado em billing_payments para auditoria financeira");
    assert.equal(paymentRowUnder.value, 30.0);

    // ------------------------------------------------------------------------
    // 9.10 Reprocessamento após falha sem duplicar pagamento nem plano
    // ------------------------------------------------------------------------
    console.log("   -> 9.10 Reprocessamento não duplica registros em billing_payments...");
    const paymentsForUser = Array.from(mockDb97.tables.billing_payments.values()).filter(
      (p) => p.user_id === "usr_e3_db_fail"
    );
    assert.equal(paymentsForUser.length, 1, "Exatamente 1 registro de pagamento após falha e recuperação");

    console.log("   ✓ Todos os 10 cenários obrigatórios de idempotência, concorrência e recuperação da Etapa 3 aprovados com sucesso.");
  }

  console.log("\n===============================================================================");
  console.log("=== SUCESSO: TODAS AS INVARIANTES E REQUISITOS DA MATRIZ PASSARAM COM ÊXITO! ===");
  console.log("===============================================================================");
}

runRealResilienceTests().catch((err) => {
  console.error("ERRO nos testes funcionais de resiliência:", err);
  process.exit(1);
});

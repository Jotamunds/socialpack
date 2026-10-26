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

  const client = {
    tables,
    setFailNextUpdateSubscriptions(val) {
      failNextUpdateSubscriptions = val;
    },
    setFailNextUpsertPayments(val) {
      failNextUpsertPayments = val;
    },
    async rpc(fnName, params) {
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

  console.log("\n===============================================================================");
  console.log("=== SUCESSO: TODAS AS INVARIANTES E REQUISITOS DA MATRIZ PASSARAM COM ÊXITO! ===");
  console.log("===============================================================================");
}

runRealResilienceTests().catch((err) => {
  console.error("ERRO nos testes funcionais de resiliência:", err);
  process.exit(1);
});

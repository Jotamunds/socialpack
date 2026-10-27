# PLANO DE IMPLEMENTAÇÃO — Valor exato, estorno automático e telas de revisão (Billing Asaas)

> Documento de planejamento para execução por agente externo (Antigravity). Leia inteiro antes de codificar.
> Branch de trabalho base: `test/billing-resilience-manual-review`. Estado de partida: árvore limpa, `npm run test:billing` e build passando.

---

## 0. Regras de negócio fixadas pelo dono do produto (não negociáveis)

1. **Valor exato.** O cliente paga exatamente o preço do plano definido no servidor. Nem inferior nem superior é aceito para ativar assinatura.
2. **Sobrepreço → estorno imediato.** Se o valor pago for MAIOR que o preço do plano, o SocialPack chama o estorno do Asaas automaticamente, no momento do processamento do webhook, ANTES de aceitar o pagamento. A assinatura não é ativada e o cliente vê o estado em tela personalizada.
3. **Subpreço → revisão manual.** Se o valor pago for MENOR, o fluxo atual já encaminha para `manual_review` e NÃO ativa. Esse comportamento se mantém; o novo trabalho aqui é apenas o rótulo na tela.
4. **Preço só no servidor.** Preços permanecem exclusivamente em `src/lib/billing/plans.ts` (`BILLING_PLANS`). A interface apenas EXIBE o valor; nenhuma entrada do usuário altera preço, plano cobrado ou moeda.
5. **Dados financeiros ficam.** `billing_payments` (value, net_value, billing_type, invoice_url, due_date, payment_date) continua sendo gravado. São dados operacionais que sustentam renovação e desativação automática (subscription-guard) e não são dados sensíveis pela LGPD.
6. **Meios de pagamento corretos.** Recebimento deve ocorrer via: **cartão de crédito (assinatura)**, **pix automático** (se/quando suportado pela conta Asaas), **débito automático em conta** (se aplicável). Recebimentos por fora desse conjunto (dinheiro/`RECEIVED_IN_CASH`, boleto, métodos manuais) NUNCA ativam assinatura automaticamente.
7. **Desativação automática por vigência já existe** (`src/lib/supabase/subscription-guard.ts` + status `past_due` via `PAYMENT_OVERDUE`). Não recriar esse mecanismo.

---

## 1. Novo conceito: código estruturado de revisão (`review_code`)

Hoje o motivo da revisão manual vai apenas como texto livre em `error_message`. Para a tela personalizada e para auditoria, o processador passará a gravar também um código estável.

Códigos possíveis (constantes, definidas em `src/lib/billing/plans.ts` ou novo arquivo `src/lib/billing/review-codes.ts`):

| Código | Significado |
|---|---|
| `OVERPAID_REFUNDED` | Valor pago maior que o plano; estorno solicitado ao Asaas com sucesso. |
| `OVERPAID_REFUND_FAILED` | Valor pago maior; a chamada de estorno falhou (saldo indisponível, erro de rede/Asaas). Suporte resolve manualmente. |
| `UNDERPAID` | Valor pago menor que o plano (ex.: boleto parcial). Nenhuma ativação. |
| `UNSUPPORTED_METHOD` | Pagamento recebido por meio fora da lista aceita (inclui `RECEIVED_IN_CASH`), com valor exato. |
| `UNMATCHED_PAYMENT` | Pagamento sem assinatura local correlacionável. |
| `STALE_LINK` / `DIVERGENT_CHECKOUT` / `PLAN_MISMATCH` / `NO_CORRELATION` | Casos de correlação que hoje caem em `manual_review` (mapear literalmente os motivos existentes). |

### Migração nova: `supabase/migrations/20261026170000_billing_review_codes.sql`

```sql
-- 1) Colunas novas (aditivas, não destrutivas)
alter table public.billing_webhook_events
  add column if not exists review_code text,
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- 2) Índices para leitura operacional
create index if not exists idx_billing_webhook_events_review
  on public.billing_webhook_events(status, review_code);
create index if not exists idx_billing_webhook_events_user
  on public.billing_webhook_events(user_id);

-- 3) NADA mais. Não alterar acquire_billing_webhook_event (a versão da
--    migration 20261026160000 já trata manual_review como terminal).
```

### NEGATIVAS desta seção

- **NÃO** remover, renomear ou recriar colunas/constraints existentes de qualquer tabela.
- **NÃO** alterar a função `acquire_billing_webhook_event` (o comportamento terminal de `manual_review` já está correto na migration 20261026160000).
- **NÃO** apagar, limpar ou encolher o campo `payload jsonb` de `billing_webhook_events` (retenção será decidida futuramente pelo dono).
- **NÃO** tocar em `billing_payments` (nenhuma coluna é removida; o dono decidiu manter value/net_value/datas).
- **NÃO** criar política RLS aliviada para `billing_webhook_events` (permanece sem política para authenticated/anon; service_role apenas).
- **NÃO** usar `review_code` como fonte de verdade para decisões de processamento — o processador decide em runtime e grava o código apenas para auditoria e UI.
- **NÃO** inventar códigos fora da tabela acima sem atualizar este documento.

---

## 2. Regra de valor exato no servidor (`plans.ts`)

### 2.1 Contexto técnico obrigatório

Na API do Asaas, `value` é o valor efetivamente pago e `originalValue` é retornado quando o valor pago **difere do valor original da cobrança** (boleto pago parcialmente, juros/multa por atraso). Portanto:

- O "valor cobrado" (preço da cobrança) deve ser validado sobre `originalValue ?? value`.
- O "o que entrou" é `value`.
- Cobrança original == preço do plano E `value > originalValue` ⇒ o cliente pagou o plano + juros/multa do próprio Asaas (renovação paga em atraso). **Isto permanece válido e ativa** — os juros são cobrança automática do gateway, não alteração de preço do SocialPack.
- `originalValue != preço do plano`, ou `value != preço do plano` quando não há `originalValue` ⇒ divergência exata: menor → `UNDERPAID`; maior → refund automático.

### 2.2 Mudanças em `src/lib/billing/plans.ts`

Mantendo `BILLING_PLANS` como única fonte de verdade, adicionar:

```ts
/** Valor original cobrado pelo gateway em centavos (originalValue ?? value). */
export function getChargedCents(payment: { value: number; originalValue?: number | null }): number;

/** Classificação de valor EXATO contra o preço do plano, em centavos. */
export function classifyPaymentAmountForPlan(
  plan: BillingPlanId,
  payment: { value: number; originalValue?: number | null }
): { kind: "exact"; interestCents: number } | { kind: "underpaid" } | { kind: "overpaid" };
```

- `getChargedCents`: `Math.round((payment.originalValue ?? payment.value) * 100)` com guardas de NaN/negativo.
- `classifyPaymentAmountForPlan`: substitui a checagem atual. `validatePaymentAmountForPlan` deve ser removido ou convertido em wrapper que chama a nova função (escolher UMA forma e atualizar todos os call sites — grep por `validatePaymentAmountForPlan`).
- Whitelist de meios aceitos, também em `plans.ts`:

```ts
export const ACCEPTED_BILLING_TYPES = ["CREDIT_CARD", "PIX", "DEBIT_CARD"] as const;
```

(`PIX` e `DEBIT_CARD` entram na lista como classificação aceita no webhook; o que o checkout aceita depende do item 4.)

### 2.3 NEGATIVAS desta seção

- **NÃO** usar comparação `>=` em nenhum lugar (hoje é o bug do sobrepreço).
- **NÃO** validar sobre `netValue` (é valor líquido pós-taxas) nem sobre `bankSlipUrl`/outros campos.
- **NÃO** introduzir tolerância de centavos, arredondamento próprio além de `Math.round(x*100)`, nem conversão de moeda.
- **NÃO** bloquear ativação quando `originalValue == preço do plano` e `value > originalValue` apenas por juros/multa de atraso (caso legítimo descrito em 2.1). **NÃO** estornar esses casos.
- **NÃO** definir preço de plano em outro arquivo ou constante local, nem ler preço de: URL, `searchParams`, formulário, `localStorage`, payload do webhook, resposta do Asaas ou cadastro do banco.
- **NÃO** inferir plano a partir do valor pago em nenhuma lógica nova (a inferência atual de `value === 49.9` é removida no item 6, e nenhuma nova pode ser criada).
- **NÃO** renomear `BillingPlanId`, `BILLING_PLANS` ou quebrar a assinatura pública exportada sem atualizar todos os call sites.

---

## 3. Processador de webhook: decisão de valor + estorno automático (`webhook-processor.ts`)

### 3.1 Fluxo-alvo (substituindo o bloco atual de validação de valor em `handlePaymentEvent`)

1. Manter TODAS as proteções atuais exatamente na ordem em que estão: correlação de assinatura (busca por gateway_sub → link → user), rejeição cross-user, individualização de assinatura anterior (`isPreviousSubPayment`), anti-downgrade Pro, link obsoleto, checkout divergente, plano divergente, âncora de correlação. **Nenhuma dessas regras muda.**
2. No lugar do bloco de validação de valor (linhas ~572-583), usar `classifyPaymentAmountForPlan(intendedPlan, realPayment)`:
   - `exact` (com ou sem juros) → segue o fluxo atual de ativação/renovação.
   - `underpaid` → grava pagamento, marca `manual_review` com `review_code: "UNDERPAID"`, HTTP 200.
   - `overpaid` → ver 3.2.
3. Novo parâmetro de dependência aceito por `WebhookProcessorDependencies` e `handlePaymentEvent`:

```ts
refundAsaasPayment?: (paymentId: string) => Promise<void>; // default: refundAsaasPayment de asaas.ts
```

   Padrão do projeto: chamadas externas novas ficam em `src/lib/billing/asaas.ts`.

### 3.2 Sobrepreço → estorno imediato

Quando `classifyPaymentAmountForPlan` retornar `overpaid`:

1. Chamar `refundAsaasPayment(realPayment.id)` (estorno total, sem parâmetro de valor parcial).
2. Marcar `manual_review` com:
   - estorno OK → `review_code: "OVERPAID_REFUNDED"`, `error_message` = texto com `paymentId`, valor pago (R$) e preço do plano;
   - estorno FALHOU → `review_code: "OVERPAID_REFUND_FAILED"`, `error_message` = mesmo texto + mensagem do erro do Asaas.
3. Responder HTTP 200 (decisão de negócio terminal) nos dois casos.
4. A assinatura NUNCA é ativada, renovada, rebaixada ou tocada nesses casos. O pagamento entra em `billing_payments` para auditoria (como já acontece).

### 3.3 `refundAsaasPayment` em `asaas.ts`

```ts
export async function refundAsaasPayment(paymentId: string): Promise<void> {
  // POST /payments/{id}/refund
  // 200 => ok; 409/erro indicando já estornado => ok idempotente; outro erro => throw.
}
```

### 3.4 Ajuste no branch de estorno recebido: `PAYMENT_REFUNDED`

Ao receber webhook de estorno (derivado do estorno automático ou de ação manual no painel), o branch atual marca a assinatura como `past_due` para qualquer estado. Isso está errado para conta jamais ativada. Regra nova:

- Só marcar `past_due` se o status atual da assinatura for `"active"` (ou `"trialing"`).
- Se a assinatura está `incomplete` (checkout estornado), apenas registrar o pagamento e marcar o evento `processed`, SEM alterar o status da assinatura, SEM limpar `pending_*`, SEM tocar no link de pagamento — o cliente pode refazer o pagamento pelo mesmo link.

### 3.5 Meio de pagamento não suportado

Depois das checagens de correlação e junto da validação de valor:

- Se `realPayment.billingType` não estiver em `ACCEPTED_BILLING_TYPES` (ou evento/status for `RECEIVED_IN_CASH`):
  - gravar pagamento, `manual_review` com `review_code: "UNSUPPORTED_METHOD"`, HTTP 200;
  - **SEM estorno automático** — a regra do estorno vale apenas para meios no fluxo aceito; dinheiro e métodos manuais são reconciliados pelo suporte;
  - sem ativação, sem 500.

Ordem final no `handlePaymentEvent` (todas antes de qualquer ativação):
`correlação/segurança (inalterada) → meio de pagamento (3.5) → valor exato (3.1) → estorno se overpaid (3.2) → ativação apenas se exact`.

### 3.6 NEGATIVAS desta seção

- **NÃO** responder 500 para os casos overpaid/underpaid/método não suportado/qualquer `manual_review` (o Asaas entenderia como falha de infra e reenviaria para sempre). 500 fica EXCLUSIVAMENTE para: falha de lock/RPC, falha de rede com Asaas (GET payment), falha de persistência no banco, falha de cancelamento remoto — exatamente como hoje.
- **NÃO** estornar parcialmente (nunca passar `value`/`splitRefunds` na chamada de refund — refund é total ou nada).
- **NÃO** tentar estorno mais de uma vez dentro de um mesmo webhook (sem retry loop local; entrega at-least-once do Asaas permite nova tentativa em reenvio).
- **NÃO** estornar recebimentos em `RECEIVED_IN_CASH` ou métodos fora da whitelist que venham com valor exato (dinheiro recebido por fora é caso de suporte, nunca automação).
- **NÃO** estornar/alterar pagamento que já esteja `REFUNDED`/`REFUND_IN_PROGRESS` (idempotência; tratar retorno "já estornado" do Asaas como sucesso).
- **NÃO** cancelar assinatura, link de pagamento ou conta do cliente no Asaas em caso de valor divergente. O cliente tem que poder refazer o pagamento pelo mesmo link.
- **NÃO** ativar assinatura em nenhum caminho divergente de valor/método (nenhum "ativa e estorna a diferença", nenhum "ativa com cota reduzida").
- **NÃO** mover/reescrever as proteções de correlação (downgrade, link obsoleto, checkout divergente, cross-user, `previous_gateway_subscription_id`) — apenas o bloco de valor é trocado.
- **NÃO** confiar no payload do webhook para valores: a validação usa SEMPRE `realPayment` vindo do `getAsaasPayment` reconsultado no Asaas.
- **NÃO** depender do webhook `PAYMENT_REFUNDED` para responder 200 ao estorno (a chamada síncrona ao refund já determina o resultado; o estado pós-estorno fica auditável em linhas de `billing_payments`).
- **NÃO** mudar o cálculo de período (`calculatePeriodEnd`) nem o grace period de 3 dias úteis.

---

## 4. Meio de pagamento aceito no checkout (`asaas.ts` + `billing.ts`)

### 4.1 O que fazer

- Em `createPaymentLinkForPlan`, tentar criar o link com `billingType: "CREDIT_CARD"`, restringindo o checkout ao meio principal; se a API do Asaas rejeitar `CREDIT_CARD` para `chargeType: "RECURRENT"` (erro de constraint), manter `billingType: "UNDEFINED"` e deixar o webhook aplicar a whitelist (3.5) como rede de segurança.
- Pix automático e débito automático: **só habilitar no link** depois de confirmar, no sandbox da conta real usada pelo projeto, que a conta os suporta para recorrência. Enquanto não confirmado, ficam apenas na whitelist do webhook (3.5), sem alteração no link.

### 4.2 NEGATIVAS desta seção

- **NÃO** habilitar boleto (`BOLETO`) no checkout — decisão do dono: por enquanto os meios são cartão, pix automático, débito automático.
- **NÃO** implementar "pix automático" adivinhando endpoints ou parâmetros não documentados da API v3.
- **NÃO** alterar `chargeType`, `subscriptionCycle` ou o formato do `externalReference` (`userId:plan:checkoutId` — aprovado pelo dono; não adicionar dados pessoais).
- **NÃO** colocar preço, plano ou qualquer valor vindo do cliente no payload do link (o `value` do link é sempre `planConfig.price`).
- **NÃO** mudar a tela de escolha dos planos neste item (mudança de UI pertence ao item 5, apenas para estados de revisão).

---

## 5. Telas personalizadas de revisão/estorno (front)

### 5.1 Dado de entrada

- Server Component (padrão do projeto, ex. `src/app/planos/page.tsx`) lê, para o usuário logado, a linha mais recente de `billing_webhook_events` com `status = "manual_review"` filtrando por `user_id` (coluna nova da migração) e o campo `review_code`.
- Estado de tela derivado:
  - `OVERPAID_REFUNDED` → "Recebemos um pagamento com valor diferente do plano escolhido. O estorno foi solicitado ao Asaas."
  - `OVERPAID_REFUND_FAILED` → idem + "Nosso time fará o estorno manualmente."
  - `UNDERPAID` → "O valor pago não corresponde ao plano. Refaça o pagamento pelo link oficial."
  - `UNSUPPORTED_METHOD` → "Recebemos por um meio fora do fluxo oficial. Seu dinheiro está seguro — falar com o suporte."
- Novo componente em `src/components/planos/PaymentReview.tsx`, no padrão visual de `src/components/planos/PaymentProblem.tsx` (mesmas classes, paleta e cards `rounded-xl`). Sempre acompanhado do link de pagamento (`AwaitingPayment`) quando `payment_url` ainda é válido.
- Atualização simples: botão "Atualizar" + revalidação; opcional um `setInterval` client-side de 15–20 s chamando um Server Action que só revalida o path.

### 5.2 NEGATIVAS desta seção

- **NÃO** exibir `error_message`, IDs internos de evento, valores do `payload` ou qualquer texto técnico ao usuário — só os textos mapeados por `review_code`.
- **NÃO** ler `billing_webhook_events` com a chave anon/authenticated do lado do cliente (a tabela não tem política RLS de usuário); a leitura é SEMPRE server-side, via service_role/admin, dentro do Server Component/action.
- **NÃO** criar realtime/WebSocket, nem consultar a API do Asaas a partir do navegador.
- **NÃO** expor detalhes do estorno com copy estigmatizante ("você pagou errado"); texto neutro, com o valor correto do plano exibido vindo de `plans-display`.
- **NÃO** renderizar preço em componentes client a partir de dados do usuário; os preços exibidos continuam vindo do servidor (`plans-display` / `BILLING_PLANS`).
- **NÃO** tocar em `PaymentError`/`PaymentDeclined` existentes (componentes de falha), além de reusar o padrão visual.
- **Acessibilidade:** componentes novos devem usar `<section aria-labelledby>` e `role="status"/"alert"` como os existentes.

---

## 6. Errata técnica do processador atual (2 correções simples que acompanham)

### 6.1 Preço hardcoded `49.9`

Em `webhook-processor.ts` (~linha 467), o detector de pagamento Starter usa literal `realPayment.value === 49.9`.

- Trocar por comparação em centavos com as constantes: `Math.round(realPayment.value * 100) === BILLING_PLANS.starter.priceCents` (idealmente via helper `getChargedCents` do item 2).

**NEGATIVAS:** **NÃO** substituir por inferência de plano que não passe por `BILLING_PLANS`; **NÃO** afrouxar a proteção anti-downgrade (o destino `manual_review` de `isStarterPayment` se mantém); **NÃO** reordenar esse bloco em relação às demais checagens.

### 6.2 Pagamento órfão → fila infinita de 500

Hoje, pagamento sem assinatura local correlacionável lança exceção → 500 → o Asaas reenvia infinitamente.

- Trocar por decisão terminal: quando houver user identificável (externalReference), gravar o pagamento; marcar o evento como `manual_review` com `review_code: "UNMATCHED_PAYMENT"` (pode ficar com `user_id = null` quando não correlacionável) e responder HTTP 200.

**NEGATIVAS:** **NÃO** usar 500 nesses casos; **NÃO** cancelar/estornar a cobrança de pagamento órfão no Asaas (dinheiro de terceiro, risco jurídico — só suporte); **NÃO** criar linha em `subscriptions` a partir do webhook; **NÃO** adivinhar o dono pelo `customer` id do Asaas (não há mapping local confiável); **NÃO** marcar o evento como `processed` (fica revisável em `manual_review`).

---

## 7. Testes (scripts/test-billing-resilience.mjs)

### 7.1 Novos casos obrigatórios

| # | Cenário | Esperado |
|---|---|---|
| T1 | Pagamento do valor exato do plano (baseline) | HTTP 200, `processed`, assinatura ativa. |
| T2 | **Sobrepreço (ex.: R$ 970 para Pro)** com refund OK | HTTP 200, `manual_review`, `review_code OVERPAID_REFUNDED`, assinatura intocada, refund chamado 1×, pagamento registrado. |
| T3 | Sobrepreço com refund falhando (mock de erro) | HTTP 200 (não 500), `review_code OVERPAID_REFUND_FAILED`, assinatura intocada; reentrega do webhook vira `already_processed` (idempotência terminal). |
| T4 | Renovação em atraso com juros: `originalValue = 97, value = 99.20` para Pro | HTTP 200, `processed`, assinatura ativa (juros do Asaas permitidos), refund NUNCA chamado. |
| T5 | Boleto parcial: `originalValue = 97, value = 50` | HTTP 200, `UNDERPAID`, sem ativação, refund nunca chamado. |
| T6 | `RECEIVED_IN_CASH` com valor exato | HTTP 200, `UNSUPPORTED_METHOD`, sem ativação, refund nunca chamado. |
| T7 | `PAYMENT_REFUNDED` para assinatura `incomplete` | HTTP 200, `processed`, status da assinatura permanece `incomplete`. |
| T8 | `PAYMENT_REFUNDED` para assinatura `active` | HTTP 200, status vira `past_due` (comportamento mantido). |
| T9 | Pagamento órfão (sem assinatura correlacionável) | HTTP 200, `UNMATCHED_PAYMENT`, sem cancelamento no Asaas, sem 500, reentrega idempotente. |
| T10 | Meios aceitos: `PIX`/`DEBIT_CARD` com valor exato | HTTP 200, `processed` (whitelist de classificação funciona). |

### 7.2 NEGATIVAS desta seção

- **NÃO** remover ou quebrar nenhum dos testes existentes (Blocos 1–9 e a matriz E2E continuam todos passando).
- **NÃO** usar rede real nos testes: mock das dependências (`getAsaasPayment`, `refundAsaasPayment`, `cancelAsaasSubscription`, admin Supabase) no padrão já usado (`__TSX_RUNNING__`, `Module._load` interceptando `server-only`).
- **NÃO** alterar a delegação `spawnSync`/`tsx` no topo do script.
- **NÃO** incluir testes de integração reais contra o sandbox do Asaas na suíte padrão (validação real usa o script separado `test-billing-asaas.mjs` que já existe).
- **NÃO** migrar para jest/vitest ou introduzir framework de teste novo.

---

## 8. Fora de escopo (explícito, não implementar)

- Nenhuma mudança de build/config (Next 16, tsconfig, ESLint).
- Não mexer em `subscription-guard.ts`, no cálculo de `current_period_end`, no grace period, no middleware, nas telas de perfil/configurações (nenhuma UI além do item 5).
- Não mexer em `.env*`, `src/lib/env.ts`, sandbox detection, token de webhook (`verifyAsaasWebhookToken` já está correto).
- Não mexer em `startPlanCheckoutAction` (ele não precisa mudar para este plano).
- Não criar cron/edge function para expirar assinaturas por vigência (desativação automática já coberta por `PAYMENT_OVERDUE` + `subscription-guard`).
- Não criar lógica de retenção/anonimização do `payload` jsonb (decisão futura do dono).
- Não tocar em `test-billing-asaas.mjs` além do estritamente necessário para compilar.

---

## 9. Critérios de aceite (verificação final)

1. `npm run lint` — os erros pré-existentes em `AppearanceSelector.tsx` / `usePostsViewMode.ts` PODEM continuar (escopo de outra tarefa); nenhum erro NOVO pode aparecer. **NÃO** "consertar" arquivos fora do escopo deste plano para fazer o lint passar.
2. `npm run test:billing` — 100% dos blocos 1–9 + testes novos T1–T10 passando, sem chamada de rede real.
3. `npm run test:billing:security` e `npm run templates:check` continuam passando.
4. `npm run build` compila.
5. Revisão manual do diff: todas as NEGATIVAS dos itens 1–8 respeitadas, em especial: nada de `>=` em validação de valor, nenhuma remoção de coluna, nenhum 500 em caso de `manual_review`, nenhum cancelamento/estorno automático fora das regras do item 3.

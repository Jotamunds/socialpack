import { NextResponse } from "next/server";
import { verifyAsaasWebhookToken } from "@/lib/billing/asaas";
import {
  processAsaasWebhookEvent,
  type AsaasWebhookPayload,
} from "@/lib/billing/webhook-processor";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Webhook do Asaas v3.
 *
 * Invariantes de segurança e resiliência:
 * 1. Validação do cabeçalho asaas-access-token com verifyAsaasWebhookToken.
 * 2. Idempotência atômica gerenciada na tabela billing_webhook_events.
 * 3. Re-consulta oficial dos dados de pagamento via getAsaasPayment.
 * 4. Validação estrita de valores em centavos via validatePaymentAmountForPlan (R$ 49,90 Starter / R$ 97,00 Pro).
 * 5. Prevenção de downgrade por pagamentos de assinaturas anteriores (previous_gateway_subscription_id).
 */
export async function POST(request: Request) {
  // 1. Validação de segurança do token de webhook em tempo constante
  const receivedToken = request.headers.get("asaas-access-token");
  const isAuthorized = verifyAsaasWebhookToken(receivedToken);

  if (!isAuthorized) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: AsaasWebhookPayload;
  try {
    body = (await request.json()) as AsaasWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Payload JSON inválido" }, { status: 400 });
  }

  // Ping ou notificação sem identificador essencial
  if (!body.id || !body.event) {
    return NextResponse.json({ received: true, ignored: true });
  }

  // 2. Delega ao processador de webhook resiliente e atômico
  const result = await processAsaasWebhookEvent(body);

  return NextResponse.json(result.body, { status: result.statusCode });
}



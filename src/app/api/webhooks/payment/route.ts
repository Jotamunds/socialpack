import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { PLANS, updateSubscription } from "@/lib/subscription-store";
import type { PlanId } from "@/lib/types";

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET || "socialpack_webhook_secret_2026";
    const signature = request.headers.get("x-webhook-secret") || request.headers.get("x-signature") || "";

    // Validação de segurança da assinatura do webhook
    if (signature && !safeCompare(signature, webhookSecret)) {
      return NextResponse.json({ error: "Assinatura de webhook inválida." }, { status: 403 });
    }

    const payload = await request.json().catch(() => null);
    if (!payload || !payload.event) {
      return NextResponse.json({ error: "Payload do webhook mal formatado." }, { status: 400 });
    }

    const event = String(payload.event);
    const data = payload.data || {};
    const userEmail = typeof data.userEmail === "string" ? data.userEmail.trim().toLowerCase() : "";
    const planId = (data.planId || "starter") as PlanId;

    if (!userEmail) {
      return NextResponse.json({ error: "E-mail do usuário não fornecido." }, { status: 400 });
    }

    // Processa eventos de sucesso de pagamento ou ativação de assinatura
    if (event === "payment.succeeded" || event === "subscription.activated") {
      const plan = PLANS.find((p) => p.id === planId) || PLANS[0]; // default starter
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);

      const updated = await updateSubscription(userEmail, {
        status: "active",
        planId: plan.id,
        generationQuota: typeof data.generationQuota === "number" ? data.generationQuota : plan.quota,
        usedGenerations: typeof data.usedGenerations === "number" ? data.usedGenerations : 0,
        packsCreatedCount: typeof data.packsCreatedCount === "number" ? data.packsCreatedCount : (typeof data.usedGenerations === "number" ? data.usedGenerations : 0),
        currentPeriodEnd: nextMonth.toISOString(),
      });

      return NextResponse.json({
        received: true,
        event,
        status: "active",
        userEmail,
        planId: plan.id,
        generationQuota: plan.quota,
        updatedAt: updated.updatedAt,
      });
    }

    // Eventos de cancelamento ou inadimplência
    if (event === "subscription.canceled" || event === "payment.failed") {
      const updated = await updateSubscription(userEmail, {
        status: event === "subscription.canceled" ? "canceled" : "past_due",
      });

      return NextResponse.json({
        received: true,
        event,
        status: updated.status,
        userEmail,
      });
    }

    return NextResponse.json({ received: true, ignored: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro no processamento do webhook.";
    console.error("[SocialPack Webhook] Erro:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

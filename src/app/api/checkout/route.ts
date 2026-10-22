import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/auth-token";
import { getSessionEmail } from "@/lib/session";
import { PLANS, updateSubscription } from "@/lib/subscription-store";
import type { PlanId } from "@/lib/types";

export async function POST(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const planId = body?.planId as PlanId;
    const autoActivate = Boolean(body?.autoActivate); // Para testes e ativação imediata

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { error: "Plano inválido selecionado para checkout. Escolha o plano Starter ou Pro." },
        { status: 400 },
      );
    }

    const orderId = `ord_${randomUUID().slice(0, 12)}`;

    // Se autoActivate for solicitado (ex: teste ou fluxo demo com gateway simulado):
    if (autoActivate) {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);

      const updated = await updateSubscription(email, {
        status: "active",
        planId: plan.id,
        generationQuota: plan.quota,
        usedGenerations: 0,
        packsCreatedCount: 0,
        currentPeriodEnd: nextMonth.toISOString(),
      });

      const response = NextResponse.json({
        ok: true,
        orderId,
        status: "active",
        subscription: updated,
        message: `Plano ${plan.name} ativado com sucesso!`,
      });

      // Emite cookie de sessão atualizado com a assinatura ativa
      const newSessionToken = await createSessionToken(email.toLowerCase(), {
        planId: plan.id,
        status: "active",
        quota: plan.quota,
      });

      response.cookies.set(SESSION_COOKIE, newSessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });

      return response;
    }

    // Estrutura para checkout de gateways (Asaas, AbacatePay, Stripe Checkout)
    const checkoutUrl = `/dashboard?checkout_success=${orderId}&plan=${plan.id}`;

    return NextResponse.json({
      ok: true,
      orderId,
      checkoutUrl,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        period: plan.period,
        quota: plan.quota,
      },
      customer: {
        email,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao processar checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

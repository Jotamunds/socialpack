"use client";

import { useEffect, useState } from "react";
import { CheckIcon, SparklesIcon, SpinnerIcon } from "@/components/icons";
import type { SubscriptionPlan, UserSubscription } from "@/lib/types";

type Props = {
  currentEmail: string;
  initialSubscription?: UserSubscription | null;
  onSubscriptionUpdated?: (sub: UserSubscription) => void;
};

export function BillingSection({ currentEmail, initialSubscription, onSubscriptionUpdated }: Props) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(() => initialSubscription || null);
  const [loading, setLoading] = useState(!initialSubscription);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (initialSubscription) {
      setSubscription(initialSubscription);
      setLoading(false);
    }
  }, [initialSubscription]);

  const fetchSubscription = async () => {
    if (!subscription) setLoading(true);
    try {
      const res = await fetch("/api/subscription", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
        if (data.subscription) {
          setSubscription(data.subscription);
          onSubscriptionUpdated?.(data.subscription);
        }
      }
    } catch {
      // ignora
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleCheckout = async (plan: SubscriptionPlan) => {
    setProcessingPlanId(plan.id);
    setFeedback(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          autoActivate: true, // Ativação instantânea para demonstração e testes
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar assinatura.");
      }

      setFeedback({
        type: "success",
        message: `Parabéns! O plano ${plan.name} foi ativado com sucesso para sua conta.`,
      });

      if (data.subscription) {
        setSubscription(data.subscription);
        onSubscriptionUpdated?.(data.subscription);
      } else {
        await fetchSubscription();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao processar checkout.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setProcessingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="apple-card p-12 bg-white flex flex-col items-center justify-center space-y-3 text-center">
        <SpinnerIcon className="size-6 text-[#0071e3]" />
        <p className="text-xs text-[#6e6e73]">Carregando informações da sua assinatura...</p>
      </div>
    );
  }

  const isActive = subscription?.status === "active";
  const currentPlanId = isActive ? (subscription?.planId || "starter") : null;
  const used = Math.max(subscription?.usedGenerations ?? 0, subscription?.packsCreatedCount ?? 0);
  const quota = isActive ? (subscription?.generationQuota || 0) : 0;
  const remaining = isActive ? (quota >= 999 ? 999 : Math.max(0, quota - used)) : 0;
  const percentage = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header com Status Atual Apple Style */}
      <div className="apple-card p-5 sm:p-8 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                Planos & Cota Comercial
              </h2>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {isActive ? "Assinatura Ativa" : "Sem Assinatura Ativa"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#6e6e73] mt-1">
              Gere posts com consistência editorial e impulsione a presença digital dos seus clientes.
            </p>
          </div>

          {/* Medidor de Cota Apple */}
          <div className="w-full sm:w-64 bg-[#f5f5f7] p-3.5 rounded-2xl border border-[#e5e5ea] space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[#6e6e73]">Cota Mensal</span>
              <span className="text-[#1d1d1f]">
                {!isActive
                  ? "Requer Assinatura"
                  : quota >= 999
                  ? "Ilimitada"
                  : `${used} / ${quota} packs`}
              </span>
            </div>
            <div className="w-full h-2 bg-[#e8e8ed] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  !isActive ? "bg-amber-400" : percentage > 85 ? "bg-amber-500" : "bg-[#0071e3]"
                }`}
                style={{ width: `${!isActive ? 100 : quota >= 999 ? 15 : percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-[#86868b] text-right">
              {!isActive
                ? "Escolha Starter ou Pro para desbloquear"
                : quota >= 999
                ? "Gerações ilimitadas ativadas"
                : `${remaining} pack${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs border ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {/* Grade de Cards Comparativos de Planos (Exclusivamente Starter e Pro) */}
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-5 sm:gap-6 items-stretch">
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          const isPopular = plan.isPopular;

          return (
            <div
              key={plan.id}
              className={`apple-card p-5 sm:p-7 flex flex-col justify-between relative transition-all duration-200 ${
                isPopular
                  ? "bg-white border-2 border-[#0071e3] shadow-md ring-4 ring-[#0071e3]/5"
                  : "bg-white border border-[#d2d2d7]"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0071e3] text-white text-[11px] font-semibold tracking-wide uppercase px-3.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                  Mais Popular
                </div>
              )}

              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-[#1d1d1f]">{plan.name}</h3>
                  <p className="text-xs text-[#6e6e73] mt-1 min-h-[32px]">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1 border-b border-[#f0f0f2] pb-4 sm:pb-5">
                  <span className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs text-[#86868b]">{plan.period}</span>
                </div>

                {/* Lista de Recursos com Checkmark Apple */}
                <ul className="space-y-2.5 text-xs text-[#424245]">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 leading-snug">
                      <div className="mt-0.5 size-4 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
                        <CheckIcon className="size-2.5" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botão de Ação Apple Style */}
              <div className="pt-5 sm:pt-6 mt-5 sm:mt-6 border-t border-[#f0f0f2]">
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 px-4 rounded-full text-xs font-medium bg-[#f5f5f7] border border-[#d2d2d7] text-[#86868b] cursor-default min-h-[44px]"
                  >
                    Plano Atual
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCheckout(plan)}
                    disabled={processingPlanId !== null}
                    className={`w-full py-3 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 inline-flex items-center justify-center gap-1.5 min-h-[44px] ${
                      isPopular
                        ? "bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm hover:shadow"
                        : "bg-[#1d1d1f] hover:bg-black text-white"
                    }`}
                  >
                    {processingPlanId === plan.id ? (
                      <>
                        <SpinnerIcon className="size-3.5" /> Ativando...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="size-3.5" />
                        {`Assinar ${plan.name}`}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Garantia e Segurança B2B */}
      <div className="apple-card p-6 bg-[#ffffff] border border-[#d2d2d7] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h4 className="text-sm font-semibold text-[#1d1d1f]">Garantia de Satisfação</h4>
          <p className="text-xs text-[#6e6e73] mt-0.5">
            Cancele a qualquer momento com 1 clique. Sem fidelidade, taxas ocultas ou burocracia.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#6e6e73]">
          <span>💳 PIX Instantâneo</span>
          <span>·</span>
          <span>🔒 Criptografia SSL 256-bit</span>
        </div>
      </div>
    </div>
  );
}

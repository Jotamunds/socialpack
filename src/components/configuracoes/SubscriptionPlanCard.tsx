"use client";

import { useState, useTransition } from "react";
import {
  CreditCardIcon,
  CheckIcon,
  SparklesIcon,
  SpinnerIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { upgradeToProAction, cancelSubscriptionAction } from "@/app/actions/settings";

interface SubscriptionPlanCardProps {
  subscription: {
    plan: string;
    status: string;
    company_quota: number;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
  };
  companyCount: number;
}

export function SubscriptionPlanCard({
  subscription: initialSub,
  companyCount,
}: SubscriptionPlanCardProps) {
  const [subscription, setSubscription] = useState(initialSub);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPro = subscription.plan === "pro";
  const maxQuota = subscription.company_quota || (isPro ? 3 : 1);
  const progressPercent = Math.min(100, Math.max(0, Math.round((companyCount / maxQuota) * 100)));
  const isCancelScheduled = Boolean(subscription.cancel_at_period_end);
  const isActiveAccess =
    (subscription.status === "active" || subscription.status === "trialing") ||
    (subscription.status === "canceled" && isCancelScheduled);

  // Formatação segura da data de renovação / fim de acesso
  const renewalDate = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "30 dias";

  const handleConfirmUpgrade = () => {
    startTransition(async () => {
      setFeedback(null);
      const res = await upgradeToProAction();
      if (res.ok) {
        setSubscription((prev) => ({
          ...prev,
          plan: "pro",
          company_quota: 3,
        }));
        setFeedback({
          type: "success",
          message: res.message || "Upgrade para o Plano Pro realizado com sucesso!",
        });
        setIsUpgradeModalOpen(false);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Falha ao processar upgrade.",
        });
      }
    });
  };

  const handleConfirmCancel = () => {
    startTransition(async () => {
      setFeedback(null);
      const res = await cancelSubscriptionAction();
      if (res.ok) {
        setSubscription((prev) => ({
          ...prev,
          cancel_at_period_end: true,
        }));
        setFeedback({
          type: "success",
          message: res.message || "Cancelamento agendado com sucesso.",
        });
        setIsManageModalOpen(false);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Falha ao processar cancelamento.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-lg border text-sm flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckIcon className="size-4 shrink-0" />
            ) : (
              <span className="size-2 rounded-full bg-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Cartão do Plano Atual */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[rgba(255,255,255,0.06)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold tracking-tight text-[#f7f8f8]">
                {isPro ? "Plano Pro" : "Plano Starter"}
              </h2>
              {isCancelScheduled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  Cancela em {renewalDate}
                </span>
              ) : isActiveAccess ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                  <span className="size-1.5 rounded-full bg-[#10b981]" />
                  Plano Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  {subscription.status}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8a8f98]">
              {isPro
                ? "R$ 97,00/mês — Acesso avançado com até 3 empresas simultâneas."
                : "R$ 49,90/mês — Pacote essencial para 1 empresa com automação semanal."}
            </p>
          </div>

          <div className="flex flex-col sm:items-end text-xs text-[#8a8f98]">
            <span className="text-[11px] uppercase tracking-wider text-[#62666d]">
              {isCancelScheduled ? "Acesso até" : "Próxima Renovação"}
            </span>
            <span className="font-medium text-[#d0d6e0]">{renewalDate}</span>
          </div>
        </div>

        {/* Medidor de Cota de Empresas */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#d0d6e0] font-medium">Cota de Empresas Cadastradas</span>
            <span className="text-[#8a8f98]">
              <strong className="text-[#f7f8f8]">{companyCount}</strong> de{" "}
              <strong className="text-[#f7f8f8]">{maxQuota}</strong> empresas cadastradas
            </span>
          </div>

          {/* Barra de Progresso Horizontal */}
          <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <div
              className="h-full bg-[#5e6ad2] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#62666d]">
            <span>{progressPercent}% da cota utilizada</span>
            {companyCount >= maxQuota && (
              <span className="text-amber-400 font-medium">Limite do plano atingido</span>
            )}
          </div>
        </div>

        {/* Ações do Plano */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#8a8f98]">
            <ShieldCheckIcon className="size-4 text-[#5e6ad2]" />
            <span>Faturamento seguro em conformidade com PCI-DSS (dados sensíveis não armazenados)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {isPro && !isCancelScheduled && (
              <span className="text-xs text-[#10b981] font-medium hidden sm:inline-block">
                Plano máximo atingido
              </span>
            )}
            {!isPro && isActiveAccess && !isCancelScheduled && (
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="h-9 px-4 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[13px] font-medium tracking-tight transition-all shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <SparklesIcon className="size-3.5" />
                <span>Fazer Upgrade para Pro</span>
              </button>
            )}
            {isActiveAccess && !isCancelScheduled && (
              <button
                type="button"
                onClick={() => setIsManageModalOpen(true)}
                className="h-9 px-4 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] hover:text-[#f7f8f8] text-[13px] font-medium transition-colors cursor-pointer"
              >
                {isPro ? "Gerenciar Assinatura" : "Cancelar Assinatura"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE UPGRADE (Starter -> Pro) */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#0f1011] p-6 space-y-5 shadow-2xl">
            <div className="space-y-2">
              <div className="size-10 rounded-lg bg-[#5e6ad2]/20 border border-[#5e6ad2]/30 flex items-center justify-center text-[#5e6ad2]">
                <SparklesIcon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#f7f8f8]">
                Fazer Upgrade para Plano Pro
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Ao atualizar para o Plano Pro por <strong>R$ 97,00/mês</strong>, você expande
                imediatamente os recursos da sua conta:
              </p>
            </div>

            <ul className="space-y-2 text-xs text-[#d0d6e0]">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-[#10b981] shrink-0" />
                <span>Até 3 empresas ativas simultaneamente (cota triplicada)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-[#10b981] shrink-0" />
                <span>Renderização semanal instantânea de 7 artes por empresa</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-[#10b981] shrink-0" />
                <span>Prioridade no motor de geração e download em alta resolução</span>
              </li>
            </ul>

            <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] text-[11px] text-[#8a8f98] flex items-center gap-2">
              <CreditCardIcon className="size-4 text-[#5e6ad2] shrink-0" />
              <span>Simulação de faturamento direto na sessão. Sem cartões armazenados.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                disabled={isPending}
                className="h-9 px-4 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmUpgrade}
                disabled={isPending}
                className="h-9 px-4 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-medium tracking-tight transition-all shadow-[0_1px_2px_rgba(0,0,0,0.4)] inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <SpinnerIcon className="size-3.5" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <span>Confirmar Upgrade (Pro)</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CANCELAMENTO AGENDADO */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#0f1011] p-6 space-y-5 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#f7f8f8]">
                Cancelar Assinatura {isPro ? "Pro" : "Starter"}
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Sua assinatura está ativa com ciclo até{" "}
                <strong className="text-[#f7f8f8]">{renewalDate}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-300 space-y-2">
              <p className="font-medium text-red-200">Deseja agendar o cancelamento?</p>
              <p className="text-[11px] text-red-300/80 leading-relaxed">
                O acesso permanece até o fim do ciclo atual. Depois disso, a geração e a cota
                de empresas deixam de estar disponíveis até uma nova ativação.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                disabled={isPending}
                className="h-9 px-4 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] text-xs font-medium transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isPending}
                className="h-9 px-4 rounded-md bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium tracking-tight transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <SpinnerIcon className="size-3.5" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <span>Confirmar Cancelamento</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

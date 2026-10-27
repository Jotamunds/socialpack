"use client";

import { useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { BillingReviewCode } from "@/lib/billing/review-codes";
import { secondaryButtonClass } from "./focus";

export type PaymentReviewProps = {
  reviewCode?: BillingReviewCode | string | null;
  expectedPlanPriceLabel?: string | null;
  onRefresh?: () => Promise<void> | void;
};

function getReviewCopy(code?: BillingReviewCode | string | null): {
  title: string;
  message: string;
} {
  switch (code) {
    case "OVERPAID_REFUNDED":
      return {
        title: "Pagamento em revisão",
        message:
          "Recebemos um pagamento com valor diferente do plano escolhido. O estorno foi solicitado ao Asaas.",
      };
    case "OVERPAID_REFUND_FAILED":
      return {
        title: "Pagamento em revisão",
        message:
          "Recebemos um pagamento com valor diferente do plano escolhido. O estorno foi solicitado ao Asaas. Nosso time fará o estorno manualmente.",
      };
    case "UNDERPAID":
      return {
        title: "Valor divergente",
        message:
          "O valor pago não corresponde ao plano. Refaça o pagamento pelo link oficial.",
      };
    case "UNSUPPORTED_METHOD":
      return {
        title: "Meio de pagamento em análise",
        message:
          "Recebemos por um meio fora do fluxo oficial. Seu dinheiro está seguro — falar com o suporte.",
      };
    default:
      return {
        title: "Pagamento em revisão",
        message:
          "Identificamos uma pendência no processamento do seu pagamento. Seu dinheiro está seguro. Fale com nosso suporte ou refaça o pagamento pelo link oficial.",
      };
  }
}

/**
 * Componente de aviso para pagamentos encaminhados para revisão manual / estorno.
 *
 * Padrão visual alinhado com ProblemCard e AwaitingPayment (cards rounded-xl).
 * Não exibe dados sensíveis, mensagens técnicas nem expõe detalhes internos de erro.
 */
export function PaymentReview({
  reviewCode,
  expectedPlanPriceLabel,
  onRefresh,
}: PaymentReviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { title, message } = getReviewCopy(reviewCode);

  const handleRefresh = () => {
    startTransition(async () => {
      if (onRefresh) {
        await onRefresh();
      }
      router.refresh();
    });
  };

  useEffect(() => {
    // Revalidação periódica a cada 20 segundos
    const timer = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 20000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <section
      aria-labelledby="payment-review-title"
      className="w-full max-w-md mx-auto rounded-xl border border-amber-500/20 bg-amber-500/10 p-6 sm:p-8 space-y-4 text-center"
    >
      <h2
        id="payment-review-title"
        className="text-xl font-semibold tracking-tight text-[#f7f8f8]"
      >
        {title}
      </h2>
      <div role="status" aria-live="polite" className="space-y-3">
        <p className="text-sm text-amber-200 leading-relaxed">
          {message}
        </p>
        {expectedPlanPriceLabel ? (
          <p className="text-xs text-[#d0d6e0]">
            Valor do plano:{" "}
            <span className="font-semibold text-[#f7f8f8]">
              {expectedPlanPriceLabel}
            </span>
          </p>
        ) : null}
      </div>
      <div className="pt-2">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isPending}
          className={`w-full ${secondaryButtonClass}`}
        >
          {isPending ? "Atualizando..." : "Atualizar status"}
        </button>
      </div>
    </section>
  );
}

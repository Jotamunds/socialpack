"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isHttpsPaymentUrl } from "./https-payment-url";
import { primaryButtonClass } from "./focus";

type AwaitingPaymentProps = {
  /** URL lida no servidor. Só vira link se for https absoluto. */
  paymentUrl?: string | null;
};

export function AwaitingPayment({ paymentUrl }: AwaitingPaymentProps) {
  const router = useRouter();
  const href = isHttpsPaymentUrl(paymentUrl) ? paymentUrl : null;

  // Polling automático no cliente: a cada 3 segundos revalida a página no servidor.
  // Assim que o webhook do Asaas confirmar o pagamento no banco, a página recarrega e redireciona para /perfil.
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <section
      aria-labelledby="awaiting-payment-title"
      className="w-full max-w-md mx-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-8 space-y-4 text-center"
    >
      <h2 id="awaiting-payment-title" className="text-xl font-semibold tracking-tight text-[#f7f8f8]">
        Aguardando pagamento
      </h2>
      <div role="status" aria-live="polite" className="space-y-4">
        <p className="text-sm text-[#d0d6e0] leading-relaxed">
          A liberação da conta acontece automaticamente assim que o pagamento for confirmado.
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs text-[#8a8f98] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
          <span className="size-2 rounded-full bg-[#10b981] animate-pulse" />
          <span>Verificando confirmação em tempo real...</span>
        </div>

        {href ? (
          <div>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full ${primaryButtonClass}`}
            >
              Abrir link de pagamento
            </a>
          </div>
        ) : (
          <p className="text-sm text-[#d0d6e0] leading-relaxed">
            O link de pagamento não está disponível agora.
          </p>
        )}

        <div className="pt-2">
          <a
            href="/planos?mudar=1"
            className="text-xs text-[#8a8f98] hover:text-[#d0d6e0] underline transition-colors"
          >
            Deseja escolher outro plano?
          </a>
        </div>
      </div>
    </section>
  );
}

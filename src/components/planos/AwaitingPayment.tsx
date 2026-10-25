import { isHttpsPaymentUrl } from "./https-payment-url";
import { primaryButtonClass } from "./focus";

type AwaitingPaymentProps = {
  /** URL lida no servidor. Só vira link se for https absoluto. */
  paymentUrl?: string | null;
};

export function AwaitingPayment({ paymentUrl }: AwaitingPaymentProps) {
  const href = isHttpsPaymentUrl(paymentUrl) ? paymentUrl : null;

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
          A liberação da conta acontece depois que o pagamento for confirmado.
        </p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full ${primaryButtonClass}`}
          >
            Abrir link de pagamento
          </a>
        ) : (
          <p className="text-sm text-[#d0d6e0] leading-relaxed">
            O link de pagamento não está disponível agora.
          </p>
        )}
      </div>
    </section>
  );
}

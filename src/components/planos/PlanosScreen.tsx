import { Logo } from "@/components/Logo";
import { PLAN_DISPLAY } from "@/lib/plans-display";
import { AwaitingPayment } from "./AwaitingPayment";
import { PaymentDeclined, PaymentError } from "./PaymentProblem";
import { PaymentReview } from "./PaymentReview";
import { PlanChoiceCard } from "./PlanChoiceCard";
import type { PlanosScreenProps } from "./types";

/**
 * Apresentação dos planos e dos estados de pagamento.
 * `status`, `message`, `paymentUrl`, `reviewCode` chegam por props do servidor.
 * O bloqueio de páginas pagas não é feito aqui.
 */
export function PlanosScreen({
  status,
  paymentUrl,
  message,
  reviewCode,
  expectedPlanPriceLabel,
  chooseAction,
  plans = PLAN_DISPLAY,
}: PlanosScreenProps) {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col">
      <header className="border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
          <Logo variant="with-label" href="/" className="h-8 w-auto" />
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:py-16">
        {status === "review" ? (
          <div className="w-full max-w-md mx-auto space-y-6">
            <PaymentReview
              reviewCode={reviewCode}
              expectedPlanPriceLabel={expectedPlanPriceLabel}
            />
            {paymentUrl ? <AwaitingPayment paymentUrl={paymentUrl} /> : null}
          </div>
        ) : status === "pending" ? (
          <AwaitingPayment paymentUrl={paymentUrl} />
        ) : status === "failed" ? (
          <PaymentError message={message} />
        ) : status === "declined" ? (
          <PaymentDeclined message={message} />
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-xl mx-auto space-y-3 mb-10 sm:mb-16">
              <p className="text-xs font-bold uppercase tracking-wider text-[#7170ff]">Planos</p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f7f8f8]">
                Escolha o plano
              </h1>
              <p className="text-sm text-[#d0d6e0]">
                Depois da escolha, o pagamento abre no link da cobrança. A conta é liberada
                quando o pagamento for confirmado.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {plans.map((plan) => (
                <PlanChoiceCard key={plan.id} plan={plan} chooseAction={chooseAction} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

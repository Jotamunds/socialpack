import Link from "next/link";
import { primaryButtonClass } from "./focus";

type PaymentProblemProps = {
  message?: string | null;
  plansHref?: string;
};

const FALLBACK_MESSAGE = "Não foi possível continuar. Tente de novo em instantes.";

export function PaymentError({ message, plansHref = "/planos" }: PaymentProblemProps) {
  return (
    <ProblemCard
      title="Não foi possível continuar"
      titleId="payment-error-title"
      message={message?.trim() || FALLBACK_MESSAGE}
      actionLabel="Tentar de novo"
      plansHref={plansHref}
    />
  );
}

export function PaymentDeclined({ message, plansHref = "/planos" }: PaymentProblemProps) {
  return (
    <ProblemCard
      title="Pagamento recusado"
      titleId="payment-declined-title"
      message={message?.trim() || "O pagamento foi recusado. Você pode trocar de plano e tentar de novo."}
      actionLabel="Trocar de plano"
      plansHref={plansHref}
    />
  );
}

function ProblemCard({
  title,
  titleId,
  message,
  actionLabel,
  plansHref,
}: {
  title: string;
  titleId: string;
  message: string;
  actionLabel: string;
  plansHref: string;
}) {
  return (
    <section
      aria-labelledby={titleId}
      className="w-full max-w-md mx-auto rounded-xl border border-red-500/20 bg-red-500/10 p-6 sm:p-8 space-y-4 text-center"
    >
      <h2 id={titleId} className="text-xl font-semibold tracking-tight text-[#f7f8f8]">
        {title}
      </h2>
      <p className="text-sm text-red-400 leading-relaxed" role="alert" aria-live="assertive">
        {message}
      </p>
      <Link href={plansHref} className={`w-full ${primaryButtonClass}`}>
        {actionLabel}
      </Link>
    </section>
  );
}

import Link from "next/link";
import { primaryButtonClass } from "./focus";

type SubscriptionRequiredNoticeProps = {
  message?: string;
  plansHref?: string;
};

export function SubscriptionRequiredNotice({
  message = "Sua assinatura não está ativa. Escolha um plano para continuar.",
  plansHref = "/planos",
}: SubscriptionRequiredNoticeProps) {
  return (
    <section
      aria-labelledby="subscription-required-title"
      className="w-full max-w-md rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-8 space-y-4 text-center"
    >
      <h2 id="subscription-required-title" className="text-xl font-semibold tracking-tight text-[#f7f8f8]">
        Assinatura necessária
      </h2>
      <p className="text-sm text-[#d0d6e0] leading-relaxed" role="status" aria-live="polite">
        {message}
      </p>
      <Link href={plansHref} className={`w-full sm:w-auto ${primaryButtonClass}`}>
        Ver os planos
      </Link>
    </section>
  );
}

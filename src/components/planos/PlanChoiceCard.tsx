import { CheckIcon } from "@/components/icons";
import type { PlanDisplay } from "@/lib/plans-display";
import type { ChoosePlanAction } from "./types";
import { primaryButtonClass, secondaryButtonClass } from "./focus";

type PlanChoiceCardProps = {
  plan: PlanDisplay;
  /**
   * Action do servidor, quando existir. O input `plan` é só a escolha do usuário.
   * Sem action, o botão fica desabilitado e o formulário não é enviado.
   */
  chooseAction?: ChoosePlanAction;
};

export function PlanChoiceCard({ plan, chooseAction }: PlanChoiceCardProps) {
  const buttonClass = plan.highlighted
    ? `w-full ${primaryButtonClass}`
    : `w-full ${secondaryButtonClass}`;

  const choiceControl = chooseAction ? (
    <form action={chooseAction}>
      {/* Escolha do usuário. O preço cobrado não vem deste campo. */}
      <input type="hidden" name="plan" value={plan.id} />
      <button type="submit" className={buttonClass}>
        {plan.ctaLabel}
      </button>
    </form>
  ) : (
    <div className="space-y-2">
      <button
        type="button"
        className={buttonClass}
        disabled
        aria-describedby={`${plan.id}-choice-note`}
      >
        {plan.ctaLabel}
      </button>
      <p id={`${plan.id}-choice-note`} className="text-xs text-[#8a8f98] text-center">
        A escolha deste plano ainda não está disponível.
      </p>
    </div>
  );

  return (
    <article
      className={
        plan.highlighted
          ? "relative rounded-xl border-2 border-[#5e6ad2] bg-[#0d0e12] p-6 sm:p-7 flex flex-col justify-between shadow-[0_10px_30px_rgba(94,106,210,0.15)]"
          : "rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-7 flex flex-col justify-between"
      }
    >
      {plan.highlighted && plan.badge ? (
        <div className="absolute -top-3 right-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
            <span className="size-1.5 rounded-full bg-[#10b981]" aria-hidden="true" />
            {plan.badge}
          </span>
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#f7f8f8]">{plan.name}</h2>
            <p className="text-xs text-[#8a8f98] mt-1">{plan.summary}</p>
          </div>
          {!plan.highlighted && plan.badge ? (
            <span className="shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)]">
              {plan.badge}
            </span>
          ) : null}
        </div>

        <p className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-bold text-[#f7f8f8]">{plan.priceLabel}</span>
          <span className="text-xs text-[#8a8f98]">{plan.periodLabel}</span>
        </p>

        <ul className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.06)] text-xs text-[#d0d6e0]">
          {plan.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5">
              <CheckIcon className="size-4 text-[#10b981] shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-8">{choiceControl}</div>
    </article>
  );
}

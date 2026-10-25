import Link from "next/link";

interface SubscriptionInactiveStateProps {
  message?: string;
}

export function SubscriptionInactiveState({
  message = "Sua assinatura está inativa ou expirada.",
}: SubscriptionInactiveStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-8 space-y-4 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-[#f7f8f8]">
          Assinatura necessária
        </h2>
        <p className="text-sm text-[#8a8f98] leading-relaxed">{message}</p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 pt-2">
          <Link
            href="/configuracoes?tab=plano"
            className="h-9 px-4 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[13px] font-medium inline-flex items-center justify-center transition-colors"
          >
            Ver plano e assinatura
          </Link>
          <Link
            href="/cadastro"
            className="h-9 px-4 rounded-md border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] hover:text-[#f7f8f8] text-[13px] font-medium inline-flex items-center justify-center transition-colors"
          >
            Ativar conta
          </Link>
        </div>
      </div>
    </div>
  );
}

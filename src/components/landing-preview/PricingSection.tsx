import Link from "next/link";
import { CheckIcon, ArrowRightIcon } from "@/components/icons";

export function PricingSection() {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      badge: "Ideal para 1 negócio",
      price: "49,90",
      description: "Tudo o que você precisa para manter o feed da sua empresa ativo e profissional.",
      features: [
        "1 Empresa cadastrada",
        "7 artes por semana (1080×1080px)",
        "Legendas com hashtags estratégicas",
        "Download imediato em ZIP",
        "Mais de 36 nichos de mercado",
        "Sem fidelidade, cancele quando quiser",
      ],
      cta: "Assinar Starter",
      highlighted: false,
    },
    {
      id: "pro",
      name: "Pro",
      badge: "Mais popular",
      price: "97,00",
      description: "Para agências, gestores de tráfego ou empreendedores com múltiplos negócios.",
      features: [
        "Até 3 Empresas cadastradas",
        "7 artes semanais por empresa",
        "Legendas exclusivas por nicho",
        "Download em ZIP ilimitado",
        "Mais de 36 nichos de mercado",
        "Suporte prioritário via WhatsApp",
        "Sem fidelidade, cancele quando quiser",
      ],
      cta: "Assinar Pro",
      highlighted: true,
    },
  ];

  return (
    <section id="planos" className="py-24 sm:py-32 border-t border-white/[0.06] relative">
      {/* Luz ambiente de destaque no plano Pro */}
      <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#38bdf8]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#38bdf8]">
            Planos Transparentes
          </span>
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white">
            Invista menos que um café por dia
          </h2>
          <p className="text-sm sm:text-base text-white/60">
            Tenha um designer e copywriter trabalhando pelo seu Instagram todo santo dia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 ${
                p.highlighted
                  ? "bg-gradient-to-b from-[#111624] to-[#0c0e15] border-2 border-[#38bdf8]/50 shadow-[0_20px_50px_rgba(14,165,233,0.2)]"
                  : "bg-[#0e1017]/70 border border-white/[0.09] shadow-[0_16px_36px_rgba(0,0,0,0.5)]"
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                  {p.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{p.name}</h3>
                  {!p.highlighted && (
                    <span className="text-[11px] font-medium text-white/50 px-2.5 py-1 rounded-md bg-white/[0.04]">
                      {p.badge}
                    </span>
                  )}
                </div>

                <p className="text-sm text-white/60 mb-6 leading-relaxed">
                  {p.description}
                </p>

                <div className="flex items-baseline gap-1.5 mb-8 pb-6 border-b border-white/[0.08]">
                  <span className="text-sm text-white/50 font-medium">R$</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    {p.price}
                  </span>
                  <span className="text-xs text-white/50">/mês</span>
                </div>

                <div className="space-y-3.5 mb-8">
                  {p.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-3 text-sm text-white/80">
                      <div className="size-4 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center shrink-0">
                        <CheckIcon className="size-2.5" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Link
                  href={`/cadastro?plano=${p.id}`}
                  className={`w-full h-12 rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 active:scale-[0.98] ${
                    p.highlighted
                      ? "bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] text-white hover:brightness-110 shadow-[0_4px_20px_rgba(14,165,233,0.4)]"
                      : "bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.15] text-white"
                  }`}
                >
                  <span>{p.cta}</span>
                  <ArrowRightIcon className="size-4" />
                </Link>
                <div className="mt-3 text-center">
                  <span className="text-[11px] text-white/40">
                    Cobrança segura via Asaas • Cancele a qualquer momento
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LandingHero } from "@/components/landing/LandingHero";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { getDemoShowcase, type DemoShowcaseItem } from "@/lib/demo-showcase";

export default async function HomePage() {
  const exemplos = await getDemoShowcase();

  return (
    <div className="min-h-svh overflow-x-clip bg-[#08090a] text-[#f7f8f8] flex flex-col selection:bg-[#5e6ad2]/30 selection:text-white">
      <main className="flex-1">
        <LandingHero />

        {/* Seção Como Funciona */}
        <section id="funcionalidades" className="py-20 border-t border-[rgba(255,255,255,0.06)] bg-[#08090a]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7170ff]">
                Fluxo Simples & Eficiente
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f7f8f8]">
                Como o SocialPack gera seus posts
              </h2>
              <p className="text-sm text-[#8a8f98]">
                Três etapas sem enrolação para ter um calendário visual pronto para
                o mês inteiro.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 space-y-3 hover:border-[rgba(255,255,255,0.14)] transition-colors">
                <div className="size-9 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#7170ff] font-semibold text-sm">
                  1
                </div>
                <h3 className="text-base font-semibold text-[#f7f8f8]">
                  Identidade do seu Negócio
                </h3>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  Defina o nome da empresa, o nicho de mercado (entre mais de 36
                  opções), a cidade de atuação e as cores principais da marca.
                </p>
              </div>

              <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 space-y-3 hover:border-[rgba(255,255,255,0.14)] transition-colors">
                <div className="size-9 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#7170ff] font-semibold text-sm">
                  2
                </div>
                <h3 className="text-base font-semibold text-[#f7f8f8]">
                  Geração Determinística
                </h3>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  Nosso motor combina templates curados por designers, fotos de
                  alta definição e textos persuasivos adaptados para o seu segmento.
                </p>
              </div>

              <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 space-y-3 hover:border-[rgba(255,255,255,0.14)] transition-colors">
                <div className="size-9 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#7170ff] font-semibold text-sm">
                  3
                </div>
                <h3 className="text-base font-semibold text-[#f7f8f8]">
                  Download Instantâneo
                </h3>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  Baixe as 7 artes diretamente em PNG 1080×1080 ou baixe o pacote
                  completo em arquivo ZIP com todas as legendas prontas para copiar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {exemplos.length > 0 ? <ExemplosSection items={exemplos} /> : null}

        {/* Seção de Preços e Planos (#planos) */}
        <section id="planos" className="py-24 border-t border-[rgba(255,255,255,0.06)] bg-[#0a0b0d]">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7170ff]">
                Investimento Previsível
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f7f8f8]">
                Escolha o plano ideal para você
              </h2>
              <p className="text-sm text-[#8a8f98]">
                Sem contratos longos, pegadinhas ou cobranças ocultas. Cancele
                quando quiser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Card Plano Starter */}
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-7 flex flex-col justify-between hover:border-[rgba(255,255,255,0.14)] transition-colors">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#f7f8f8]">Plano Starter</h3>
                      <p className="text-xs text-[#8a8f98]">Ideal para 1 negócio próprio</p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-[#d0d6e0] border border-[rgba(255,255,255,0.08)]">
                      Essencial
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-[#f7f8f8]">R$ 49,90</span>
                    <span className="text-xs text-[#8a8f98]">/mês</span>
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.06)] text-xs text-[#d0d6e0]">
                    <li className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 text-[#10b981]" />
                      <span><strong>1 Empresa</strong> cadastrada</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 text-[#10b981]" />
                      <span>7 posts semanais em 1080×1080px</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 text-[#10b981]" />
                      <span>Templates exclusivos do seu nicho</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 text-[#10b981]" />
                      <span>Legendas com hashtags estratégicas</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 text-[#10b981]" />
                      <span>Exportação rápida em PNG</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href="/cadastro?plano=starter"
                    className="w-full min-h-11 sm:h-10 rounded-md bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-[#f7f8f8] text-[13px] font-medium transition-colors inline-flex items-center justify-center"
                  >
                    Assinar Starter
                  </Link>
                </div>
              </div>

              {/* Card Plano Pro (Destaque) */}
              <div className="relative rounded-xl border-2 border-[#5e6ad2] bg-[#0d0e12] p-7 flex flex-col justify-between shadow-[0_10px_30px_rgba(94,106,210,0.15)]">
                {/* Badge Mais Escolhido */}
                <div className="absolute -top-3 right-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 shadow-sm">
                    <span className="size-1.5 rounded-full bg-[#10b981]" />
                    Mais Escolhido
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#f7f8f8]">Plano Pro</h3>
                      <p className="text-xs text-[#8a8f98]">Para agências, freelancers ou filiais</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-[#f7f8f8]">R$ 97,00</span>
                    <span className="text-xs text-[#8a8f98]">/mês</span>
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.08)] text-xs text-[#d0d6e0]">
                    <li className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 text-[#10b981]" />
                      <span><strong>Até 3 Empresas</strong> cadastradas simultâneas</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 text-[#10b981]" />
                      <span>7 posts semanais para cada empresa</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 text-[#10b981]" />
                      <span>Acesso a todos os 36+ nichos do catálogo</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 text-[#10b981]" />
                      <span>Alternância rápida de perfis ativos</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 text-[#10b981]" />
                      <span>Download de pacotes completos em ZIP</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 text-[#10b981]" />
                      <span>Suporte prioritário direto via WhatsApp</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href="/cadastro?plano=pro"
                    className="w-full min-h-11 sm:h-10 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[13px] font-medium transition-all shadow-[0_1px_3px_rgba(0,0,0,0.5)] active:scale-[0.98] inline-flex items-center justify-center gap-2"
                  >
                    <span>Assinar Plano Pro</span>
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#08090a] py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8a8f98]">
          <div className="flex items-center gap-3">
            <Logo variant="with-label" className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity" href="/" />
            <span>© {new Date().getFullYear()} SocialPack. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#planos" className="hover:text-[#f7f8f8] transition-colors">
              Planos
            </a>
            <Link href="/login" className="hover:text-[#f7f8f8] transition-colors">
              Login
            </Link>
            <Link href="/cadastro" className="hover:text-[#f7f8f8] transition-colors">
              Criar Conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ExemplosSection({ items }: { items: DemoShowcaseItem[] }) {
  return (
    <section id="exemplos" className="py-20 border-t border-[rgba(255,255,255,0.06)] bg-[#08090a]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7170ff]">
            Artes reais
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f7f8f8]">
            O que a conta de demonstração já gerou
          </h2>
          <p className="text-sm text-[#8a8f98]">
            Até quatro posts concluídos, em 1080×1080.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] overflow-hidden"
            >
              <div className="aspect-square bg-[#08090a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.headline}
                  width={1080}
                  height={1080}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="p-3 text-xs font-semibold text-[#f7f8f8] line-clamp-2 leading-snug">
                {item.headline}
              </h3>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/login"
            className="h-10 px-5 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[13px] font-medium transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.5)] active:scale-[0.98] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#828fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
          >
            Entrar na demo
          </Link>
        </div>
      </div>
    </section>
  );
}

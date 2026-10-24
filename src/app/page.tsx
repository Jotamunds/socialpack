import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ArrowRightIcon, CheckIcon, SparklesIcon } from "@/components/icons";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col selection:bg-[#5e6ad2]/30 selection:text-white">
      {/* Header Fixo Minimalista */}
      <header className="sticky top-0 z-50 w-full border-b border-[rgba(255,255,255,0.06)] bg-[#08090a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo variant="with-label" className="h-8 w-auto" href="/" />
          <nav className="flex items-center gap-6">
            <a
              href="#planos"
              className="hidden sm:inline-block text-[13px] font-medium text-[#d0d6e0] hover:text-[#f7f8f8] transition-colors"
            >
              Planos
            </a>
            <Link
              href="/login"
              className="text-[13px] font-medium text-[#d0d6e0] hover:text-[#f7f8f8] transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro?plano=starter"
              className="h-9 px-4 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[13px] font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98] inline-flex items-center justify-center gap-1.5"
            >
              <span>Começar</span>
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section Fullscreen */}
      <main className="flex-1">
        <section className="relative pt-20 pb-28 md:pt-28 md:pb-36 overflow-hidden">
          {/* Efeito sutil de iluminação de fundo (Luminance Stacking Linear) */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#5e6ad2]/8 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Lado Esquerdo: Headline e CTAs */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  <span>Motor Determinístico de Conteúdo Local</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.08] text-[#f7f8f8]">
                  Sua semana de posts no Instagram em{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f7f8f8] via-[#d0d6e0] to-[#7170ff]">
                    1 clique.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-[#8a8f98] max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed tracking-[-0.011em]">
                  Cadastre o nicho e as cores da sua empresa. Receba 7 artes
                  editoriais de 1080×1080 com design cirúrgico, legendas
                  estratégicas e zero dependência de IA imprevisível.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                  <a
                    href="#planos"
                    className="w-full sm:w-auto h-11 px-6 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[14px] font-medium transition-all shadow-[0_1px_3px_rgba(0,0,0,0.5)] active:scale-[0.98] inline-flex items-center justify-center gap-2"
                  >
                    <span>Conhecer os Planos</span>
                    <ArrowRightIcon className="size-4" />
                  </a>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto h-11 px-5 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] hover:text-[#f7f8f8] text-[14px] font-medium transition-colors inline-flex items-center justify-center"
                  >
                    Já tenho uma conta
                  </Link>
                </div>

                {/* Métricas / Trust indicators */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[rgba(255,255,255,0.06)] max-w-md mx-auto lg:mx-0">
                  <div>
                    <div className="text-xl font-semibold text-[#f7f8f8]">36+</div>
                    <div className="text-[12px] text-[#8a8f98]">Nichos do Catálogo</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-[#f7f8f8]">7/7</div>
                    <div className="text-[12px] text-[#8a8f98]">Dias de Posts Prontos</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-[#f7f8f8]">1080px</div>
                    <div className="text-[12px] text-[#8a8f98]">Resolução Cristalina</div>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Mosaico Editorial com Prévia de Artes */}
              <div className="lg:col-span-5 relative flex items-center justify-center">
                <div className="relative w-full max-w-[380px] aspect-square">
                  {/* Card Fundo 1 (Inclinado à esquerda) */}
                  <div className="absolute inset-0 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0f1011] p-5 shadow-2xl rotate-[-4deg] opacity-60 scale-95 translate-y-3 pointer-events-none transition-transform">
                    <div className="h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] text-[#8a8f98]">
                        <span>SEXTA • OFERTA</span>
                        <span>@pizzaria.premium</span>
                      </div>
                      <div className="my-auto space-y-2">
                        <div className="text-lg font-semibold text-[#f7f8f8] leading-tight">
                          A melhor pizza artesanal da cidade
                        </div>
                        <div className="text-xs text-[#8a8f98]">
                          Fermentação lenta de 48h com ingredientes nobres.
                        </div>
                      </div>
                      <div className="h-6 w-20 rounded bg-[#5e6ad2]/20 border border-[#5e6ad2]/40" />
                    </div>
                  </div>

                  {/* Card Fundo 2 (Inclinado à direita) */}
                  <div className="absolute inset-0 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0f1011] p-5 shadow-2xl rotate-[5deg] opacity-75 scale-98 translate-y-1 pointer-events-none transition-transform">
                    <div className="h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] text-[#8a8f98]">
                        <span>QUARTA • AUTORIDADE</span>
                        <span>@estetica.glow</span>
                      </div>
                      <div className="my-auto space-y-2">
                        <div className="text-lg font-semibold text-[#f7f8f8] leading-tight">
                          Cuidados que realçam a sua beleza real
                        </div>
                        <div className="text-xs text-[#8a8f98]">
                          Protocolos personalizados com tecnologia de ponta.
                        </div>
                      </div>
                      <div className="h-6 w-24 rounded bg-[#10b981]/15 border border-[#10b981]/30" />
                    </div>
                  </div>

                  {/* Card Principal Frontal */}
                  <div className="relative rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#121315] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.06)]">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[#10b981]" />
                        <span className="text-[11px] font-medium uppercase tracking-wider text-[#d0d6e0]">
                          Segunda • 24/10
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8a8f98]">
                        Layout Editorial 01
                      </span>
                    </div>

                    <div className="py-8 space-y-3">
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#5e6ad2]/20 text-[#7170ff] border border-[#5e6ad2]/30">
                        CONVITE ESPECIAL
                      </span>
                      <h3 className="text-2xl font-bold tracking-tight text-[#f7f8f8] leading-snug">
                        Sua semana mais produtiva começa hoje
                      </h3>
                      <p className="text-xs text-[#8a8f98] leading-relaxed">
                        Tudo planejado para você não se preocupar com postagens
                        diárias. Qualidade, consistência e estratégia comercial.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                      <span className="text-xs font-medium text-[#d0d6e0]">
                        @suaempresa
                      </span>
                      <span className="h-8 px-3.5 rounded-md bg-[#5e6ad2] text-white text-[12px] font-medium inline-flex items-center gap-1.5">
                        <SparklesIcon className="size-3.5" />
                        <span>Gerado em 1s</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Como Funciona */}
        <section className="py-20 border-t border-[rgba(255,255,255,0.06)] bg-[#08090a]">
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
                    className="w-full h-10 rounded-md bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-[#f7f8f8] text-[13px] font-medium transition-colors inline-flex items-center justify-center"
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
                    className="w-full h-10 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[13px] font-medium transition-all shadow-[0_1px_3px_rgba(0,0,0,0.5)] active:scale-[0.98] inline-flex items-center justify-center gap-2"
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

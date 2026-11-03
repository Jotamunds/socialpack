import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LandingHero } from "@/components/landing/LandingHero";
import { getDemoShowcase, type DemoShowcaseItem } from "@/lib/demo-showcase";

export default async function HomePage() {
  const exemplos = await getDemoShowcase();

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col selection:bg-[#5e6ad2]/30 selection:text-white">
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
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#08090a] py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8a8f98]">
          <div className="flex items-center gap-3">
            <Logo variant="with-label" className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity" href="/" />
            <span>© {new Date().getFullYear()} SocialPack. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-6">
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

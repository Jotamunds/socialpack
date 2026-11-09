import { LandingHeader } from "@/components/landing-preview/LandingHeader";
import { HeroContent } from "@/components/landing-preview/HeroContent";
import { HeroIsometricShowcase } from "@/components/landing-preview/HeroIsometricShowcase";
import { FeaturesSection } from "@/components/landing-preview/FeaturesSection";
import { PricingSection } from "@/components/landing-preview/PricingSection";
import { FaqSection } from "@/components/landing-preview/FaqSection";
import { LandingFooter } from "@/components/landing-preview/LandingFooter";

export const metadata = {
  title: "SocialPack — Crie o conteúdo de um mês em segundos",
  description:
    "Crie o conteúdo gráfico para o seu mês de conteúdo em um clique no SocialPack. 7 artes editoriais e legendas estratégicas.",
};

export default function LandingPreviewPage() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col selection:bg-[#38bdf8]/30 selection:text-white overflow-x-hidden">
      {/* Barra de Navegação */}
      <LandingHeader />

      {/* Hero Section Principal (Fiel à Referência Visual) */}
      <main className="flex-1">
        <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
          {/* Efeitos de Luz Ambiente e Profundidade */}
          <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-[#1e293b]/30 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute top-1/2 right-10 w-[600px] h-[600px] bg-gradient-to-tr from-[#0284c7]/15 via-[#38bdf8]/10 to-[#818cf8]/15 blur-[140px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[580px]">
              
              {/* Lado Esquerdo: Headline Elegante, Subheadline e Botão Glassmorphic */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                <HeroContent />
              </div>

              {/* Lado Direito: Mosaico Isométrico 3D com Badges Neon */}
              <div className="lg:col-span-7 flex justify-center items-center">
                <HeroIsometricShowcase />
              </div>

            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <FeaturesSection />

        {/* Planos & Preços com Checkout Integrado */}
        <PricingSection />

        {/* Dúvidas Frequentes */}
        <FaqSection />
      </main>

      {/* Rodapé */}
      <LandingFooter />
    </div>
  );
}

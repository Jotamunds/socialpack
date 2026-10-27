import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

export function HeroContent() {
  return (
    <div className="flex flex-col justify-center space-y-7 text-left max-w-xl z-20">
      {/* Brand Badge / Micro Tag */}
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.4)] border border-white/20">
          <span className="text-white font-black text-sm tracking-tighter">S</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-white/90">SocialPack</span>
      </div>

      {/* Main Headline (Playfair / Serif Elegante) */}
      <h1 className="font-serif-display text-5xl sm:text-6xl lg:text-[70px] font-normal tracking-[-0.03em] leading-[1.04] text-white">
        Crie o conteúdo
        <br />
        de um mês em
        <br />
        segundos
      </h1>

      {/* Subtitle / Paragraph */}
      <p className="text-base sm:text-lg text-white/60 font-normal leading-relaxed max-w-md tracking-[-0.01em]">
        Crie o conteúdo gráfico para o seu mês de conteúdo em um clique no SocialPack.
      </p>

      {/* Glassmorphic Action Button */}
      <div className="pt-2">
        <Link
          href="/cadastro?plano=starter"
          className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] active:scale-[0.98] border border-white/[0.18] backdrop-blur-md text-white font-medium text-sm sm:text-base transition-all duration-200 shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] hover:border-white/[0.28] hover:shadow-[0_8px_32px_rgba(59,130,246,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)]"
        >
          <span>Comece a criar</span>
          <ArrowRightIcon className="size-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Subtle Scroll Down Indicator */}
      <div className="pt-6 sm:pt-10">
        <a
          href="#planos"
          className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/80 transition-colors tracking-wide"
        >
          <span className="text-sm">↓</span>
          <span>Scroll down para planos de subscrições</span>
        </a>
      </div>
    </div>
  );
}

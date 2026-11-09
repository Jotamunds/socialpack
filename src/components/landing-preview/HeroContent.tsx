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

import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#08090a]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/landing-preview" className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] flex items-center justify-center shadow-[0_0_16px_rgba(14,165,233,0.35)] border border-white/20">
            <span className="text-white font-black text-xs tracking-tighter">S</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white/95">SocialPack</span>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-5 sm:gap-6">
          <a
            href="#como-funciona"
            className="hidden sm:inline-block text-xs font-medium text-white/60 hover:text-white transition-colors"
          >
            Como Funciona
          </a>
          <a
            href="#planos"
            className="hidden sm:inline-block text-xs font-medium text-white/60 hover:text-white transition-colors"
          >
            Planos
          </a>
          <a
            href="#faq"
            className="hidden md:inline-block text-xs font-medium text-white/60 hover:text-white transition-colors"
          >
            Dúvidas
          </a>
          <Link
            href="/login"
            className="text-xs font-medium text-white/70 hover:text-white transition-colors"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}

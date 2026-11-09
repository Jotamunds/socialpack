import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#050608] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <div className="size-6 rounded-md bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center">
            <span className="text-white font-black text-[10px]">S</span>
          </div>
          <span className="text-sm font-semibold text-white/90">SocialPack</span>
          <span className="text-xs text-white/40 ml-2">© {new Date().getFullYear()} Todos os direitos reservados.</span>
        </div>

        <div className="flex items-center gap-6 text-xs text-white/50">
          <Link href="/login" className="hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/planos" className="hover:text-white transition-colors">
            Planos
          </Link>
          <a href="#como-funciona" className="hover:text-white transition-colors">
            Recursos
          </a>
        </div>
      </div>
    </footer>
  );
}

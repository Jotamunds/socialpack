import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { ArrowRightIcon, LogOutIcon, SparklesIcon } from "@/components/icons";
import { signOutAction } from "@/app/actions/companies";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Histórico de Criações | SocialPack",
  description: "Selecione o canal para gerenciar suas postagens salvas e artes geradas.",
};

export default async function HistoricoSelectPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirectTo=/geracao/historico");
  }

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col selection:bg-[#5e6ad2]/30 selection:text-white">
      {/* Header Fixo Minimalista do App */}
      <header className="sticky top-0 z-40 w-full border-b border-[rgba(255,255,255,0.06)] bg-[#08090a]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="transition-opacity hover:opacity-90">
              <Logo />
            </Link>

            <nav className="hidden md:flex items-center gap-5">
              <Link
                href="/perfil"
                className="text-[13px] font-medium text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
              >
                Empresas
              </Link>
              <Link
                href="/geracao/instagram/posts"
                className="text-[13px] font-medium text-[#8a8f98] hover:text-[#d0d6e0] transition-colors inline-flex items-center gap-1.5"
              >
                <SparklesIcon className="size-3.5 text-[#5e6ad2]" />
                <span>Geração</span>
              </Link>
              <Link
                href="/geracao/historico"
                className="text-[13px] font-medium text-[#f7f8f8] border-b-2 border-[#5e6ad2] pb-0.5"
              >
                Histórico
              </Link>
            </nav>
          </div>

          {/* Área do Usuário Autenticado */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-[12px] font-medium text-[#8a8f98] max-w-[180px] truncate">
              {user.email}
            </span>

            <form action={signOutAction}>
              <button
                type="submit"
                title="Sair da Conta"
                className="size-8 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors flex items-center justify-center cursor-pointer"
              >
                <LogOutIcon className="size-3.5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f7f8f8]">
            Histórico de Criações
          </h1>
          <p className="text-xs sm:text-sm text-[#8a8f98]">
            Selecione o formato e aplicativo para visualizar o acervo de artes geradas e gerenciar arquivos
          </p>
        </div>

        {/* Grid de Canais / Aplicativos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Instagram (Ativo) */}
          <Link
            href="/geracao/historico/instagram"
            className="group relative rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[#5e6ad2]/50 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] p-6 space-y-5 transition-all flex flex-col justify-between cursor-pointer"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-xl bg-gradient-to-tr from-[#f58529]/20 via-[#dd2a7b]/20 to-[#8134af]/20 border border-white/10 text-[#f7f8f8] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                  <span className="size-1.5 rounded-full bg-[#10b981]" />
                  Disponível
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-[#f7f8f8] group-hover:text-[#7170ff] transition-colors">
                  Instagram Feed & Stories
                </h3>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  Acesse todo o acervo de artes 1080×1080px geradas, baixe os arquivos em alta resolução e copie as legendas com hashtags.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs font-medium text-[#7170ff] group-hover:text-[#828fff]">
              <span>Ver Histórico</span>
              <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 2: YouTube Shorts & Thumbnails (Inativo / Em breve) */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] p-6 space-y-5 opacity-50 pointer-events-none select-none flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-xl bg-red-500/10 border border-white/10 text-red-400 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,0.04)] text-[#8a8f98] border border-[rgba(255,255,255,0.08)]">
                  Em breve
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-[#8a8f98]">
                  YouTube Shorts & Thumbnails
                </h3>
                <p className="text-xs text-[#62666d] leading-relaxed">
                  Modelos verticais 9:16 e capas otimizadas para alta taxa de cliques no YouTube.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(255,255,255,0.04)] text-xs text-[#62666d]">
              Indisponível no momento
            </div>
          </div>

          {/* Card 3: TikTok Ads & Vídeos (Inativo / Em breve) */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] p-6 space-y-5 opacity-50 pointer-events-none select-none flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-xl bg-cyan-500/10 border border-white/10 text-cyan-400 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,0.04)] text-[#8a8f98] border border-[rgba(255,255,255,0.08)]">
                  Em breve
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-[#8a8f98]">
                  TikTok Ads & Vídeos
                </h3>
                <p className="text-xs text-[#62666d] leading-relaxed">
                  Criativos verticais com ganchos visuais para tráfego pago e orgânico.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(255,255,255,0.04)] text-xs text-[#62666d]">
              Indisponível no momento
            </div>
          </div>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#08090a] py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#62666d]">
          <p>© {new Date().getFullYear()} SocialPack. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-[#10b981]" />
            <span>Bucket Privado Seguro</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

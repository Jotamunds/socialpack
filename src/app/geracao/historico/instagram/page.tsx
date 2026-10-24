import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LogOutIcon, SparklesIcon } from "@/components/icons";
import { signOutAction } from "@/app/actions/companies";
import { getHistoryPostsAction } from "@/app/actions/history";
import { HistoryInstagramClient } from "@/components/historico/HistoryInstagramClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Histórico Instagram | SocialPack",
  description: "Gerencie, visualize e baixe suas artes geradas para o Instagram.",
};

export default async function HistoricoInstagramPage() {
  const supabase = await createClient();

  // 1. Validar autenticação do usuário
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirectTo=/geracao/historico/instagram");
  }

  // 2. Consultar empresas e posts concluídos em paralelo
  const [companiesResult, historyResult] = await Promise.all([
    supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false }),
    getHistoryPostsAction(),
  ]);

  const rawCompanies = companiesResult.data || [];
  const companies = rawCompanies.map((c) => ({
    id: c.id,
    name: c.name,
    category_id: c.category_id,
    niche_id: c.niche_id,
    city: c.city,
    state: c.state,
    instagram: c.instagram,
    tone_id: c.tone_id,
    colors: c.colors || {
      primary: "#5e6ad2",
      secondary: "#7170ff",
      accent: "#828fff",
    },
  }));

  const initialPosts = historyResult.posts || [];

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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-10 space-y-6">
        {/* Barra Superior com Navegação e Atalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#8a8f98]">
              <Link href="/geracao/historico" className="hover:text-[#f7f8f8] transition-colors">
                Histórico
              </Link>
              <span>/</span>
              <span className="text-[#d0d6e0]">Instagram</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f7f8f8]">
              Histórico de Criações — Instagram
            </h1>
          </div>

          <Link
            href="/geracao/instagram/posts"
            className="h-9 px-4 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-semibold transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4)] active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <SparklesIcon className="size-3.5" />
            <span>Nova Geração</span>
          </Link>
        </div>

        {/* Cliente Interativo de Histórico */}
        <HistoryInstagramClient
          initialPosts={initialPosts}
          companies={companies}
        />
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#08090a] py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#62666d]">
          <p>© {new Date().getFullYear()} SocialPack. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-[#10b981]" />
            <span>Exclusão Coordenada de Arquivos Ativa</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

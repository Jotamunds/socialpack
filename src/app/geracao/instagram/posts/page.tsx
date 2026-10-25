import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePageAccess } from "@/lib/supabase/require-page-access";
import { Logo } from "@/components/Logo";
import { GeracaoClient } from "@/components/geracao/GeracaoClient";
import { SubscriptionInactiveState } from "@/components/SubscriptionInactiveState";
import { LogOutIcon, SparklesIcon } from "@/components/icons";
import { signOutAction } from "@/app/actions/companies";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Geração Semanal Instagram | SocialPack",
  description: "Gere seu calendário editorial semanal com artes 1080x1080px e legendas prontas em 1 clique.",
};

export default async function GeracaoInstagramPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string }>;
}) {
  const access = await requirePageAccess("/geracao/instagram/posts");
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirectTo=/geracao/instagram/posts");
  }

  const { data: rawCompanies } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  const resolvedParams = await searchParams;
  const targetCompanyId = resolvedParams?.empresa;

  const companies = (rawCompanies || []).map((c) => ({
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

  // Se veio ?empresa=id na URL, coloca essa empresa em primeiro lugar
  if (targetCompanyId) {
    const idx = companies.findIndex((c) => c.id === targetCompanyId);
    if (idx > 0) {
      const [fav] = companies.splice(idx, 1);
      companies.unshift(fav);
    }
  }

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col selection:bg-[#5e6ad2]/30 selection:text-white">
      {/* Header Fixo Minimalista do App */}
      <header className="sticky top-0 z-40 w-full border-b border-[rgba(255,255,255,0.06)] bg-[#08090a]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo variant="with-label" href="/perfil" className="h-7 w-auto" />

            <nav className="hidden md:flex items-center gap-5">
              <Link
                href="/perfil"
                className="text-[13px] font-medium text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
              >
                Empresas
              </Link>
              <Link
                href="/geracao/instagram/posts"
                className="text-[13px] font-medium text-[#f7f8f8] border-b-2 border-[#5e6ad2] pb-0.5 inline-flex items-center gap-1.5"
              >
                <SparklesIcon className="size-3.5 text-[#5e6ad2]" />
                <span>Geração</span>
              </Link>
              <Link
                href="/geracao/historico"
                className="text-[13px] font-medium text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
              >
                Histórico
              </Link>
              <Link
                href="/configuracoes"
                className="text-[13px] font-medium text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
              >
                Configurações
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-10">
        {!access.ok ? (
          <SubscriptionInactiveState message={access.error} />
        ) : (
          <GeracaoClient companies={companies} />
        )}
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#08090a] py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#62666d]">
          <p>© {new Date().getFullYear()} SocialPack. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-[#10b981]" />
            <span>Motor Determinístico Ativo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

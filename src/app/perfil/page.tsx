import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePageAccess } from "@/lib/supabase/require-page-access";
import { Logo } from "@/components/Logo";
import { PerfilClient } from "@/components/perfil/PerfilClient";
import { SubscriptionInactiveState } from "@/components/SubscriptionInactiveState";
import { LogOutIcon, SparklesIcon } from "@/components/icons";
import { signOutAction } from "@/app/actions/companies";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Perfis de Empresas | SocialPack",
  description: "Gerencie as empresas, identidades visuais e nichos configurados para sua conta.",
};

export default async function PerfilPage() {
  const access = await requirePageAccess("/perfil");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [companiesResult, subscriptionResult] = access.ok
    ? await Promise.all([
        supabase.from("companies").select("*").order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*").eq("user_id", access.userId).maybeSingle(),
      ])
    : [{ data: [] }, { data: null }];

  const companies = companiesResult.data || [];
  const rawSub = subscriptionResult.data;
  const plan = rawSub?.plan || "starter";
  const quota =
    rawSub?.company_quota ??
    (rawSub as { max_companies?: number } | null)?.max_companies ??
    (plan === "pro" ? 3 : 1);

  const subscription = {
    plan,
    status: rawSub?.status || "incomplete",
    company_quota: quota,
    max_companies: quota,
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col selection:bg-[#5e6ad2]/30 selection:text-white">
      <header className="sticky top-0 z-40 w-full border-b border-[rgba(255,255,255,0.06)] bg-[#08090a]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo variant="with-label" href="/perfil" className="h-7 w-auto" />
            <nav className="hidden md:flex items-center gap-5">
              <Link
                href="/perfil"
                className="text-[13px] font-medium text-[#f7f8f8] border-b-2 border-[#5e6ad2] pb-0.5"
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
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[12px] font-medium text-[#f7f8f8] max-w-[180px] truncate">
                {user?.email}
              </span>
              <span className="text-[10px] text-[#8a8f98] uppercase tracking-wider">
                Plano {plan}
              </span>
            </div>
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
          <PerfilClient companies={companies} subscription={subscription} />
        )}
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#08090a] py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#62666d]">
          <p>© {new Date().getFullYear()} SocialPack. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-[#10b981]" />
            <span>Sistema Operacional</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

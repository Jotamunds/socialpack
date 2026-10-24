import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { ConfiguracoesClient } from "@/components/configuracoes/ConfiguracoesClient";
import {
  LogOutIcon,
  SparklesIcon,
  SettingsIcon,
  SpinnerIcon,
} from "@/components/icons";
import { signOutAction } from "@/app/actions/companies";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Configurações | SocialPack",
  description: "Gerencie seu plano, assinatura, dados cadastrais e preferências de tema no SocialPack.",
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  // 1. Validar autenticação do usuário
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirectTo=/configuracoes");
  }

  // 2. Consultas em paralelo: perfil, assinatura e contagem exata de empresas cadastradas
  const [profileResult, subscriptionResult, companiesCountResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan, status, company_quota, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true }),
  ]);

  const rawProfile = profileResult.data;
  const rawSub = subscriptionResult.data;
  const companyCount = companiesCountResult.count ?? 0;

  // Normalização de dados
  const plan = rawSub?.plan || "starter";
  const quota =
    rawSub?.company_quota ??
    (rawSub as { max_companies?: number } | null)?.max_companies ??
    (plan === "pro" ? 3 : 1);

  const subscription = {
    plan,
    status: rawSub?.status || "active",
    company_quota: quota,
    current_period_end: rawSub?.current_period_end || null,
  };

  const profile = {
    fullName: rawProfile?.full_name || "",
    phone: rawProfile?.phone || "",
    email: rawProfile?.email || user.email || "",
  };

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
                className="text-[13px] font-medium text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
              >
                Histórico
              </Link>
              <Link
                href="/configuracoes"
                className="text-[13px] font-medium text-[#f7f8f8] border-b-2 border-[#5e6ad2] pb-0.5 inline-flex items-center gap-1.5"
              >
                <SettingsIcon className="size-3.5 text-[#5e6ad2]" />
                <span>Configurações</span>
              </Link>
            </nav>
          </div>

          {/* Área do Usuário Autenticado */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[12px] font-medium text-[#f7f8f8] max-w-[180px] truncate">
                {user.email}
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

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-10 space-y-8">
        {/* Header da Página */}
        <div className="space-y-1 pb-6 border-b border-[rgba(255,255,255,0.06)]">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f7f8f8]">
            Configurações
          </h1>
          <p className="text-xs sm:text-sm text-[#8a8f98]">
            Gerencie suas preferências de conta, plano de assinatura e aparência da plataforma.
          </p>
        </div>

        {/* Abas e Conteúdo do Cliente com Suspense */}
        <Suspense
          fallback={
            <div className="py-20 flex flex-col items-center justify-center text-[#8a8f98] gap-3">
              <SpinnerIcon className="size-6 text-[#5e6ad2]" />
              <span className="text-xs">Carregando configurações...</span>
            </div>
          }
        >
          <ConfiguracoesClient
            profile={profile}
            subscription={subscription}
            companyCount={companyCount}
          />
        </Suspense>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#08090a] py-6 mt-12">
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

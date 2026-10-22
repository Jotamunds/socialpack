"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BillingSection } from "@/components/dashboard/BillingSection";
import { HistorySection } from "@/components/dashboard/HistorySection";
import {
  CreditCardIcon,
  ImagesIcon,
  LogOutIcon,
  SparklesIcon,
} from "@/components/icons";
import { Logo } from "@/components/Logo";
import { getMondayOfWeek } from "@/lib/date-utils";
import type { CompanyProfile, GenerateResponse, GeneratedPost, UserSubscription } from "@/lib/types";
import { PostsSection } from "./PostsSection";
import { ProfileForm } from "./ProfileForm";

type Props = {
  initialProfile: CompanyProfile | null;
  initialSubscription?: UserSubscription | null;
  userEmail: string;
};

export function DashboardClient({ initialProfile, initialSubscription, userEmail }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "history" | "billing">("create");
  const [startDate, setStartDate] = useState<string>(() => getMondayOfWeek());
  const [profile, setProfile] = useState<CompanyProfile>(
    () =>
      initialProfile || {
        name: "Bella Cucina",
        categoryId: "alimentacao",
        nicheId: "pizzaria",
        city: "Curitiba, PR",
        instagram: "bellacucina.cwb",
        toneId: "descontraido",
        colors: {
          primary: "#1d1d1f",
          secondary: "#6e6e73",
          accent: "#0071e3",
        },
      },
  );
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    () => initialSubscription || null,
  );
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    if (initialSubscription) {
      setSubscription(initialSubscription);
    }
  }, [initialSubscription]);

  const refreshSubscription = async () => {
    try {
      const res = await fetch("/api/subscription", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.subscription) {
          setSubscription(data.subscription);
        }
      }
    } catch {}
  };

  const handleUpdatePost = async (updatedPost: GeneratedPost) => {
    if (!result) return;
    const newPosts = result.posts.map((p) => (p.id === updatedPost.id ? updatedPost : p));
    setResult({
      ...result,
      posts: newPosts,
    });

    if (result.packId) {
      try {
        await fetch("/api/packs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: result.packId, posts: newPosts }),
        });
      } catch {
        // não bloqueia a UI se a requisição falhar
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const handleGenerate = async (customDate?: string) => {
    if (!subscription || subscription.status !== "active") {
      setActiveTab("billing");
      setGenerateError("Assinatura ativa necessária. Escolha o plano Starter ou Pro para gerar novos packs.");
      return;
    }

    setIsGenerating(true);
    setGenerateError("");
    const targetDate = customDate || startDate;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          startDate: targetDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 || res.status === 403) {
          setActiveTab("billing");
        }
        await refreshSubscription();
        router.refresh();
        throw new Error(data.error || "Erro ao gerar posts.");
      }
      setResult(data);
      // Atualiza o histórico em segundo plano
      setHistoryKey((k) => k + 1);
      // Atualiza imediatamente o estado de cota com a resposta da geração
      if (typeof data.usedGenerations === "number" || typeof data.packsCreatedCount === "number") {
        const nextUsed = Math.max(data.usedGenerations ?? 0, data.packsCreatedCount ?? 0);
        setSubscription((prev) =>
          prev
            ? {
                ...prev,
                usedGenerations: nextUsed,
                packsCreatedCount: nextUsed,
              }
            : prev
        );
      }
      // Revalida a cota no servidor e atualiza o estado local
      await refreshSubscription();
      router.refresh();

      // No mobile, rola suavemente para o resultado das artes geradas
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setTimeout(() => {
          document.getElementById("posts-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar posts.";
      setGenerateError(msg);
      await refreshSubscription();
      router.refresh();
    } finally {
      setIsGenerating(false);
    }
  };

  const isActive = subscription?.status === "active";
  const planId = subscription?.planId || "starter";
  const used = Math.max(subscription?.usedGenerations ?? 0, subscription?.packsCreatedCount ?? 0);
  const quota = isActive ? (subscription?.generationQuota || 0) : 0;
  const isPro = isActive && (planId === "pro" || quota >= 999);
  const remaining = isPro ? 999 : isActive ? Math.max(0, quota - used) : 0;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col">
      {/* Navbar Superior Apple: clean white with subtle border and backdrop blur */}
      <header className="border-b border-[#d2d2d7] bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <Logo />

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Pill de Cota em Tempo Real no Topo */}
            <button
              type="button"
              onClick={() => setActiveTab("billing")}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition ${
                !isActive
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : isPro
                  ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                  : remaining > 0
                  ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
              title="Gerenciar plano e cota"
            >
              <span
                className={`size-2 rounded-full ${
                  !isActive
                    ? "bg-amber-500"
                    : isPro
                    ? "bg-purple-500"
                    : remaining > 0
                    ? "bg-[#0071e3]"
                    : "bg-rose-500"
                }`}
              />
              <span>
                {!isActive
                  ? "Assinatura Inativa · Escolha um Plano"
                  : isPro
                  ? "Plano Pro (Ilimitado)"
                  : `Cota: ${used}/${quota} packs`}
              </span>
            </button>

            <div className="flex items-center gap-2 text-xs text-[#6e6e73]">
              <span className="size-6 rounded-full bg-[#1d1d1f] text-white font-semibold flex items-center justify-center text-[10px] shrink-0 sm:hidden">
                {userEmail.charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline">Conectado como</span>
              <span className="font-semibold text-[#1d1d1f] truncate max-w-[120px] sm:max-w-[200px]">
                {userEmail}
              </span>
            </div>

            <button
              id="btn-logout"
              type="button"
              onClick={handleLogout}
              className="btn-ghost text-xs py-1.5 px-3 min-h-[36px] text-[#6e6e73] hover:text-rose-600 hover:border-rose-300 transition"
              title="Sair da conta"
            >
              <LogOutIcon className="size-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5 sm:space-y-6">
        {/* Apple Segmented Control (Tabs) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-[#e5e5ea]">
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-tight">
              {activeTab === "create"
                ? "Calendário Editorial Semanal"
                : activeTab === "history"
                ? "Galeria de Artes Salvas"
                : "Planos & Assinatura B2B"}
            </h1>
            <p className="text-xs sm:text-sm text-[#6e6e73]">
              {activeTab === "create"
                ? "Gere o calendário semanal completo de 7 posts (Segunda a Domingo) com datas reais para o feed dos seus clientes."
                : activeTab === "history"
                ? "Acesse o histórico completo de packs gerados e salvos no Supabase."
                : "Gerencie sua cota de artes semanais e escolha o plano ideal para a escala do seu comércio."}
            </p>
          </div>

          {/* Segmented Control Pill adaptativo para Mobile */}
          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar flex items-center p-1 rounded-full bg-[#e8e8ed] border border-[#d2d2d7] text-xs font-medium shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-full transition-all whitespace-nowrap min-h-[36px] sm:min-h-0 ${
                activeTab === "create"
                  ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              <SparklesIcon className="size-3.5" />
              Novo Pack
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-full transition-all whitespace-nowrap min-h-[36px] sm:min-h-0 ${
                activeTab === "history"
                  ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              <ImagesIcon className="size-3.5" />
              Histórico
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("billing")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-full transition-all whitespace-nowrap min-h-[36px] sm:min-h-0 ${
                activeTab === "billing"
                  ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              <CreditCardIcon className="size-3.5" />
              Planos & Cota
            </button>
          </div>
        </div>

        {generateError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 animate-fade-up">
            {generateError}
          </div>
        )}

        {/* Card de Cota em Tempo Real */}
        <div className="apple-card p-4 bg-white border border-[#e5e5ea] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`size-2.5 rounded-full ${
                !isActive
                  ? "bg-amber-500"
                  : isPro
                  ? "bg-purple-500"
                  : remaining > 0
                  ? "bg-[#0071e3]"
                  : "bg-rose-500"
              }`}
            />
            <span className="font-semibold text-[#1d1d1f]">
              {!isActive
                ? "Sem Assinatura Ativa"
                : isPro
                ? "Plano Pro Ilimitado"
                : "Plano Starter Comercial"}
            </span>
            <span className="text-[#86868b]">·</span>
            <span className="text-[#6e6e73]">
              {!isActive
                ? "Requer assinatura ativa (Starter ou Pro) para criar calendários editoriais."
                : isPro
                ? `${used} pack${used === 1 ? "" : "s"} gerado${used === 1 ? "" : "s"} · Gerações ilimitadas ativas`
                : remaining > 0
                ? `${remaining} de ${quota} pack${quota === 1 ? "" : "s"} restante${quota === 1 ? "" : "s"} este mês (${used} criado${used === 1 ? "" : "s"})`
                : "Limite de packs atingido. Faça upgrade para o plano Pro para continuar gerando."}
            </span>
          </div>

          {(!isActive || !isPro) && (
            <button
              type="button"
              onClick={() => setActiveTab("billing")}
              className={`font-semibold text-xs transition px-3 py-1 rounded-lg border ${
                !isActive
                  ? "bg-[#0071e3] text-white border-[#0071e3] hover:bg-[#0077ed] shadow-xs"
                  : remaining === 0
                  ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 shadow-xs"
                  : "text-[#0071e3] border-[#0071e3]/30 hover:bg-[#0071e3]/10"
              }`}
            >
              {!isActive
                ? "Escolher Plano (Starter ou Pro) →"
                : remaining === 0
                ? "Fazer Upgrade Agora →"
                : "Ver Planos & Cota →"}
            </button>
          )}
        </div>

        {/* Tab 1: Criação de Novo Pack */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna Esquerda: Formulário de Perfil com scroll vertical interno controlado no Desktop */}
            <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
              <ProfileForm
                initialProfile={profile}
                onProfileSaved={(p) => setProfile(p)}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                startDate={startDate}
                onStartDateChange={setStartDate}
              />
            </div>

            {/* Coluna Direita: Cards Gerados */}
            <div id="posts-section" className="lg:col-span-7 xl:col-span-7 scroll-mt-20">
              <PostsSection
                profile={profile}
                result={result}
                isGenerating={isGenerating}
                onRegenerate={handleGenerate}
                startDate={startDate}
                onStartDateChange={setStartDate}
                onUpdatePost={handleUpdatePost}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Histórico de Packs e Artes Salvas no Supabase */}
        {activeTab === "history" && (
          <HistorySection key={historyKey} currentEmail={userEmail} />
        )}

        {/* Tab 3: Gestão de Planos, Cota e Assinatura */}
        {activeTab === "billing" && (
          <BillingSection
            currentEmail={userEmail}
            initialSubscription={subscription}
            onSubscriptionUpdated={(sub) => {
              setSubscription(sub);
              setActiveTab("create");
            }}
          />
        )}
      </main>

      {/* Footer Minimalista Apple */}
      <footer className="border-t border-[#d2d2d7] bg-white py-6 text-center text-xs text-[#86868b] mt-12">
        <p>SocialPack AI · Design System inspirado no padrão Apple · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}

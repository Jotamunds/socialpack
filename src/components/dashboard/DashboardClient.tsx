"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HistorySection } from "@/components/dashboard/HistorySection";
import {
  ImagesIcon,
  LogOutIcon,
  SparklesIcon,
} from "@/components/icons";
import { Logo } from "@/components/Logo";
import type { CompanyProfile, GenerateResponse } from "@/lib/types";
import { PostsSection } from "./PostsSection";
import { ProfileForm } from "./ProfileForm";

type Props = {
  initialProfile: CompanyProfile | null;
  userEmail: string;
};

export function DashboardClient({ initialProfile, userEmail }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
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
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [historyKey, setHistoryKey] = useState(0);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError("");
    try {
      const res = await fetch("/api/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar posts.");
      }
      setResult(data);
      // Atualiza o histórico em segundo plano
      setHistoryKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar posts.";
      setGenerateError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col">
      {/* Navbar Superior Apple: clean white with subtle border and backdrop blur */}
      <header className="border-b border-[#d2d2d7] bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Logo />

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#6e6e73]">
              <span>Conectado como</span>
              <span className="font-semibold text-[#1d1d1f] truncate max-w-[200px]">
                {userEmail}
              </span>
            </div>

            <button
              id="btn-logout"
              type="button"
              onClick={handleLogout}
              className="btn-ghost text-xs py-1.5 px-3 text-[#6e6e73] hover:text-rose-600 hover:border-rose-300"
              title="Sair da conta"
            >
              <LogOutIcon className="size-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Apple Segmented Control (Tabs) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e5e5ea]">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
              {activeTab === "create" ? "Gerador de Conteúdo" : "Galeria de Artes Salvas"}
            </h1>
            <p className="text-xs sm:text-sm text-[#6e6e73]">
              {activeTab === "create"
                ? "Gere 5 posts semanais personalizados para o Instagram dos seus clientes."
                : "Acesse o histórico completo de packs gerados e salvos no Supabase."}
            </p>
          </div>

          {/* Segmented Control Pill */}
          <div className="inline-flex p-1 rounded-full bg-[#e8e8ed] border border-[#d2d2d7] text-xs font-medium self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all ${
                activeTab === "create"
                  ? "bg-white text-[#1d1d1f] shadow-sm font-semibold"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              <SparklesIcon className="size-3.5" />
              Novo Pack
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all ${
                activeTab === "history"
                  ? "bg-white text-[#1d1d1f] shadow-sm font-semibold"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              <ImagesIcon className="size-3.5" />
              Histórico de Artes
            </button>
          </div>
        </div>

        {generateError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 animate-fade-up">
            {generateError}
          </div>
        )}

        {/* Tab 1: Criação de Novo Pack */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna Esquerda: Formulário de Perfil */}
            <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-20">
              <ProfileForm
                initialProfile={profile}
                onProfileSaved={(p) => setProfile(p)}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>

            {/* Coluna Direita: Cards Gerados */}
            <div className="lg:col-span-7 xl:col-span-7">
              <PostsSection
                profile={profile}
                result={result}
                isGenerating={isGenerating}
                onRegenerate={handleGenerate}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Histórico de Packs e Artes Salvas no Supabase */}
        {activeTab === "history" && (
          <HistorySection key={historyKey} currentEmail={userEmail} />
        )}
      </main>

      {/* Footer Minimalista Apple */}
      <footer className="border-t border-[#d2d2d7] bg-white py-6 text-center text-xs text-[#86868b] mt-12">
        <p>SocialPack AI · Design System inspirado no padrão Apple · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}

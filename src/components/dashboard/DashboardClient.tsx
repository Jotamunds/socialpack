"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon, SparklesIcon } from "@/components/icons";
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
          primary: "#8b5cf6",
          secondary: "#d946ef",
          accent: "#fbbf24",
        },
      },
  );
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar posts.";
      setGenerateError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 text-white relative flex flex-col selection:bg-brand-fuchsia/40">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none fixed inset-0 bg-grid opacity-60"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -top-40 left-1/4 size-[520px] rounded-full bg-brand-violet/20 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-1/3 -right-40 size-[480px] rounded-full bg-brand-fuchsia/15 blur-[150px]"
        aria-hidden="true"
      />

      {/* Navbar Superior */}
      <header className="relative z-20 border-b border-white/8 bg-ink-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Logo />

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[11px] text-white/40 uppercase font-semibold tracking-wider">
                Conectado como
              </span>
              <span className="text-xs text-white/80 font-mono truncate max-w-[200px]">
                {userEmail}
              </span>
            </div>

            <button
              id="btn-logout"
              type="button"
              onClick={handleLogout}
              className="btn-ghost text-xs py-2 px-3 text-white/70 hover:text-rose-300 hover:border-rose-500/30"
              title="Sair da conta"
            >
              <LogOutIcon className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner de Boas-vindas / Hero */}
        <section className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-fuchsia/10 border border-brand-fuchsia/30 text-xs font-semibold text-brand-fuchsia">
              <SparklesIcon className="size-3.5" /> SocialPack AI Studio
            </span>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Crie uma semana inteira de posts em segundos.
            </h1>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed">
              Artes prontas em <strong className="text-white">1080x1080px</strong> com suas cores oficiais, textos persuasivos segmentados por nicho e legendas completas com hashtags.
            </p>
          </div>

          {/* Decorative glowing gradient sphere in corner */}
          <div
            className="pointer-events-none absolute -bottom-20 -right-20 size-72 rounded-full bg-brand-gradient blur-3xl opacity-30"
            aria-hidden="true"
          />
        </section>

        {generateError && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {generateError}
          </div>
        )}

        {/* 2-Columns Layout: Form (Left) + Generated Posts (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Esquerda: Cadastro de Perfil da Empresa */}
          <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-24">
            <ProfileForm
              initialProfile={profile}
              onProfileSaved={(p) => setProfile(p)}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>

          {/* Coluna Direita: Cards 1080x1080 gerados e legendas */}
          <div className="lg:col-span-7 xl:col-span-7">
            <PostsSection
              profile={profile}
              result={result}
              isGenerating={isGenerating}
              onRegenerate={handleGenerate}
            />
          </div>
        </div>
      </main>

      {/* Footer simples */}
      <footer className="relative z-10 border-t border-white/8 py-6 text-center text-xs text-white/40 mt-12">
        <p>
          SocialPack AI — Gerador Full-Stack de Conteúdo &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

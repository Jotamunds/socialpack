"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  LockIcon,
  MailIcon,
  SparklesIcon,
  SpinnerIcon,
} from "@/components/icons";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@socialpack.ai");
  const [password, setPassword] = useState("socialpack123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao efetuar login.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Credenciais inválidas.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("demo@socialpack.ai");
    setPassword("socialpack123");
    setError("");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-ink-950 text-white overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none fixed inset-0 bg-grid opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-1/4 -left-32 size-[500px] rounded-full bg-brand-violet/25 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed bottom-1/4 -right-32 size-[500px] rounded-full bg-brand-fuchsia/20 blur-[150px]"
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md animate-fade-up space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="inline-block">
            <Logo className="scale-110" />
          </div>
          <p className="text-sm text-white/60">
            Gerador inteligente de posts para Instagram em 1 clique
          </p>
        </div>

        {/* Login Glass Card */}
        <div className="glass rounded-3xl p-7 sm:p-9 shadow-2xl relative">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              Entrar na sua conta
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Acesse seu painel para gerar novas artes e legendas semanais.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-fade-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="field-label">
                <MailIcon className="size-3 text-white/50" /> E-mail
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="field-input"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="field-label">
                <LockIcon className="size-3 text-white/50" /> Senha
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field-input"
                autoComplete="current-password"
              />
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                <>
                  <SpinnerIcon /> Autenticando...
                </>
              ) : (
                <>
                  Acessar Painel <ArrowRightIcon className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Pill */}
          <div className="mt-6 pt-5 border-t border-white/8 text-center space-y-2">
            <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">
              Credenciais de Demonstração
            </p>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs font-mono text-white/70 flex items-center justify-between gap-2">
              <span className="truncate">demo@socialpack.ai | socialpack123</span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-brand-fuchsia text-[11px] font-sans font-bold hover:underline shrink-0"
              >
                Preencher
              </button>
            </div>
          </div>
        </div>

        {/* Features badges footer */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/50">
          <span className="inline-flex items-center gap-1">
            <SparklesIcon className="size-3 text-brand-amber" /> 1080x1080px Feed
          </span>
          <span>•</span>
          <span>Textos por Nicho</span>
          <span>•</span>
          <span>Exportação em PNG</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  LockIcon,
  MailIcon,
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
        throw new Error(data.error || "E-mail ou senha incorretos.");
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="w-full max-w-[420px] animate-fade-up space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-block">
            <Logo className="scale-105" />
          </div>
          <p className="text-xs sm:text-sm text-[#6e6e73]">
            Gerador minimalista de posts semanais para marcas e negócios
          </p>
        </div>

        {/* Login Apple Card */}
        <div className="apple-card p-7 sm:p-8 space-y-5 bg-white">
          <header className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1d1d1f]">
              Entrar na sua conta
            </h1>
            <p className="text-xs sm:text-sm text-[#6e6e73]">
              Acesse seu painel para gerenciar clientes, artes e histórico.
            </p>
          </header>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-fade-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="field-label">
                <MailIcon className="size-3 text-[#6e6e73]" /> E-mail
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
                <LockIcon className="size-3 text-[#6e6e73]" /> Senha
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
              className="btn-primary w-full py-2.5 mt-2"
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
          <div className="pt-4 border-t border-[#d2d2d7] text-center space-y-2">
            <p className="text-[11px] text-[#6e6e73] uppercase tracking-wider font-semibold">
              Credenciais de Demonstração
            </p>
            <div className="rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] p-2.5 text-xs text-[#1d1d1f] flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] truncate text-[#6e6e73]">
                demo@socialpack.ai · socialpack123
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[#0071e3] text-xs font-semibold hover:text-[#0066cc] shrink-0 transition"
              >
                Preencher
              </button>
            </div>
          </div>
        </div>

        {/* Features badges footer */}
        <div className="flex items-center justify-center gap-3 text-xs text-[#86868b]">
          <span>Feed 1080x1080</span>
          <span>•</span>
          <span>Textos por Nicho</span>
          <span>•</span>
          <span>Banco Supabase</span>
        </div>
      </div>
    </div>
  );
}

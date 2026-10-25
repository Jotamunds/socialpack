"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignInInputSchema } from "@/lib/schemas";
import { activateChosenPlanAction } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";
import { SpinnerIcon } from "@/components/icons";
import { safeInternalRedirect } from "@/lib/safe-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeInternalRedirect(searchParams.get("redirectTo"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const validation = SignInInputSchema.safeParse({
      email,
      password,
    });

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      setErrorMessage(firstIssue?.message || "Preencha e-mail e senha.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("E-mail ou senha incorretos. Verifique suas credenciais.");
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.session) {
        // Ativa assinatura incomplete com selected_plan do metadata (cadastro sem sessão imediata)
        await activateChosenPlanAction();
        router.refresh();
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao realizar login.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[380px] mx-auto space-y-6">
      {/* Header Central com Logo */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-6">
          <Logo className="h-12 w-12" href="/" variant="icon" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#f7f8f8]">
          Bem-vindo de volta
        </h1>
        <p className="text-xs text-[#8a8f98]">
          Entre para gerenciar seus perfis e posts semanais
        </p>
      </div>

      {/* Cartão do Formulário */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-7 shadow-xl">
        {/* Mensagens de Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[12px] font-medium text-[#d0d6e0]">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-[12px] font-medium text-[#d0d6e0]">
                Senha
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 mt-2 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] disabled:opacity-60 text-white text-[13px] font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <SpinnerIcon className="size-4" />
                <span>Entrando...</span>
              </>
            ) : (
              <span>Entrar na Conta</span>
            )}
          </button>
        </form>
      </div>

      {/* Link para Cadastro */}
      <div className="text-center text-xs text-[#8a8f98]">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="text-[#7170ff] hover:text-[#828fff] font-medium transition-colors"
        >
          Cadastre-se
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col items-center justify-center p-4 selection:bg-[#5e6ad2]/30 selection:text-white">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8 text-[#8a8f98] text-xs">
            <SpinnerIcon className="size-5 mr-2 animate-spin text-[#5e6ad2]" />
            Carregando login...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}

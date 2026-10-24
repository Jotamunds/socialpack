"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignUpInputSchema } from "@/lib/schemas";
import { Logo } from "@/components/Logo";
import { SpinnerIcon } from "@/components/icons";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plano") === "pro" ? "pro" : "starter";

  const [plan, setPlan] = useState<"starter" | "pro">(initialPlan);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validação com Zod
    const validation = SignUpInputSchema.safeParse({
      fullName,
      phone,
      email,
      password,
      plan,
    });

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      setErrorMessage(firstIssue?.message || "Por favor, revise os dados preenchidos.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          data: {
            full_name: validation.data.fullName,
            phone: validation.data.phone,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("unique")) {
          setErrorMessage("Este e-mail já está cadastrado. Tente fazer login.");
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        if (data.session) {
          // Sessão já iniciada
          router.push("/perfil");
        } else {
          // Caso confirmação por e-mail esteja ativada no Supabase
          setSuccessMessage(
            "Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro ou faça login."
          );
          setTimeout(() => {
            router.push("/perfil");
          }, 1500);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao criar conta.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] mx-auto space-y-6">
      {/* Header Central com Logo */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-6">
          <Logo className="h-12 w-12" href="/" variant="icon" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#f7f8f8]">
          Crie sua conta
        </h1>
        <p className="text-xs text-[#8a8f98]">
          Configure seus dados para começar a gerar suas artes semanais
        </p>
      </div>

      {/* Cartão do Formulário */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-7 shadow-xl">
        {/* Seletor Rápido de Plano com Resumo */}
        <div className="mb-6 p-3 rounded-lg bg-[#0f1011] border border-[rgba(255,255,255,0.08)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8a8f98]">Plano Selecionado:</span>
            <span className="font-semibold text-[#f7f8f8]">
              {plan === "pro" ? "Pro (R$ 97,00/mês)" : "Starter (R$ 49,90/mês)"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setPlan("starter")}
              className={`h-7 rounded text-[11px] font-medium transition-colors ${
                plan === "starter"
                  ? "bg-[#5e6ad2] text-white"
                  : "bg-[rgba(255,255,255,0.03)] text-[#8a8f98] hover:text-[#f7f8f8]"
              }`}
            >
              Starter (1 Empresa)
            </button>
            <button
              type="button"
              onClick={() => setPlan("pro")}
              className={`h-7 rounded text-[11px] font-medium transition-colors ${
                plan === "pro"
                  ? "bg-[#5e6ad2] text-white"
                  : "bg-[rgba(255,255,255,0.03)] text-[#8a8f98] hover:text-[#f7f8f8]"
              }`}
            >
              Pro (Até 3 Empresas)
            </button>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-md bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-xs leading-relaxed">
            {successMessage}
          </div>
        )}

        {/* Formulário de Cadastro */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="block text-[12px] font-medium text-[#d0d6e0]">
              Nome Completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="Ex: Ana Clara Santos"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-[12px] font-medium text-[#d0d6e0]">
              WhatsApp / Celular
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[12px] font-medium text-[#d0d6e0]">
              E-mail Comercial
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="contato@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[12px] font-medium text-[#d0d6e0]">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
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
                <span>Criando conta...</span>
              </>
            ) : (
              <span>Finalizar Cadastro</span>
            )}
          </button>
        </form>
      </div>

      {/* Link para Login */}
      <div className="text-center text-xs text-[#8a8f98]">
        Já possui uma conta?{" "}
        <Link
          href="/login"
          className="text-[#7170ff] hover:text-[#828fff] font-medium transition-colors"
        >
          Faça login
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col items-center justify-center p-4 selection:bg-[#5e6ad2]/30 selection:text-white">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8 text-[#8a8f98] text-xs">
            <SpinnerIcon className="size-5 mr-2 animate-spin text-[#5e6ad2]" />
            Carregando formulário...
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </main>
  );
}

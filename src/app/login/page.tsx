"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignInInputSchema } from "@/lib/schemas";
import { Logo } from "@/components/Logo";
import { SpinnerIcon } from "@/components/icons";
import { safeInternalRedirect } from "@/lib/safe-redirect";
import { t, type MessageKey } from "@/i18n";

function signInError(path: PropertyKey | undefined): MessageKey {
  if (path === "email") return "login.invalidEmail";
  if (path === "password") return "login.passwordRequired";
  return "login.checkFields";
}

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
      setErrorMessage(t(signInError(firstIssue?.path[0])));
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
        setErrorMessage(
          error.message.includes("Invalid login credentials")
            ? t("login.invalidCredentials")
            : t("login.unexpected")
        );
        setIsLoading(false);
        return;
      }

      if (data.session) {
        router.refresh();
        router.push(redirectTo);
      }
    } catch {
      setErrorMessage(t("login.unexpected"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[380px] mx-auto space-y-6">
      {/* Header Central com Logo */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-6">
          <Logo className="h-12 w-12" href="/" variant="icon" alt={t("brand.logoIcon")} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#f7f8f8]">
          {t("login.title")}
        </h1>
        <p className="text-xs text-[#8a8f98]">
          {t("login.subtitle")}
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
              {t("login.email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder={t("login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-[12px] font-medium text-[#d0d6e0]">
                {t("login.password")}
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
                <span>{t("login.submitting")}</span>
              </>
            ) : (
              <span>{t("login.submit")}</span>
            )}
          </button>
        </form>
      </div>

      {/* Link para Cadastro */}
      <div className="text-center text-xs text-[#8a8f98]">
        {t("login.noAccount")}{" "}
        <Link
          href="/cadastro"
          className="text-[#7170ff] hover:text-[#828fff] font-medium transition-colors"
        >
          {t("login.createOne")}
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
            {t("login.loading")}
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}

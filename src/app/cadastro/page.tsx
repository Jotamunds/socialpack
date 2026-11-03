"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignUpInputSchema } from "@/lib/schemas";
import { Logo } from "@/components/Logo";
import { SpinnerIcon } from "@/components/icons";
import { t, type MessageKey } from "@/i18n";

function signUpError(path: PropertyKey | undefined): MessageKey {
  if (path === "fullName") return "signup.nameInvalid";
  if (path === "phone") return "signup.phoneInvalid";
  if (path === "email") return "signup.emailInvalid";
  if (path === "password") return "signup.passwordInvalid";
  return "signup.checkFields";
}

function RegisterForm() {
  const router = useRouter();

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
    });

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      setErrorMessage(t(signUpError(firstIssue?.path[0])));
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
        const alreadyUsed =
          error.message.includes("already registered") || error.message.includes("unique");
        setErrorMessage(alreadyUsed ? t("signup.emailTaken") : t("signup.unexpected"));
        setIsLoading(false);
        return;
      }

      if (data.user) {
        if (data.session) {
          router.push("/geracao/instagram/posts");
        } else {
          setSuccessMessage(t("signup.confirmEmail"));
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        }
      }
    } catch {
      setErrorMessage(t("signup.unexpected"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] mx-auto space-y-6">
      {/* Header Central com Logo */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-6">
          <Logo className="h-12 w-12" href="/" variant="icon" alt={t("brand.logoIcon")} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#f7f8f8]">
          {t("signup.title")}
        </h1>
        <p className="text-xs text-[#8a8f98]">
          {t("signup.subtitle")}
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

        {successMessage && (
          <div className="mb-4 p-3 rounded-md bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-xs leading-relaxed">
            {successMessage}
          </div>
        )}

        {/* Formulário de Cadastro */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="block text-[12px] font-medium text-[#d0d6e0]">
              {t("signup.fullName")}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder={t("signup.fullNamePlaceholder")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-[12px] font-medium text-[#d0d6e0]">
              {t("signup.phone")}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder={t("signup.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[12px] font-medium text-[#d0d6e0]">
              {t("signup.email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder={t("signup.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[12px] font-medium text-[#d0d6e0]">
              {t("signup.password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder={t("signup.passwordPlaceholder")}
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
                <span>{t("signup.submitting")}</span>
              </>
            ) : (
              <span>{t("signup.submit")}</span>
            )}
          </button>
        </form>
      </div>

      {/* Link para Login */}
      <div className="text-center text-xs text-[#8a8f98]">
        {t("signup.hasAccount")}{" "}
        <Link
          href="/login"
          className="text-[#7170ff] hover:text-[#828fff] font-medium transition-colors"
        >
          {t("signup.logIn")}
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
            {t("signup.loading")}
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </main>
  );
}

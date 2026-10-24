"use client";

import { useState, useTransition, useId } from "react";
import { LockIcon, SaveIcon, SpinnerIcon, CheckCircleIcon, UserIcon } from "@/components/icons";
import { updateProfileAction } from "@/app/actions/settings";

interface AccountFormProps {
  initialProfile: {
    fullName: string;
    phone: string;
    email: string;
  };
}

function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function AccountForm({ initialProfile }: AccountFormProps) {
  const emailInputId = useId();
  const nameInputId = useId();
  const phoneInputId = useId();

  const [fullName, setFullName] = useState(initialProfile.fullName || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    if (savedSuccess) setSavedSuccess(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    if (savedSuccess) setSavedSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSavedSuccess(false);

    if (fullName.trim().length < 2) {
      setErrorMessage("O nome completo deve conter no mínimo 2 caracteres.");
      return;
    }

    startTransition(async () => {
      const res = await updateProfileAction({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        setErrorMessage(res.error || "Falha ao salvar alterações.");
      }
    });
  };

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-7 space-y-6">
      <div className="space-y-1 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <h2 className="text-xl font-semibold tracking-tight text-[#f7f8f8]">
          Dados Pessoais & Conta
        </h2>
        <p className="text-xs text-[#8a8f98]">
          Gerencie seu nome de exibição e número de WhatsApp para recebimento de comunicações.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Campo E-mail (Protegido / Read-only) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={emailInputId} className="text-xs font-medium text-[#d0d6e0] flex items-center gap-1.5">
              <span>E-mail</span>
              <LockIcon className="size-3 text-[#8a8f98]" />
            </label>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(255,255,255,0.04)] text-[#8a8f98] border border-[rgba(255,255,255,0.06)]">
              Autenticado via Supabase Auth
            </span>
          </div>

          <div className="relative">
            <input
              id={emailInputId}
              type="email"
              value={initialProfile.email}
              disabled
              readOnly
              className="w-full h-9 px-3 rounded-md bg-[#0f1011]/60 border border-[rgba(255,255,255,0.06)] text-[13px] text-[#8a8f98] cursor-not-allowed outline-none select-none"
            />
          </div>
          <p className="text-[11px] text-[#62666d]">
            Email de login principal. Para alteração de endereço de acesso, solicite suporte à segurança.
          </p>
        </div>

        {/* Campo Nome Completo */}
        <div className="space-y-1.5">
          <label htmlFor={nameInputId} className="text-xs font-medium text-[#d0d6e0] flex items-center gap-1.5">
            <UserIcon className="size-3.5 text-[#8a8f98]" />
            <span>Nome Completo</span>
          </label>
          <input
            id={nameInputId}
            type="text"
            value={fullName}
            onChange={handleNameChange}
            placeholder="Seu nome completo"
            required
            minLength={2}
            maxLength={100}
            className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
          />
        </div>

        {/* Campo WhatsApp / Telefone */}
        <div className="space-y-1.5">
          <label htmlFor={phoneInputId} className="text-xs font-medium text-[#d0d6e0]">
            WhatsApp / Telefone de Contato
          </label>
          <input
            id={phoneInputId}
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="(11) 99999-9999"
            className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
          />
          <p className="text-[11px] text-[#62666d]">
            Utilizado para alertas de geração e comunicados operacionais da plataforma.
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="p-3 rounded-md border border-red-500/30 bg-red-500/10 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Barra de Ações & Feedback Tátil */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#10b981] font-medium animate-in fade-in duration-150">
                <CheckCircleIcon className="size-4" />
                <span>Dados atualizados com sucesso</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-9 px-5 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[13px] font-medium tracking-tight transition-all shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <SpinnerIcon className="size-3.5" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <SaveIcon className="size-3.5" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

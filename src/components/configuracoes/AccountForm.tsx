"use client";

import { useState, useTransition, useId } from "react";
import { LockIcon, SaveIcon, SpinnerIcon, CheckCircleIcon, UserIcon } from "@/components/icons";
import { changePasswordAction, updateProfileAction } from "@/app/actions/settings";
import { t } from "@/i18n";

interface AccountFormProps {
  initialProfile: {
    fullName: string;
    phone: string;
    email: string;
  };
}

function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function AccountForm({ initialProfile }: AccountFormProps) {
  const emailInputId = useId();
  const nameInputId = useId();
  const phoneInputId = useId();

  const [fullName, setFullName] = useState(initialProfile.fullName || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();

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
      setErrorMessage(t("settings.nameTooShort"));
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
        setErrorMessage(res.error || t("settings.saveFailed"));
      }
    });
  };

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-7 space-y-6">
      <div className="space-y-1 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <h2 className="text-xl font-semibold tracking-tight text-[#f7f8f8]">
          {t("settings.personalTitle")}
        </h2>
        <p className="text-xs text-[#8a8f98]">
          {t("settings.personalBody")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Campo E-mail (Protegido / Read-only) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={emailInputId} className="text-xs font-medium text-[#d0d6e0] flex items-center gap-1.5">
              <span>{t("settings.email")}</span>
              <LockIcon className="size-3 text-[#8a8f98]" />
            </label>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(255,255,255,0.04)] text-[#8a8f98] border border-[rgba(255,255,255,0.06)]">
              {t("settings.authenticated")}
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
            {t("settings.emailHint")}
          </p>
        </div>

        {/* Campo Nome Completo */}
        <div className="space-y-1.5">
          <label htmlFor={nameInputId} className="text-xs font-medium text-[#d0d6e0] flex items-center gap-1.5">
            <UserIcon className="size-3.5 text-[#8a8f98]" />
            <span>{t("settings.fullName")}</span>
          </label>
          <input
            id={nameInputId}
            type="text"
            value={fullName}
            onChange={handleNameChange}
            placeholder={t("settings.fullNamePlaceholder")}
            required
            minLength={2}
            maxLength={120}
            className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
          />
        </div>

        {/* Campo WhatsApp / Telefone */}
        <div className="space-y-1.5">
          <label htmlFor={phoneInputId} className="text-xs font-medium text-[#d0d6e0]">
            {t("settings.phone")}
          </label>
          <input
            id={phoneInputId}
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder={t("settings.phonePlaceholder")}
            className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors"
          />
          <p className="text-[11px] text-[#62666d]">
            {t("settings.phoneHint")}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-md border border-red-500/30 bg-red-500/10 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#10b981] font-medium animate-in fade-in duration-150">
                <CheckCircleIcon className="size-4" />
                <span>{t("settings.saved")}</span>
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
                <span>{t("settings.saving")}</span>
              </>
            ) : (
              <>
                <SaveIcon className="size-3.5" />
                <span>{t("settings.save")}</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="pt-6 border-t border-[rgba(255,255,255,0.06)] space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[#f7f8f8]">{t("settings.passwordTitle")}</h3>
          <p className="text-xs text-[#8a8f98]">
            {t("settings.passwordBody")}
          </p>
        </div>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setPasswordError(null);
            setPasswordMessage(null);
            startPasswordTransition(async () => {
              const res = await changePasswordAction({ password, confirmPassword });
              if (res.ok) {
                setPassword("");
                setConfirmPassword("");
                setPasswordMessage(res.message || t("settings.passwordUpdated"));
              } else {
                setPasswordError(res.error || t("settings.passwordFailed"));
              }
            });
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor={passwordInputId} className="text-xs font-medium text-[#d0d6e0]">
                {t("settings.newPassword")}
              </label>
              <input
                id={passwordInputId}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] outline-none focus:border-[#5e6ad2]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={confirmPasswordInputId} className="text-xs font-medium text-[#d0d6e0]">
                {t("settings.confirmPassword")}
              </label>
              <input
                id={confirmPasswordInputId}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
                className="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] outline-none focus:border-[#5e6ad2]"
              />
            </div>
          </div>
          {passwordError && (
            <div className="p-3 rounded-md border border-red-500/30 bg-red-500/10 text-xs text-red-400">
              {passwordError}
            </div>
          )}
          {passwordMessage && (
            <div className="text-xs text-[#10b981] font-medium">{passwordMessage}</div>
          )}
          <button
            type="submit"
            disabled={isPasswordPending}
            className="h-9 px-4 rounded-md border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] hover:text-[#f7f8f8] text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isPasswordPending ? (
              <>
                <SpinnerIcon className="size-3.5" />
                {t("settings.updating")}
              </>
            ) : (
              t("settings.updatePassword")
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

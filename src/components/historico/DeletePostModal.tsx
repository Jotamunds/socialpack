"use client";

import { SpinnerIcon } from "@/components/icons";
import { t } from "@/i18n";

interface DeletePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  postTitle?: string;
}

export function DeletePostModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  postTitle,
}: DeletePostModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#0f1011] p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="space-y-2">
          <div className="size-10 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center text-lg">
            ⚠️
          </div>

          <h3 className="text-lg font-semibold tracking-tight text-[#f7f8f8]">
            {t("history.deleteTitle")}
          </h3>

          <p className="text-xs text-[#8a8f98] leading-relaxed">
            {t("history.deleteBody")}
          </p>

          {postTitle && (
            <div className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] text-xs text-[#d0d6e0] font-medium truncate">
              &quot;{postTitle}&quot;
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="h-9 px-4 rounded-md bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-xs font-medium text-[#d0d6e0] transition-colors cursor-pointer disabled:opacity-50"
          >
            {t("history.cancel")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-9 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <SpinnerIcon className="size-3.5 animate-spin" />
                <span>{t("history.deleting")}</span>
              </>
            ) : (
              <span>{t("history.confirmDelete")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

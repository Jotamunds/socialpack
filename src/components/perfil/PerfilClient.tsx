"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyCard, type CompanyItem } from "./CompanyCard";
import { CompanyModal } from "./CompanyModal";
import { deleteCompanyAction } from "@/app/actions/companies";
import { COMPANY_LIMIT } from "@/lib/company-limit";
import { t } from "@/i18n";

interface PerfilClientProps {
  companies: CompanyItem[];
}

export function PerfilClient({ companies }: PerfilClientProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);

  const usedCount = companies.length;
  const isQuotaFull = usedCount >= COMPANY_LIMIT;
  const percentage = Math.min(100, Math.round((usedCount / COMPANY_LIMIT) * 100));
  const quotaLabel = `${t("profile.quotaReached")} (${COMPANY_LIMIT})`;

  function handleAddCompanyClick() {
    if (isQuotaFull) {
      setQuotaMessage(quotaLabel);
      return;
    }
    setQuotaMessage(null);
    setIsCreateOpen(true);
  }

  async function handleDeleteCompany(id: string) {
    if (!confirm(t("profile.confirmDelete"))) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteCompanyAction(id);
      if (res.ok) {
        setQuotaMessage(null);
        router.refresh();
      } else {
        alert(res.message || t("profile.deleteFailed"));
      }
    } catch {
      alert(t("profile.deleteError"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f7f8f8]">
            {t("profile.title")}
          </h1>
          <p className="text-xs sm:text-sm text-[#8a8f98]">
            {t("profile.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] px-3.5 py-2 rounded-lg">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] gap-3">
              <span className="text-[#8a8f98]">{t("profile.countLabel")}:</span>
              <span className="font-semibold text-[#f7f8f8]">
                {usedCount} {t("profile.of")} {COMPANY_LIMIT}
              </span>
            </div>
            <div className="w-32 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isQuotaFull ? "bg-[#10b981]" : "bg-[#5e6ad2]"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {quotaMessage ? (
        <p className="text-xs text-[#d0d6e0]" role="status">
          {quotaMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            onDelete={handleDeleteCompany}
            isDeleting={deletingId === company.id}
          />
        ))}

        <button
          type="button"
          onClick={handleAddCompanyClick}
          className="rounded-xl border-2 border-dashed border-[rgba(255,255,255,0.08)] hover:border-[#5e6ad2] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)] p-6 min-h-[220px] flex flex-col items-center justify-center text-center space-y-2.5 transition-all group cursor-pointer"
        >
          <div className="size-10 rounded-full bg-[#0f1011] border border-[rgba(255,255,255,0.08)] group-hover:border-[#5e6ad2] text-[#8a8f98] group-hover:text-[#7170ff] flex items-center justify-center transition-colors text-lg font-light">
            +
          </div>
          <div>
            <span className="text-[13px] font-medium text-[#f7f8f8] group-hover:text-[#7170ff] transition-colors block">
              {t("profile.add")}
            </span>
            <span className="text-[11px] text-[#8a8f98] mt-0.5 block">
              {isQuotaFull ? quotaLabel : t("profile.addHint")}
            </span>
          </div>
        </button>
      </div>

      <CompanyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => router.refresh()}
        onQuotaExceeded={() => setQuotaMessage(quotaLabel)}
      />
    </div>
  );
}

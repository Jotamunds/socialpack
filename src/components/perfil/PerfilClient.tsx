"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyCard, type CompanyItem } from "./CompanyCard";
import { CompanyModal } from "./CompanyModal";
import { UpsellModal } from "./UpsellModal";
import { deleteCompanyAction } from "@/app/actions/companies";

interface SubscriptionInfo {
  plan?: string;
  company_quota?: number;
  status?: string;
}

interface PerfilClientProps {
  companies: CompanyItem[];
  subscription: SubscriptionInfo | null;
}

export function PerfilClient({ companies, subscription }: PerfilClientProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const plan = subscription?.plan || "starter";
  const maxQuota = subscription?.company_quota || (plan === "pro" ? 3 : 1);
  const usedCount = companies.length;
  const isQuotaFull = usedCount >= maxQuota;
  const percentage = Math.min(100, Math.round((usedCount / maxQuota) * 100));

  function handleAddCompanyClick() {
    if (isQuotaFull) {
      setIsUpsellOpen(true);
    } else {
      setIsCreateOpen(true);
    }
  }

  async function handleDeleteCompany(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteCompanyAction(id);
      if (res.ok) {
        router.refresh();
      } else {
        alert(res.message || "Falha ao excluir empresa.");
      }
    } catch {
      alert("Erro ao excluir empresa.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Topo da Página: Título, Descrição e Indicador de Cota */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f7f8f8]">
            Perfis de Empresas
          </h1>
          <p className="text-xs sm:text-sm text-[#8a8f98]">
            Gerencie as identidades visuais e nichos configurados para gerar posts semanais
          </p>
        </div>

        {/* Indicador de Uso da Cota */}
        <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] px-3.5 py-2 rounded-lg">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] gap-3">
              <span className="text-[#8a8f98]">Cota do Plano {plan.toUpperCase()}:</span>
              <span className="font-semibold text-[#f7f8f8]">
                {usedCount} de {maxQuota} utilizados
              </span>
            </div>

            {/* Barra de Progresso Sutil */}
            <div className="w-32 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isQuotaFull ? "bg-[#10b981]" : "bg-[#5e6ad2]"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {isQuotaFull && (
            <button
              type="button"
              onClick={() => setIsUpsellOpen(true)}
              className="text-[11px] font-medium px-2 py-1 rounded bg-[#5e6ad2]/15 text-[#7170ff] hover:bg-[#5e6ad2]/25 border border-[#5e6ad2]/30 transition-colors cursor-pointer"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Grid de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            onDelete={handleDeleteCompany}
            isDeleting={deletingId === company.id}
          />
        ))}

        {/* Card Tracejado para Nova Empresa */}
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
              Cadastrar nova empresa
            </span>
            <span className="text-[11px] text-[#8a8f98] mt-0.5 block">
              {isQuotaFull
                ? "Limite atingido (faça upgrade para o Plano Pro)"
                : "Defina cores, nicho e cidade"}
            </span>
          </div>
        </button>
      </div>

      {/* Modais */}
      <CompanyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => router.refresh()}
        onQuotaExceeded={() => setIsUpsellOpen(true)}
      />

      <UpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        currentQuota={maxQuota}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuota?: number;
}

export function UpsellModal({ isOpen, onClose, currentQuota = 1 }: UpsellModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl border border-[#5e6ad2]/50 bg-[#0d0e12] p-6 sm:p-7 shadow-[0_20px_50px_rgba(94,106,210,0.2)] space-y-6">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 size-7 rounded-md bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] text-[#8a8f98] hover:text-[#f7f8f8] flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Badge e Título */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
            <span className="size-1.5 rounded-full bg-[#10b981]" />
            Limite de Cota ({currentQuota} empresa)
          </span>

          <h2 className="text-xl font-bold tracking-tight text-[#f7f8f8]">
            Evolua para o Plano Pro
          </h2>

          <p className="text-xs text-[#8a8f98] leading-relaxed">
            Seu plano atual permite gerenciar {currentQuota} empresa. Ao migrar para o{" "}
            <strong className="text-[#f7f8f8]">Plano Pro</strong>, você desbloqueia espaço
            para até 3 empresas simultâneas e potencializa sua operação.
          </p>
        </div>

        {/* Comparativo de Vantagens Pro */}
        <div className="rounded-lg bg-[#08090a] border border-[rgba(255,255,255,0.08)] p-4 space-y-3">
          <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.06)] pb-2.5">
            <span className="text-xs font-semibold text-[#f7f8f8]">Assinatura Pro</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#f7f8f8]">R$ 97,00</span>
              <span className="text-[11px] text-[#8a8f98]">/mês</span>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-[#d0d6e0]">
            <li className="flex items-center gap-2">
              <CheckIcon className="size-3.5 text-[#10b981]" />
              <span>
                <strong>Até 3 empresas</strong> simultâneas
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="size-3.5 text-[#10b981]" />
              <span>7 posts semanais por perfil (até 21 posts/semana)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="size-3.5 text-[#10b981]" />
              <span>Acesso a todos os 36+ nichos do catálogo</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="size-3.5 text-[#10b981]" />
              <span>Suporte prioritário via WhatsApp</span>
            </li>
          </ul>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-2 pt-1">
          <Link
            href="/configuracoes"
            onClick={onClose}
            className="w-full h-10 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[13px] font-medium transition-all shadow-[0_1px_3px_rgba(0,0,0,0.5)] active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Fazer Upgrade para Plano Pro</span>
            <ArrowRightIcon className="size-3.5" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#8a8f98] hover:text-[#d0d6e0] text-xs font-medium transition-colors cursor-pointer"
          >
            Permanecer com {currentQuota} empresa
          </button>
        </div>
      </div>
    </div>
  );
}

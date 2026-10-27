"use client";

import { useState } from "react";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Como as artes são geradas?",
      a: "O SocialPack utiliza templates editoriais determinísticos criados por designers profissionais. Você informa seu nicho e paleta de cores, e o sistema renderiza 7 artes de altíssima definição (1080×1080px) com contraste, hierarquia visual e tipografia calibrada, sem depender de alucinações de inteligência artificial.",
    },
    {
      q: "As artes vêm com legendas para o Instagram?",
      a: "Sim! Cada arte acompanha uma legenda estratégica completa, contendo gancho de atenção, corpo persuasivo, chamada para ação (CTA) e conjunto de hashtags segmentadas para o nicho da sua empresa.",
    },
    {
      q: "Posso cancelar quando quiser?",
      a: "Sim, sem nenhuma pegadinha ou fidelidade. Você pode gerenciar ou cancelar sua assinatura diretamente pelo painel de configurações a qualquer momento.",
    },
    {
      q: "Quais são as formas de pagamento aceitas?",
      a: "Aceitamos Cartão de Crédito e Pix através do nosso gateway oficial Asaas, com segurança bancária criptografada de ponta a ponta.",
    },
    {
      q: "Quantas empresas posso gerenciar?",
      a: "No plano Starter você tem direito a 1 empresa. No plano Pro você pode cadastrar até 3 empresas simultâneas, ideal para quem administra mais de um negócio ou presta serviços.",
    },
  ];

  return (
    <section id="faq" className="py-24 sm:py-32 border-t border-white/[0.06] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#38bdf8]">
            Tire Suas Dúvidas
          </span>
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white">
            Perguntas Frequentes
          </h2>
          <p className="text-sm sm:text-base text-white/60">
            Tudo o que você precisa saber antes de assinar o SocialPack.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl bg-[#0e1017]/70 border border-white/[0.08] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4"
                >
                  <span className="text-base font-semibold text-white">
                    {faq.q}
                  </span>
                  <span
                    className={`size-6 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0 text-white/60 text-sm transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-white/65 leading-relaxed border-t border-white/[0.04] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

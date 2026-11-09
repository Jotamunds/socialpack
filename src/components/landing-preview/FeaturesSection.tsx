export function FeaturesSection() {
  const steps = [
    {
      num: "01",
      title: "Cadastre seu Nicho & Paleta",
      description:
        "Escolha entre mais de 36 nichos profissionais e defina as cores da sua marca para garantir identidade visual consistente.",
      tag: "Configuração Rápida",
    },
    {
      num: "02",
      title: "Geração Cirúrgica em 1 Clique",
      description:
        "Nosso motor gera 7 artes editoriais de 1080×1080px e 7 legendas estratégicas prontas para engajar e converter seu público.",
      tag: "Motor Determinístico",
    },
    {
      num: "03",
      title: "Baixe o Pacote em ZIP",
      description:
        "Faça o download imediato de todas as imagens em alta resolução e copies formatadas, pronto para publicar ou agendar.",
      tag: "Pronto para Publicar",
    },
  ];

  return (
    <section id="como-funciona" className="py-24 sm:py-32 border-t border-white/[0.06] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#38bdf8]">
            Fluxo Semanal Otimizado
          </span>
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white">
            Como o SocialPack transforma sua rotina de conteúdo
          </h2>
          <p className="text-sm sm:text-base text-white/60">
            Chega de passar horas no Canva ou quebrar a cabeça com prompts de IA imprevisíveis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="group relative rounded-2xl bg-[#0e1017]/70 border border-white/[0.08] p-7 hover:border-white/[0.20] transition-all duration-300 shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(56,189,248,0.12)]"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-serif-display text-3xl font-normal text-white/30 group-hover:text-[#38bdf8] transition-colors">
                  {step.num}
                </span>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/70">
                  {step.tag}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2.5">
                {step.title}
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

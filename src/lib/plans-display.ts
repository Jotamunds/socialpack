/**
 * Textos de exibição dos planos, copiados da seção #planos da landing
 * e do resumo do cadastro. Não é o preço cobrado.
 *
 * O valor cobrado, o `status` e o `paymentUrl` devem sair de dados lidos
 * no servidor. O campo oculto `plan` do formulário é só a escolha do usuário.
 * Esta UI não lê preço, plano ou status da URL nem de campos do formulário.
 */

export type PlanChoice = "starter" | "pro";

export type PlanDisplay = {
  id: PlanChoice;
  name: string;
  priceLabel: string;
  periodLabel: string;
  summary: string;
  benefits: string[];
  highlighted: boolean;
  badge?: string;
  ctaLabel: string;
};

export const PLAN_DISPLAY: readonly PlanDisplay[] = [
  {
    id: "starter",
    name: "Plano Starter",
    priceLabel: "R$ 49,90",
    periodLabel: "/mês",
    summary: "Ideal para 1 negócio próprio",
    badge: "Essencial",
    highlighted: false,
    ctaLabel: "Escolher Starter",
    benefits: [
      "1 Empresa cadastrada",
      "7 posts semanais em 1080×1080px",
      "Templates exclusivos do seu nicho",
      "Legendas com hashtags estratégicas",
      "Exportação rápida em PNG",
    ],
  },
  {
    id: "pro",
    name: "Plano Pro",
    priceLabel: "R$ 97,00",
    periodLabel: "/mês",
    summary: "Para agências, freelancers ou filiais",
    badge: "Mais Escolhido",
    highlighted: true,
    ctaLabel: "Escolher Pro",
    benefits: [
      "Até 3 Empresas cadastradas simultâneas",
      "7 posts semanais para cada empresa",
      "Acesso a todos os 36+ nichos do catálogo",
      "Alternância rápida de perfis ativos",
      "Download de pacotes completos em ZIP",
      "Suporte prioritário direto via WhatsApp",
    ],
  },
];

import type { Metadata } from "next";
import { PlanosScreen } from "@/components/planos/PlanosScreen";

export const metadata: Metadata = {
  title: "Planos",
  description: "Escolha o plano Starter ou Pro do SocialPack.",
};

/**
 * Tela de escolha. Não lê preço, plano ou status da URL.
 * Sem `chooseAction`, os botões ficam desabilitados até o servidor ligar a action.
 * Status, mensagem e link de pagamento entram por props quando o servidor tiver esses dados.
 * O bloqueio das páginas pagas continua no servidor.
 */
export default function PlanosPage() {
  return <PlanosScreen status="none" />;
}

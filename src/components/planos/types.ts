import type { PlanDisplay } from "@/lib/plans-display";

/**
 * Contrato de apresentação.
 * `chooseAction` e o campo oculto `plan` registram só a escolha do usuário.
 * Preço cobrado, `status` e `paymentUrl` devem ser lidos no servidor e
 * recebidos por props. O bloqueio das páginas pagas é do servidor, não da UI.
 * Nada aqui lê preço, plano ou status da URL ou de campos do formulário.
 */
export type BillingUiStatus = "pending" | "failed" | "declined" | "none";

export type ChoosePlanAction = (formData: FormData) => void | Promise<void>;

export type PlanosScreenProps = {
  status: BillingUiStatus;
  paymentUrl?: string | null;
  message?: string | null;
  chooseAction?: ChoosePlanAction;
  plans?: readonly PlanDisplay[];
};

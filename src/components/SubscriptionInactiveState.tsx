import { SubscriptionRequiredNotice } from "@/components/planos/SubscriptionRequiredNotice";

interface SubscriptionInactiveStateProps {
  message?: string;
}

export function SubscriptionInactiveState({
  message = "Sua assinatura está inativa ou expirada.",
}: SubscriptionInactiveStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <SubscriptionRequiredNotice message={message} />
    </div>
  );
}

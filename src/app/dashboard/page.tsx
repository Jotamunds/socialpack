import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getProfile } from "@/lib/profile-store";
import { getSessionEmail } from "@/lib/session";
import { getSubscription } from "@/lib/subscription-store";

export const instant = false;

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  await connection();
  const email = await getSessionEmail();
  if (!email) {
    redirect("/login");
  }

  const [profile, subscription] = await Promise.all([
    getProfile(email),
    getSubscription(email),
  ]);

  // Usuários sem assinatura ativa devem ser redirecionados para a tela de escolha de planos
  if (subscription.status !== "active") {
    redirect("/dashboard/billing");
  }

  return (
    <DashboardClient
      initialProfile={profile}
      initialSubscription={subscription}
      userEmail={email}
    />
  );
}

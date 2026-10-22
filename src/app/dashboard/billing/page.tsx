import { redirect } from "next/navigation";
import Link from "next/link";
import { BillingSection } from "@/components/dashboard/BillingSection";
import { Logo } from "@/components/Logo";
import { getSessionEmail } from "@/lib/session";
import { getSubscription } from "@/lib/subscription-store";

export const instant = false;

export const metadata = {
  title: "Planos e Assinatura",
};

export default async function BillingPage() {
  const email = await getSessionEmail();
  if (!email) {
    redirect("/login");
  }

  const subscription = await getSubscription(email);
  const isActive = subscription.status === "active";

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col">
      <header className="border-b border-[#d2d2d7] bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Logo />

          <div className="flex items-center gap-3">
            {isActive ? (
              <Link
                href="/dashboard"
                className="btn-ghost text-xs py-2 px-3.5 text-[#1d1d1f] min-h-[36px] inline-flex items-center"
              >
                ← Voltar ao Dashboard
              </Link>
            ) : (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                Assinatura Obrigatória
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <BillingSection currentEmail={email} initialSubscription={subscription} />
      </main>

      <footer className="border-t border-[#d2d2d7] bg-white py-6 text-center text-xs text-[#86868b] mt-12">
        <p>SocialPack AI · Padrão Apple de Design & Experiência Editorial B2B</p>
      </footer>
    </div>
  );
}

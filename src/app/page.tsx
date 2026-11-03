import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LandingHero } from "@/components/landing/LandingHero";
import { getDemoShowcase, type DemoShowcaseItem } from "@/lib/demo-showcase";
import { t } from "@/i18n";

export default async function HomePage() {
  const exemplos = await getDemoShowcase();

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col selection:bg-[#5e6ad2]/30 selection:text-white">
      <main className="flex-1">
        <LandingHero />

        {/* Seção Como Funciona */}
        <section id="funcionalidades" className="py-20 border-t border-[rgba(255,255,255,0.06)] bg-[#08090a]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7170ff]">
                {t("howItWorks.eyebrow")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f7f8f8]">
                {t("howItWorks.title")}
              </h2>
              <p className="text-sm text-[#8a8f98]">
                {t("howItWorks.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 space-y-3 hover:border-[rgba(255,255,255,0.14)] transition-colors">
                <div className="size-9 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#7170ff] font-semibold text-sm">
                  1
                </div>
                <h3 className="text-base font-semibold text-[#f7f8f8]">
                  {t("howItWorks.step1Title")}
                </h3>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  {t("howItWorks.step1Body")}
                </p>
              </div>

              <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 space-y-3 hover:border-[rgba(255,255,255,0.14)] transition-colors">
                <div className="size-9 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#7170ff] font-semibold text-sm">
                  2
                </div>
                <h3 className="text-base font-semibold text-[#f7f8f8]">
                  {t("howItWorks.step2Title")}
                </h3>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  {t("howItWorks.step2Body")}
                </p>
              </div>

              <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 space-y-3 hover:border-[rgba(255,255,255,0.14)] transition-colors">
                <div className="size-9 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#7170ff] font-semibold text-sm">
                  3
                </div>
                <h3 className="text-base font-semibold text-[#f7f8f8]">
                  {t("howItWorks.step3Title")}
                </h3>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  {t("howItWorks.step3Body")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {exemplos.length > 0 ? <ExemplosSection items={exemplos} /> : null}
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#08090a] py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8a8f98]">
          <div className="flex items-center gap-3">
            <Logo variant="with-label" className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity" href="/" alt={t("brand.logoFull")} />
            <span>© {new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(new Date())} SocialPack. {t("footer.rights")}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[#f7f8f8] transition-colors">
              {t("footer.logIn")}
            </Link>
            <Link href="/cadastro" className="hover:text-[#f7f8f8] transition-colors">
              {t("footer.createAccount")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ExemplosSection({ items }: { items: DemoShowcaseItem[] }) {
  return (
    <section id="exemplos" className="py-20 border-t border-[rgba(255,255,255,0.06)] bg-[#08090a]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7170ff]">
            {t("examples.eyebrow")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f7f8f8]">
            {t("examples.title")}
          </h2>
          <p className="text-sm text-[#8a8f98]">
            {t("examples.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] overflow-hidden"
            >
              <div className="aspect-square bg-[#08090a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.headline}
                  width={1080}
                  height={1080}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="p-3 text-xs font-semibold text-[#f7f8f8] line-clamp-2 leading-snug">
                {item.headline}
              </h3>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/login"
            className="h-10 px-5 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[13px] font-medium transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.5)] active:scale-[0.98] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#828fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
          >
            {t("examples.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}

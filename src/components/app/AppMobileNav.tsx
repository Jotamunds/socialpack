import Link from "next/link";
import { t } from "@/i18n";

const LINKS = [
  { id: "empresas", href: "/perfil", label: "app.navCompanies" },
  { id: "geracao", href: "/geracao/instagram/posts", label: "app.navGenerate" },
  { id: "historico", href: "/geracao/historico", label: "app.navHistory" },
  { id: "configuracoes", href: "/configuracoes", label: "app.navSettings" },
] as const;

export type AppSectionId = (typeof LINKS)[number]["id"];

export function AppMobileNav({ active }: { active: AppSectionId }) {
  return (
    <nav
      aria-label={t("app.navLabel")}
      className="md:hidden flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none]"
    >
      {LINKS.map((link) => {
        const isActive = link.id === active;
        return (
          <Link
            key={link.id}
            href={link.href}
            className={`shrink-0 min-h-11 inline-flex items-center px-3 text-[13px] font-medium ${
              isActive
                ? "text-[#f7f8f8] border-b-2 border-[#5e6ad2]"
                : "text-[#8a8f98]"
            }`}
          >
            {t(link.label)}
          </Link>
        );
      })}
    </nav>
  );
}

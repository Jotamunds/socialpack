import type { Metadata } from "next";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t("meta.loginTitle"),
  description: t("meta.loginDescription"),
  openGraph: {
    title: t("meta.loginTitle"),
    description: t("meta.loginDescription"),
    locale: "en_US",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

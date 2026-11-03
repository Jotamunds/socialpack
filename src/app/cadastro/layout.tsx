import type { Metadata } from "next";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t("meta.signupTitle"),
  description: t("meta.signupDescription"),
  openGraph: {
    title: t("meta.signupTitle"),
    description: t("meta.signupDescription"),
    locale: "en_US",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

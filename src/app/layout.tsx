import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { t } from "@/i18n";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: t("meta.title"),
    template: t("meta.titleTemplate"),
  },
  description: t("meta.description"),
  openGraph: {
    title: t("meta.ogTitle"),
    description: t("meta.ogDescription"),
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/brand/socialpack-logo.svg",
    apple: "/brand/socialpack-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full`}>
      <body className="min-h-full flex flex-col bg-[#08090a] text-[#f7f8f8] antialiased">
        {children}
      </body>
    </html>
  );
}

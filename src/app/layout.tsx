import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SocialPack — Geração Determinística de Posts",
    template: "%s | SocialPack",
  },
  description:
    "Calendário editorial semanal com artes 1080x1080px e legendas persuasivas em 1 clique.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} dark h-full`}>
      <body className="min-h-full flex flex-col bg-[#08090a] text-[#f7f8f8] antialiased">
        {children}
      </body>
    </html>
  );
}

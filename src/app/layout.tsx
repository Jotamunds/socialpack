import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "SocialPack — Geração Semanal de Conteúdo",
    template: "%s | SocialPack",
  },
  description:
    "Calendário editorial semanal com artes 1080x1080px e legendas persuasivas em 1 clique.",
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
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable} dark h-full`}>
      <body className="min-h-full flex flex-col bg-[#08090a] text-[#f7f8f8] antialiased">
        {children}
      </body>
    </html>
  );
}

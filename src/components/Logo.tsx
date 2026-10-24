import React from "react";
import Link from "next/link";
import Image from "next/image";

export type LogoVariant = "with-label" | "icon" | "without-borders" | "only-label";

export interface LogoProps {
  /**
   * - with-label: Logo horizontal completo (socialpack-logo-with-label.svg)
   * - icon: Ícone squircle com moldura (socialpack-logo.svg)
   * - without-borders: Ícone minimalista sem moldura (socialpack-logo-without-borders.svg)
   * - only-label: Apenas o texto (socialpack-only-label.svg)
   */
  variant?: LogoVariant;
  className?: string;
  href?: string | null; // Se null, não envolve em <Link>
  priority?: boolean;
  alt?: string;
}

interface LogoAssetConfig {
  src: string;
  width: number;
  height: number;
  alt: string;
}

const SVG_VARIANTS: Record<LogoVariant, LogoAssetConfig> = {
  "with-label": {
    src: "/brand/socialpack-logo-with-label.svg",
    width: 154,
    height: 36,
    alt: "SocialPack Logo Completa",
  },
  icon: {
    src: "/brand/socialpack-logo.svg",
    width: 40,
    height: 40,
    alt: "SocialPack Ícone",
  },
  "without-borders": {
    src: "/brand/socialpack-logo-without-borders.svg",
    width: 36,
    height: 36,
    alt: "SocialPack Ícone Minimalista",
  },
  "only-label": {
    src: "/brand/socialpack-only-label.svg",
    width: 130,
    height: 32,
    alt: "SocialPack Letreiro",
  },
};

export function Logo({
  variant = "with-label",
  className = "",
  href = "/",
  priority = true,
  alt,
}: LogoProps) {
  const asset = SVG_VARIANTS[variant] || SVG_VARIANTS["with-label"];

  const imageElement = (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={alt || asset.alt}
      priority={priority}
      className={`select-none object-contain ${className}`}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center transition-opacity hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-[#5e6ad2] rounded"
        aria-label="SocialPack Início"
      >
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}

export default Logo;

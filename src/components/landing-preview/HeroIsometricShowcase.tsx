"use client";

import Image from "next/image";

export function HeroIsometricShowcase() {
  return (
    <div className="relative w-full max-w-[650px] lg:max-w-[720px] mx-auto flex items-center justify-center py-6 select-none">
      {/* Luz ambiente azul/indigo atrás do grid */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-gradient-to-tr from-[#3b82f6]/20 via-[#5e6ad2]/25 to-[#a855f7]/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Badges 3D Flutuantes com Glow Neon (idênticos à imagem) */}

      {/* 1. Badge Instagram Flutuante (superior esquerdo do grid) */}
      <div className="absolute -left-2 sm:-left-6 top-8 sm:top-14 z-30 animate-float-slow">
        <div className="relative size-12 sm:size-14 rounded-2xl bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] p-0.5 shadow-[0_0_35px_rgba(221,42,123,0.55),0_12px_24px_rgba(0,0,0,0.4)] border border-white/25 flex items-center justify-center transform -rotate-6 hover:rotate-0 transition-transform">
          <svg
            className="size-6 sm:size-7 text-white drop-shadow-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        </div>
      </div>

      {/* 2. Badge YouTube Flutuante (lado direito médio) */}
      <div className="absolute -right-3 sm:-right-8 top-32 sm:top-40 z-30 animate-float-reverse">
        <div className="relative size-10 sm:size-12 rounded-2xl bg-gradient-to-br from-[#ff0000] to-[#b30000] p-0.5 shadow-[0_0_32px_rgba(255,0,0,0.55),0_10px_20px_rgba(0,0,0,0.4)] border border-white/25 flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform">
          <svg
            className="size-5 sm:size-6 text-white fill-white drop-shadow-sm"
            viewBox="0 0 24 24"
          >
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#fff" />
          </svg>
        </div>
      </div>

      {/* 3. Badge Twitter / X Flutuante (inferior esquerdo) */}
      <div className="absolute left-6 sm:left-10 bottom-12 sm:bottom-16 z-30 animate-float-slow">
        <div className="relative size-10 sm:size-12 rounded-2xl bg-gradient-to-tr from-[#00acee] via-[#1d9bf0] to-[#0284c7] p-0.5 shadow-[0_0_30px_rgba(29,155,240,0.55),0_10px_20px_rgba(0,0,0,0.4)] border border-white/25 flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform">
          <svg
            className="size-5 sm:size-6 text-white fill-white drop-shadow-sm"
            viewBox="0 0 24 24"
          >
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
          </svg>
        </div>
      </div>

      {/* Grid Isométrico 3D (3 Colunas Inclinadas) */}
      <div className="perspective-1200 w-full flex justify-center">
        <div className="isometric-showcase grid grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5 w-[560px] sm:w-[640px] lg:w-[680px]">
          
          {/* ================= COLUNA 1 ================= */}
          <div className="space-y-3.5 sm:space-y-4 pt-4">
            
            {/* Card 1: Instagram Post Fotográfico Completo */}
            <div className="rounded-2xl bg-[#0f1117]/90 border border-white/[0.09] shadow-[0_16px_36px_rgba(0,0,0,0.6)] overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              {/* Header do Post */}
              <div className="px-3 py-2.5 flex items-center justify-between border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-full bg-gradient-to-tr from-amber-400 to-fuchsia-500 p-[1px]">
                    <div className="size-full rounded-full bg-[#08090a]" />
                  </div>
                  <span className="text-[11px] font-medium text-white/90">socialpack</span>
                </div>
                <div className="flex gap-0.5">
                  <span className="size-1 rounded-full bg-white/40" />
                  <span className="size-1 rounded-full bg-white/40" />
                  <span className="size-1 rounded-full bg-white/40" />
                </div>
              </div>

              {/* Imagem do Post */}
              <div className="relative aspect-[4/5] w-full bg-neutral-900">
                <Image
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80"
                  alt="Post SocialPack"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 180px, 220px"
                  priority
                />
              </div>

              {/* Ações (Like, Comentário, Enviar, Salvar) */}
              <div className="px-3 py-2 flex items-center justify-between text-white/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-rose-500 text-xs">♥</span>
                  <span className="text-white/60 text-xs">💬</span>
                  <span className="text-white/60 text-xs">↗</span>
                </div>
                <span className="text-white/60 text-xs">🔖</span>
              </div>
            </div>

            {/* Card 2: Foto Editorial Paisagem Dark */}
            <div className="rounded-2xl bg-[#0f1117]/90 border border-white/[0.09] p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.5)] overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-neutral-900">
                <Image
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
                  alt="Post Paisagem"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 180px, 220px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[10px] tracking-wider uppercase text-white/80 font-medium">Vol. 01 / Refúgio</span>
                </div>
              </div>
            </div>

          </div>

          {/* ================= COLUNA 2 ================= */}
          <div className="space-y-3.5 sm:space-y-4 -mt-4">

            {/* Card 1: Polaroid / Moldura Branca Sobreposta (Mãos & Folhas) */}
            <div className="rounded-2xl bg-[#0f1117]/90 border border-white/[0.09] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.65)] overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              <div className="bg-white p-2 pb-5 rounded-lg shadow-md transform rotate-[-2deg]">
                <div className="relative aspect-square w-full rounded overflow-hidden bg-neutral-900">
                  <Image
                    src="https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80"
                    alt="Arte Editorial Natureza"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 180px, 220px"
                  />
                </div>
                <div className="mt-2 text-center">
                  <span className="text-[9px] font-mono tracking-widest text-neutral-600 uppercase">EDITORIAL VIBE</span>
                </div>
              </div>
            </div>

            {/* Card 2: Post com Tarja Central de Frase (Inspiração & Dica) */}
            <div className="rounded-2xl bg-[#0f1117]/90 border border-white/[0.09] shadow-[0_16px_36px_rgba(0,0,0,0.6)] overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              <div className="relative aspect-square w-full bg-neutral-900">
                <Image
                  src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80"
                  alt="Post com Tarja"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 180px, 220px"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-3">
                  <div className="bg-white/95 px-3 py-1.5 shadow-lg max-w-[85%] text-center">
                    <span className="text-[10px] font-bold text-neutral-900 uppercase tracking-tight">
                      CONSISTÊNCIA É AUTORIDADE
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-3 py-2 flex items-center justify-between border-t border-white/[0.06] text-white/80">
                <div className="flex items-center gap-2">
                  <span className="text-rose-500 text-xs">♥</span>
                  <span className="text-white/60 text-xs">💬</span>
                </div>
                <span className="text-white/60 text-xs">🔖</span>
              </div>
            </div>

            {/* Card 3: Post Formato Vídeo com Play Button */}
            <div className="rounded-2xl bg-[#0f1117]/90 border border-white/[0.09] p-3 shadow-[0_16px_36px_rgba(0,0,0,0.6)] overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              <div className="aspect-[4/5] rounded-xl bg-gradient-to-b from-[#1a1c23] to-[#12141a] border border-white/[0.06] flex flex-col items-center justify-center relative p-4">
                <div className="size-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <svg className="size-5 text-white fill-white ml-0.5" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <span className="mt-3 text-[10px] text-white/60 font-mono">0:45 • REEL</span>
              </div>
            </div>

          </div>

          {/* ================= COLUNA 3 ================= */}
          <div className="space-y-3.5 sm:space-y-4 pt-8">

            {/* Card 1: Post Estilo Vídeo / YouTube Dark */}
            <div className="rounded-2xl bg-[#0f1117]/90 border border-white/[0.09] p-2 shadow-[0_16px_36px_rgba(0,0,0,0.6)] overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-900">
                <Image
                  src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80"
                  alt="Vídeo Forest"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 180px, 220px"
                />
                <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-mono text-white">
                  12:40
                </div>
              </div>
              <div className="p-2 space-y-1">
                <div className="h-2 w-3/4 rounded bg-white/20" />
                <div className="h-2 w-1/2 rounded bg-white/10" />
              </div>
            </div>

            {/* Card 2: Card Tipográfico "NO DRAFT" Estética Urbana/Brutalista */}
            <div className="rounded-2xl bg-[#0f1117]/90 border border-white/[0.09] p-3 shadow-[0_16px_36px_rgba(0,0,0,0.6)] overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              <div className="aspect-square rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 text-neutral-900 p-3 flex flex-col justify-between border border-neutral-400">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">ED. 2026</span>
                  <span className="text-[10px] font-bold">★</span>
                </div>
                <div className="text-center">
                  <div className="text-base font-black tracking-tight leading-none uppercase">
                    NO DRAFT
                  </div>
                  <div className="text-[9px] font-mono text-neutral-700 tracking-wider mt-0.5">
                    POST FINAL PRONTO
                  </div>
                </div>
                <div className="h-1 w-full bg-neutral-900/20 rounded-full" />
              </div>
            </div>

            {/* Card 3: Post Retrato Editorial com Moldura */}
            <div className="rounded-2xl bg-[#0f1117]/90 border border-white/[0.09] shadow-[0_16px_36px_rgba(0,0,0,0.6)] overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              <div className="relative aspect-[4/5] w-full bg-neutral-900">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                  alt="Post Editorial Mulher"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 180px, 220px"
                />
              </div>
              <div className="p-2.5 flex items-center justify-between border-t border-white/[0.06]">
                <div className="flex gap-1.5 items-center">
                  <span className="text-rose-500 text-[10px]">♥</span>
                  <span className="text-[10px] text-white/50 font-mono">1.4k</span>
                </div>
                <span className="text-[10px] text-white/50 font-mono">#social</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

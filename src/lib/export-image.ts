"use client";

import { toPng } from "html-to-image";

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Renderiza o nó (1080x1080) como PNG e dispara o download no navegador. */
export async function downloadNodeAsPng(node: HTMLElement, filename: string) {
  await document.fonts.ready;

  // Aguarda carregamento completo de todas as imagens presentes no nó
  const images = Array.from(node.querySelectorAll("img"));
  if (images.length > 0) {
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }),
    );
  }

  const dataUrl = await toPng(node, {
    width: 1080,
    height: 1080,
    pixelRatio: 1,
    cacheBust: true,
  });
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  link.click();
}

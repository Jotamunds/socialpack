"use client";

import { useEffect } from "react";

/**
 * DevIndicatorLock
 * 
 * Garante que em ambiente de desenvolvimento (dev mode):
 * 1. O botãozinho "N" (Next.js Dev Tools Indicator) permaneça sempre ligado e visível.
 * 2. A opção/botão de "Hide" (ocultar) seja totalmente removida da interface do painel.
 * 3. Qualquer estado de desativação anterior seja resetado imediatamente.
 */
export function DevIndicatorLock() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    // Reseta qualquer estado salvo que tenha desativado o indicador
    fetch("/__nextjs_devtools_config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disableDevIndicator: false, hideShortcut: null }),
    }).catch(() => {});

    const applyLock = (shadow: ShadowRoot) => {
      // 1. Injeta CSS no Shadow DOM do Next DevTools para ocultar opções de Hide
      // e forçar o botão 'N' sempre visível
      let style = shadow.getElementById("nextjs-dev-lock-style") as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement("style");
        style.id = "nextjs-dev-lock-style";
        style.textContent = `
          /* Oculta totalmente o botão e a seção de 'Hide Dev Tools' */
          [data-hide-dev-tools],
          button[data-hide-dev-tools],
          #hide-dev-tools,
          .preference-section:has([data-hide-dev-tools]),
          .preference-section:has(#hide-dev-tools) {
            display: none !important;
            pointer-events: none !important;
          }

          /* Mantém o botão N e o indicador sempre ligados e visíveis */
          #data-devtools-indicator,
          [data-nextjs-dev-tools-button],
          [data-indicator-status] {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        `;
        shadow.appendChild(style);
      }

      // 2. Fallback imperativo para remover a opção de 'Hide' da árvore do DOM
      const hideElements = shadow.querySelectorAll("[data-hide-dev-tools], #hide-dev-tools");
      hideElements.forEach((el) => {
        const section = el.closest(".preference-section") || el.parentElement;
        if (section) {
          (section as HTMLElement).style.setProperty("display", "none", "important");
        }
        (el as HTMLElement).style.setProperty("display", "none", "important");
      });

      // 3. Força a exibição do botão N
      const indicator =
        shadow.getElementById("data-devtools-indicator") ||
        shadow.querySelector("[data-nextjs-dev-tools-button]");
      if (indicator) {
        (indicator as HTMLElement).style.setProperty("display", "flex", "important");
        (indicator as HTMLElement).style.setProperty("visibility", "visible", "important");
        (indicator as HTMLElement).style.setProperty("opacity", "1", "important");
      }
    };

    const attachToPortal = () => {
      const portal = document.querySelector("nextjs-portal");
      if (portal && portal.shadowRoot) {
        applyLock(portal.shadowRoot);

        // Observa alterações dentro do Shadow Root (ex: abertura do painel de preferências)
        const shadowObserver = new MutationObserver(() => {
          if (portal.shadowRoot) {
            applyLock(portal.shadowRoot);
          }
        });

        shadowObserver.observe(portal.shadowRoot, {
          childList: true,
          subtree: true,
        });

        return shadowObserver;
      }
      return null;
    };

    let shadowObserver = attachToPortal();

    // Observa o document.body caso o portal seja injetado tardiamente pelo Next.js
    const bodyObserver = new MutationObserver(() => {
      if (!shadowObserver) {
        shadowObserver = attachToPortal();
      }
    });

    bodyObserver.observe(document.body, { childList: true });

    return () => {
      shadowObserver?.disconnect();
      bodyObserver.disconnect();
    };
  }, []);

  return null;
}

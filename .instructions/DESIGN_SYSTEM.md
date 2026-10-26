# SocialPack — Design System & Style Guide (Linear / Apple Dark)
**Arquivo de Referência Visual para o Antigravity**

## 1. Configuração Tailwind CSS v4 (globals.css)

```css
@import "tailwindcss";

:root {
  --bg-marketing: #08090a;
  --bg-panel: #0f1011;
  --bg-surface: #191a1b;
  --bg-card: rgba(255, 255, 255, 0.02);
  --bg-card-hover: rgba(255, 255, 255, 0.04);
  
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-standard: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(255, 255, 255, 0.14);

  --accent-primary: #5e6ad2;
  --accent-hover: #7170ff;
  --accent-active: #828fff;

  --text-primary: #f7f8f8;
  --text-secondary: #d0d6e0;
  --text-tertiary: #8a8f98;
  --text-quaternary: #62666d;
}

body {
  background-color: var(--bg-marketing);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-feature-settings: "cv01", "ss03";
  letter-spacing: -0.011em;
  -webkit-font-smoothing: antialiased;
}
```

## 2. Padrões de Componentes Prontos

### Botão Primário (Action Linear)
```html
<button class="h-9 px-4 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[13px] font-medium tracking-tight transition-all shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98] disabled:opacity-50">
  Criar Empresa
</button>
```

### Botão Secundário / Ghost
```html
<button class="h-9 px-4 rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] hover:text-[#f7f8f8] text-[13px] font-medium transition-colors">
  Cancelar
</button>
```

### Cartão Base (Card)
```html
<div class="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-5 hover:border-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.03)] transition-all">
  <!-- Conteúdo sem aninhar outros cards dentro -->
</div>
```

### Input de Formulário
```html
<input 
  type="text" 
  class="w-full h-9 px-3 rounded-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] placeholder-[#62666d] outline-none focus:border-[#5e6ad2] transition-colors" 
/>
```

### Badge / Pílula de Status
```html
<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
  <span class="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
  Plano Pro Ativo
</span>
```
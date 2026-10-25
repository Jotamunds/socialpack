# Design do SocialPack

Guia visual para quem for mexer na interface. Descreve o que o código e o site publicado mostram em 25 de outubro de 2026. Não há `DESIGN_SYSTEM.md` nem outro documento de design system no repositório; a base é o código.

Fontes, nesta ordem:

1. Não existe arquivo de design system no repositório.
2. Código em `src/app/globals.css`, `postcss.config.mjs` (Tailwind CSS 4 via `@tailwindcss/postcss`, sem `tailwind.config`), `src/app/layout.tsx`, componentes em `src/components` e `src/app`, logos em `public/brand`, fontes em `public/fonts`, textos em `content/templates` e a geração PNG em `src/lib/rendering/satori-renderer.ts` (`satori` + `@resvg/resvg-js`). O `content/templates/` guarda textos de post, não layout visual.
3. Site publicado `https://socialpack.vercel.app`. A home respondeu HTTP 200 e o HTML/CSS conferem com `src/app/page.tsx`. A página foi vista em 1440×2200 e em 390×1600: fundo quase preto, cabeçalho fixo com logo e botão índigo, hero com “1 clique” em degradê, três cards empilhados e inclinados, seções “como funciona” e planos. `/login` respondeu HTTP 200. Telas autenticadas (`/perfil`, `/geracao`, `/configuracoes`, histórico) não foram abertas: exigem sessão. O CSS publicado usado para confirmar a escala do Tailwind é o da home nesse dia.

O diretório `node_modules/next/dist/docs` não estava instalado neste ambiente. Nada abaixo afirma comportamento do Next.js além do que está em `src/app/layout.tsx` e no CSS que o site publicado entrega.

Há dois visuais distintos. O **chrome** é a aplicação (fundo escuro, Inter, acento índigo). A **arte** é o PNG 1080×1080 gerado no servidor. As cores da empresa entram na arte, não no chrome.

## Visão geral e tom

O chrome é escuro, denso e quieto. O próprio seletor de aparência descreve o tema escuro como “Design Linear/Apple Dark” e o claro como “Fundo limpo off-white”. Na prática o produto abre sempre no escuro.

Características visíveis na home e repetidas no código das telas internas:

- Fundo `#08090a`, texto `#f7f8f8`, acento único `#5e6ad2`.
- Bordas de 1px em branco com pouca opacidade, em vez de sombras pesadas. Sombra forte aparece no hero (cards inclinados) e nos modais.
- Cantos curtos nos botões (`rounded-md`, 6px). Pílula fica para badge, status e alguns chips.
- Tipografia Inter, semibold nos títulos, medium nos controles, tracking levemente negativo.
- Um brilho índigo atrás do hero (`bg-[#5e6ad2]/8`, no CSS publicado `#5e6ad214`, com `blur-[120px]`) e um degradê só na frase “1 clique”.
- Ícones de traço, 2px, `currentColor`, sem biblioteca de ícones no JSX (`lucide-react` está no `package.json` e não é importado em `src`).

O tom de voz da interface é direto, em português, com números (“7 posts”, “1080×1080”, “R$ 49,90”). O texto da home promete calendário editorial e artes de feed. A cópia longa dos posts vive nos JSON de `content/templates/`; o README de lá sugere limites de caracteres (headline ~45, subheadline ~110, CTA ~22) e não define cor nem tipo.

## Paleta

### Tokens do chrome (tema escuro, padrão)

Definidos duas vezes em `src/app/globals.css`: em `@theme` (utilitários Tailwind `bg-marketing`, `text-brand-indigo`, etc.) e em `:root` (variáveis usadas pelo `body`). As telas não usam as classes do `@theme`. Usam hex arbitrário (`bg-[#08090a]`, `text-[#f7f8f8]`). Por isso o CSS publicado da home traz as variáveis de `:root` e não traz `--color-marketing` nem `--color-brand-indigo`.

| Papel | Hex | Onde aparece |
| --- | --- | --- |
| Fundo da página (`--bg-marketing`, `--color-marketing`) | `#08090a` | `body`, home, login, cadastro, shell autenticado |
| Painel (`--bg-panel`, `--color-panel`) | `#0f1011` | Inputs, header de modal, chips, miolo do seletor de tema |
| Superfície (`--bg-surface`, `--color-surface`) | `#191a1b` | Token definido; quase não há `bg-[#191a1b]` nas telas |
| Card | `rgba(255,255,255,0.02)` | Cards, formulários, passos, plano Starter |
| Card hover | `rgba(255,255,255,0.04)` | Hover de card e de botão secundário cheio |
| Borda sutil | `rgba(255,255,255,0.06)` | Divisores, borda inferior do header, separadores internos |
| Borda padrão | `rgba(255,255,255,0.08)` | Card, input, botão fantasma |
| Borda de foco (token) | `rgba(255,255,255,0.14)` | Hover de card na home e no plano Starter. O foco de input **não** usa este token: usa borda `#5e6ad2` |
| Índigo / ação (`--accent-primary`, `--color-brand-indigo`) | `#5e6ad2` | Botão primário, item de nav ativo, anel do logo, barra de cota |
| Índigo claro (`--accent-hover`, `--color-brand-accent`) | `#7170ff` | Hover do botão primário, links de texto, chips de tema, eyebrow |
| Índigo mais claro (`--accent-active`, `--color-brand-hover`) | `#828fff` | Hover desses links (`hover:text-[#828fff]`). Não é a cor de `:active` do botão |
| Texto primário | `#f7f8f8` | Títulos, valores, texto de botão secundário |
| Texto secundário | `#d0d6e0` | Nav da home, corpo de lista, labels de formulário |
| Texto terciário | `#8a8f98` | Apoio, nav inativa do app, placeholders de seção |
| Texto quaternário | `#62666d` | Placeholder de input, rodapé do app, meta desabilitada |

Outros fundos que não estão no token e aparecem no código:

| Hex | Uso |
| --- | --- |
| `#0a0b0d` | Faixa de preços da home (`#planos`) |
| `#0d0e12` | Card do Plano Pro e modal de upgrade |
| `#121315` | Card frontal do mosaico no hero |
| `#141517` → `#0f1011` | Degradê do ícone no SVG da logo |
| `#44464a` | Quadrado médio do ícone da logo |
| `rgba(0,0,0,0.8)` e `rgba(0,0,0,0.85)` | Overlay dos modais (`bg-black/80`, `bg-black/85`) |
| `rgba(0,0,0,0.75)` | Overlay do modal de upgrade |

Seleção de texto, na home e nas telas que repetem a classe: fundo `#5e6ad2` a 30% (`#5e6ad24d` no CSS publicado) e texto branco.

### Acento, estados e cores de feedback

Botão primário: fundo `#5e6ad2`, texto `#ffffff`, hover `#7170ff`. Pressionado: `active:scale-[0.98]`, sem troca de cor. Sombra habitual `0 1px 2px rgba(0,0,0,0.4)`; CTAs maiores usam `0 1px 3px rgba(0,0,0,0.4)` ou `rgba(0,0,0,0.5)`.

Botão secundário: fundo `rgba(255,255,255,0.02)` a `0.04`, borda `rgba(255,255,255,0.08)` ou `0.1`, texto `#d0d6e0` ou `#f7f8f8`, hover clareia o fundo (`0.05`, `0.06`, `0.07` ou `0.08`) e o texto vai para `#f7f8f8`.

Desabilitado: `disabled:opacity-60` no submit de login, cadastro e modal de empresa; `disabled:opacity-50` na geração, conta, exclusão e ZIP. `disabled:cursor-not-allowed` só no botão “Gerar Semana”. E-mail da conta (somente leitura): fundo `#0f1011` a 60%, borda sutil, texto `#8a8f98`, `cursor-not-allowed`.

Sucesso: `#10b981`. Ponto de 6px (`size-1.5`) no hero, no rodapé do app (“Motor Determinístico Ativo”) e em badges. Banner e caixa: fundo `#10b981` a 10%, borda a 20% ou 30%, texto `#10b981`. Ícone de check copiado usa a mesma cor. Essa cor é hex solto, não a classe `emerald-500`.

Erro: classes Tailwind `red-400`, `red-500`, `red-600`, `red-700`. No CSS publicado da home (Tailwind 4) os hex são:

| Classe | Hex publicado |
| --- | --- |
| `red-400` | `#ff6568` |
| `red-500` | `#fb2c36` |
| `red-600` | `#e40014` |
| `red-700` | `#bf000f` |
| `amber-400` | `#fcbb00` |
| `amber-500` | `#f99c00` |
| `emerald-400` | `#00d294` |
| `emerald-500` | `#00bb7f` |
| `slate-300` | `#cad5e2` |
| `slate-400` | `#90a1b9` |
| `slate-700` | `#314158` |

Caixa de erro (login, cadastro, geração, modal de empresa): `bg-red-500/10`, `border-red-500/20`, texto `text-red-400`, `text-xs`, `rounded-md`, padding 12px. Conta e plano às vezes usam borda `red-500/30`. Texto solto de erro no seletor de tema: `text-xs text-red-400`, sem caixa.

Destrutivo: excluir post confirma em modal com botão `bg-red-600` `hover:bg-red-700` texto branco. O cancelamento de assinatura usa `bg-red-600/80` `hover:bg-red-600`. Excluir empresa é um ícone que no hover fica `bg-red-500/10`, borda `red-500/20`, texto `red-400`, e a confirmação é `window.confirm`, não esse modal.

Aviso: badge “Cancela em …” e status que não é ativo usam `bg-amber-500/15`, texto `amber-400`, borda `amber-500/30`. “Limite do plano atingido” é `text-amber-400`. O ícone de sol no tema claro é `text-amber-400`.

Os pontos vermelho/âmbar/verde do mock de janela no seletor de tema usam `red-500/80`, `amber-500/80`, `emerald-500/80` (escuro) e `red-400`, `amber-400`, `emerald-400` (claro). São decoração, não status do produto.

O card “Instagram” no histórico de canais usa um degradê que não se repete: `#f58529` / `#dd2a7b` / `#8134af`, cada um a 20%.

### Tema claro

Ativado só quando o `<html>` recebe a classe `light` (`html.light`, `:root.light` ou `body.light`). Tokens:

| Papel | Claro |
| --- | --- |
| Fundo | `#f8fafc` |
| Painel | `#ffffff` |
| Superfície | `#f1f5f9` |
| Card / hover | `rgba(0,0,0,0.02)` / `rgba(0,0,0,0.04)` |
| Bordas | preto a 6%, 9% e 16% |
| Acento | `#4f5cd1`, hover `#5e6ad2`, active `#7170ff` |
| Texto | `#0f172a`, `#334155`, `#64748b`, `#94a3b8` |

O CSS publicado ainda reescreve, com `!important`, só estas classes arbitrárias quando `html.light`: `bg-[#08090a]`, `bg-[#08090a]/85` (vira `rgba(248,250,252,0.85)`), `bg-[#0f1011]`, `bg-[#191a1b]`, `text-[#f7f8f8]`, `text-[#d0d6e0]`, `text-[#8a8f98]`, as duas bordas brancas 6% e 8%, e os dois fundos de card brancos 2% e 4%.

`layout.tsx` coloca `class="dark"` no `<html>` e não lê tema. O seletor grava `localStorage.socialpack_theme` e o cookie `socialpack_theme` (1 ano, `SameSite=Lax`). Nenhum outro arquivo lê esse cookie ou essa chave.

### Contraste calculado

Razões abaixo foram calculadas com a luminância relativa do WCAG a partir dos hex. Não estão gravadas no repositório. Referência usada aqui: 4,5:1 para texto pequeno e 3:1 para texto grande ou componente de interface.

| Par | Razão | Leitura |
| --- | --- | --- |
| `#f7f8f8` sobre `#08090a` | 18,73 | Texto principal no escuro |
| `#d0d6e0` sobre `#08090a` | 13,64 | Texto secundário |
| `#8a8f98` sobre `#08090a` | 6,13 | Terciário passa 4,5:1 |
| `#8a8f98` sobre `#0f1011` | 5,86 | Terciário no input/painel |
| `#62666d` sobre `#08090a` | 3,45 | Quaternário fica abaixo de 4,5:1. É o rodapé do app e o placeholder |
| `#62666d` sobre `#0f1011` | 3,30 | Placeholder dentro do input |
| `#ffffff` sobre `#5e6ad2` | 4,70 | Rótulo branco do botão primário passa 4,5:1 |
| `#7170ff` sobre `#08090a` | 5,18 | Link índigo no fundo |
| `#7170ff` sobre `#0f1011` | 4,96 | Chip/link sobre painel |
| `#5e6ad2` sobre `#08090a` | 4,24 | Índigo como texto pequeno no fundo fica abaixo de 4,5:1. No código ele é fundo de botão ou ícone, não corpo de texto |
| `#10b981` sobre `#08090a` | 7,86 | Sucesso |
| `#ff6568` (`red-400`) sobre `#08090a` | 6,94 | Erro |
| `#ffffff` sobre `#e40014` (`red-600`) | 4,87 | Botão de excluir |
| `#0f172a` sobre `#f8fafc` | 17,06 | Texto principal do tema claro |
| `#334155` sobre `#f8fafc` | 9,90 | Secundário claro |
| `#64748b` sobre `#f8fafc` | 4,55 | Terciário claro, no limite de 4,5:1 |
| `#94a3b8` sobre `#f8fafc` | 2,45 | Quaternário claro fica abaixo de 3:1 |
| `#ffffff` sobre `#4f5cd1` | 5,55 | Branco no acento do tema claro |

### Cores da empresa (só na arte e no cadastro)

Não são a paleta do chrome. Padrão no modal de empresa, no fallback da API e no Satori quando a empresa não tem cor: primária `#5e6ad2`, secundária `#7170ff`, destaque `#828fff`. Presets do modal:

| Nome | Primária | Secundária | Destaque |
| --- | --- | --- | --- |
| Linear Indigo | `#5e6ad2` | `#7170ff` | `#828fff` |
| Apple Minimal | `#1d1d1f` | `#86868b` | `#f5f5f7` |
| Classic Navy | `#0a2540` | `#635bff` | `#00d4ff` |
| Deep Emerald | `#064e3b` | `#10b981` | `#34d399` |
| Warm Amber | `#78350f` | `#f59e0b` | `#fbbf24` |
| Sunset Coral | `#991b1b` | `#ef4444` | `#f87171` |

O card da empresa mostra as três cores em círculos de 12px com o hex em `font-mono` 10px.

### Logo

SVGs em `public/brand/`, desenhados em `Logo.tsx`:

- `with-label`: 154×36, wordmark “Social” em `#f7f8f8` peso 700 e “Pack” em `#5e6ad2` peso 600, Inter 28px, tracking `-0.5px`.
- `icon`: 40×40. Squircle `rx="16"`, fundo `#141517` → `#0f1011`, traço `rgba(255,255,255,0.08)`. Quatro marcas: quadrados `rx="4.5"` em `#f7f8f8`, `#44464a` e `#8a8f98`, mais um losango em degradê `#5e6ad2` → `#7170ff`.
- `without-borders` 36×36 e `only-label` 130×32 existem como arquivos; o shell usa `with-label` a 32px de altura na home (`h-8`) e 28px no app (`h-7`).

O link da logo tem `hover:opacity-90`, `focus:outline-none` e `focus:ring-1 focus:ring-[#5e6ad2]`.

## Tipografia

### Famílias

A interface pede Inter em três lugares:

- `src/app/layout.tsx` importa `Inter` de `next/font/google` com `subsets: ["latin"]`, `variable: "--font-inter"` e `display: "swap"`. A classe da variável vai no `<html>`. O `className` da fonte (o que aplicaria `font-family` no elemento) não vai no `<body>`.
- `globals.css` no `body`: `font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`.
- CSS publicado da home: `@font-face` com `font-family: Inter`, `font-weight: 100 900`, `font-display: swap`, arquivos woff2. Também define `Inter Fallback` como `local(Arial)` com `size-adjust: 107.12%`, `ascent-override: 90.44%`, `descent-override: 22.52%`, `line-gap-override: 0%`. A classe publicada no `<html>` seta `--font-inter: "Inter", "Inter Fallback"`. Nenhum componente usa `var(--font-inter)`. O `body` casa com o `@font-face` pelo nome `Inter`.

Recursos OpenType no `body`: `font-feature-settings: "cv01", "ss03"`, `letter-spacing: -0.011em`, `-webkit-font-smoothing: antialiased`. O `<body>` também tem `antialiased`.

PNG do servidor (`loadInterFonts`): quatro TTF em `public/fonts`, família nomeada Inter nos pesos 400 Regular, 500 Medium, 600 SemiBold e 700 Bold, estilo `normal`. O Resvg é chamado com `loadSystemFonts: false`. Não há itálico.

`PostCanvas.tsx` aponta para `var(--font-bricolage)`, `var(--font-playfair)` (fallback `Georgia, serif`) e `var(--font-jakarta)`. Essas variáveis não são definidas em lugar nenhum do repositório. Esse componente não é importado por nenhuma tela nem pela rota de geração. Detalhe na seção da arte e nas lacunas.

### Escala

Valores medidos no CSS publicado (raiz 16px). `--spacing` é `0.25rem` (4px). A entrelinha padrão de cada `text-*` é a variável `--text-*--line-height` do Tailwind 4.

| Classe | Tamanho | Entrelinha padrão | Uso típico |
| --- | --- | --- | --- |
| `text-[10px]` | 10px | a do elemento pai | Badge minúsculo, meta sobre a foto |
| `text-[11px]` | 11px | a do pai | Label de filtro, chip, botão de card, ajuda |
| `text-xs` / `text-[12px]` | 12px (`0.75rem`) | `calc(1 / 0.75)` ≈ 1,333 (16px) | Apoio, rodapé, label, botão compacto |
| `text-[13px]` | 13px | a do pai | Nav, input, botão padrão |
| `text-sm` / `text-[14px]` | 14px (`0.875rem`) | `calc(1.25 / 0.875)` ≈ 1,429 (20px) | Subtítulo de página no `sm`, CTA do hero |
| `text-base` | 16px | 1,5 (24px) | Parágrafo do hero no mobile |
| `text-lg` | 18px (`1.125rem`) | `calc(1.75 / 1.125)` ≈ 1,556 (28px) | Parágrafo do hero a partir de `sm`, título de plano, título de modal |
| `text-xl` | 20px (`1.25rem`) | 1,4 (28px) | Métrica do hero, título de seção de configurações |
| `text-2xl` | 24px (`1.5rem`) | `calc(2 / 1.5)` ≈ 1,333 (32px) | H1 de login e de página no mobile |
| `text-3xl` | 30px (`1.875rem`) | 1,2 (36px) | H1 de página no `sm`, H2 de seção no mobile |
| `text-4xl` | 36px (`2.25rem`) | `calc(2.5 / 2.25)` ≈ 1,111 (40px) | H1 da home no mobile; H2 de seção no `sm`; preço |
| `text-5xl` | 48px, entrelinha 1 | 48px | H1 da home a partir de `sm` (40rem) |
| `text-6xl` | 60px, entrelinha 1 | 60px | H1 da home a partir de `lg` (64rem) |

O H1 da home cobre a entrelinha padrão com `leading-[1.08]` e o tracking com `tracking-[-0.03em]`. O parágrafo do hero usa `leading-relaxed` (1,625) e `tracking-[-0.011em]`.

### Pesos e tracking

| Token publicado | Valor | Classe |
| --- | --- | --- |
| `--font-weight-normal` | 400 | `font-normal` (parágrafo do hero) |
| `--font-weight-medium` | 500 | `font-medium` (nav, botão, label, chip) |
| `--font-weight-semibold` | 600 | `font-semibold` (H1, H2, nome de empresa, botão “Gerar”) |
| `--font-weight-bold` | 700 | `font-bold` (preço, eyebrow “Fluxo Simples”, algumas H3 de modal) |

`tracking-tight` no CSS publicado é `-0.025em`. Entra em H1 de página, títulos de bloco e alguns botões. Eyebrow em caixa alta usa `tracking-wider` (`0.05em`). O body inteiro já tem `-0.011em`; o H1 da home aperta para `-0.03em`.

`font-mono` aparece no @ do Instagram, no hex da paleta, na data do histórico e nas hashtags do modal de preview.

Entrelinhas nomeadas usadas além do padrão: `leading-tight` 1,25, `leading-snug` 1,375 (headline do card), `leading-relaxed` 1,625 (texto de apoio e erro).

## Espaçamento, grid e raios

Unidade: 4px (`--spacing: 0.25rem`). Um `p-6` é 24px, `gap-5` é 20px, `px-4` é 16px, `space-y-1.5` é 6px.

Larguras máximas no CSS publicado: `max-w-md` 28rem, `max-w-xl` 36rem, `max-w-2xl` 42rem, `max-w-4xl` 56rem, `max-w-5xl` 64rem, `max-w-6xl` 72rem (1152px). A home, o shell autenticado e o rodapé usam `max-w-6xl` com `px-4`. Preços usam `max-w-5xl`. Login: `max-w-[380px]`. Cadastro: `max-w-[420px]`. Modal de empresa: `max-w-lg` (32rem). Modal de preview: `max-w-4xl`.

Breakpoints no CSS publicado, e o que as páginas fazem com eles:

| Nome | Min-width | O que muda |
| --- | --- | --- |
| padrão | 0 | Uma coluna. Hero centralizado. Botões do hero em largura total. Nav do app some |
| `sm` | 40rem (640px) | H1 da home sobe para 48px. Botões do hero ficam em linha. “Planos” da home aparece. Nome do usuário aparece. Galeria de posts: 2 colunas. Rótulos “Galeria/Lista” e “Legenda/Baixar” aparecem |
| `md` | 48rem (768px) | Nav do app (`hidden md:flex`). Passos da home em 3 colunas. Formulário de geração em 12 colunas. Modal de preview lado a lado |
| `lg` | 64rem (1024px) | Hero em 12 colunas (7 + 5), texto à esquerda. H1 a 60px. Galeria em 3 colunas. Empresas em 3 colunas |
| `xl` | 80rem (1280px) | Galeria de posts em 4 colunas |

O stylesheet também tem `@media (min-width: 96rem)` limitando `.container` a 96rem. As páginas usam `max-w-6xl`, não a classe `container`.

Cabeçalho: `sticky top-0`, altura `h-16` (64px), borda inferior sutil, `backdrop-blur-md` (12px no CSS publicado). Home: `z-50`, fundo `#08090a` a 80%. App: `z-40`, fundo a 85%.

Raios no CSS publicado, sem override no `@theme`:

| Classe | Valor | Uso |
| --- | --- | --- |
| `rounded-sm` | 4px (`0.25rem`) | Pouco usado |
| `rounded` | 4px na escala padrão do Tailwind 4 quando a classe aparece | Anel do logo (`rounded` sem sufixo) |
| `rounded-[5px]` | 5px | Botão interno do toggle galeria/lista |
| `rounded-md` | 6px (`0.375rem`) | Botão, input, select, ícone de sair |
| `rounded-lg` | 8px | Caixa interna, passo numerado, thumb da lista, banner |
| `rounded-xl` | 12px | Card, modal, painel de formulário |
| `rounded-2xl` | 16px | Estado vazio da geração |
| `rounded-full` | pílula | Badge, ponto de status, barra de progresso |

Sombras nomeadas no CSS publicado:

- `shadow-xs`: `0 1px 2px 0 #0000000d`
- `shadow-lg`: começa em `0 10px 15px -3px` com cor `#0000001a`
- `shadow-xl`: `0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a` (card de login/cadastro)
- `shadow-2xl`: `0 25px 50px -12px #00000040` (cards do hero e modais)
- `shadow-inner`: `inset 0 2px 4px 0 #0000000d` (mock do seletor de tema)

Arbitrárias já citadas nos botões, mais `0 20px 50px rgba(0,0,0,0.8)` no card do hero, `0 10px 30px rgba(94,106,210,0.15)` no Plano Pro e `0 20px 50px rgba(94,106,210,0.2)` no modal de upgrade.

Grids recorrentes: empresas `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` com `gap-5`; posts em galeria `1 / 2 / 3 / 4` colunas e `gap-4` ou `gap-5`; lista em coluna com `gap-2.5`. Thumb da lista: 72px, 80px a partir de `sm`.

## Componentes e estados

Não há biblioteca de componentes (sem Button/Input compartilhado). O padrão está copiado nas telas. Ícones: `src/components/icons.tsx`, SVG 18×18, `viewBox="0 0 24 24"`, traço 2, `aria-hidden="true"`, tamanho real via `size-3` (12px) até `size-6` (24px).

### Botão primário

`inline-flex`, `items-center`, `justify-center`, `rounded-md`, fundo `#5e6ad2`, texto branco, `font-medium` (às vezes `font-semibold`), `cursor-pointer`.

| Variante | Altura | Texto | Sombra |
| --- | --- | --- | --- |
| Nav “Começar” | 36px (`h-9`), `px-4` | 13px | `0 1px 2px rgba(0,0,0,0.4)` |
| Hero “Conhecer os Planos” | 44px (`h-11`), `px-6` | 14px | `0 1px 3px rgba(0,0,0,0.5)` |
| Submit de auth | 40px (`h-10`), largura total | 13px | `0 1px 2px rgba(0,0,0,0.4)` |
| “Gerar Semana” | 40px, largura da coluna | 12px semibold | `0 1px 3px rgba(0,0,0,0.4)` |
| Ação de card (“Baixar”) | 32px (`h-8`) | 11px | nenhuma, ou a sombra de 1px no “Gerar Artes” |

Hover: fundo `#7170ff`. Active, quando a classe existe: `scale(0.98)`. Desabilitado: opacidade 0,5 ou 0,6, como acima. Não há estilo de foco no botão primário.

### Botão secundário e fantasma

Mesma altura do contexto (32, 36 ou 40px), `rounded-md`, borda padrão, fundo branco a 2–4%. Hover clareia fundo e texto. “Já tenho uma conta” e “Assinar Starter” seguem isso. Ícone de sair: 32×32, fundo 2%, hover fundo 6% e texto `#f7f8f8`, `title="Sair da Conta"`, sem `aria-label`.

### Botão destrutivo

Modal de exclusão: 36px, `bg-red-600`, hover `bg-red-700`, texto branco 12px, `shadow-xs`. Durante a ação: spinner + “Excluindo...”, opacidade 0,5. Cancelar ao lado é botão secundário.

### Input e select

Label: `text-[12px]` ou `text-xs` ou `text-[11px]`, `font-medium`, cor `#d0d6e0` ou `#8a8f98`, `htmlFor` apontando para o campo.

Campo: largura total, altura 36px (`h-9`) ou 40px no date/select da geração (`h-10`), `px-3`, `rounded-md`, fundo `#0f1011` (no modal de empresa, `#08090a`), borda padrão ou `rgba(255,255,255,0.1)`, texto 13px ou 12px, placeholder `#62666d`. Hover de select/date/busca: borda `rgba(255,255,255,0.18)`. Foco: `outline-none` e `focus:border-[#5e6ad2]`. Date e select da geração também têm `focus:ring-1 focus:ring-[#5e6ad2]`. Transição: `transition-colors`. Select nativo com `appearance-none` e chevron absoluto.

Toggle de plano no cadastro: altura 28px (`h-7`), `rounded`, texto 11px. Ativo: fundo `#5e6ad2` texto branco. Inativo: fundo branco a 3%, texto `#8a8f98`, hover no texto para `#f7f8f8`.

### Cards

Card padrão: `rounded-xl`, borda `rgba(255,255,255,0.08)`, fundo branco a 2%, padding 20–28px. Hover comum: borda `rgba(255,255,255,0.14)` ou `0.16`, às vezes fundo 3% ou 4%. Card de canal Instagram: hover na borda `#5e6ad2` a 50% e título `#7170ff`. Plano Pro: `border-2 border-[#5e6ad2]`, fundo `#0d0e12`, sombra índigo, badge “Mais Escolhido” absoluto a `-top-3`.

Card “nova empresa”: borda tracejada 2px, `min-h-[220px]`, hover borda `#5e6ad2` e texto `#7170ff`. Canais “em breve”: opacidade 0,5, `pointer-events-none`, `select-none`.

Card de post (galeria): `rounded-xl`, `overflow-hidden`, borda padrão, hover `rgba(255,255,255,0.16)`. Foto quadrada sobre `#08090a`. Hover da foto: overlay `bg-black/40` e chip “Ampliar Arte” (`bg-black/60`, `backdrop-blur-xs` = 4px, borda `white/20`). Badges sobre a foto: dia em 10px sobre `black/55`; tema em `#7170ff` sobre `#0f1011` a 85%. Headline `text-xs font-semibold line-clamp-2 leading-snug`.

Linha de post (lista): mesma borda e fundo, `rounded-xl`, padding 10px / 12px no `sm`, hover da borda a 14%. Thumb 72px / 80px, `rounded-lg`. Headline uma linha. No mobile os botões “Legenda” e “Baixar” ficam só ícone (32px); o rótulo volta no `sm`.

### Toggle galeria / lista

Grupo `role="group"` com `aria-label="Modo de visualização"`. Trilho: `inline-flex`, `rounded-md`, borda `rgba(255,255,255,0.1)`, fundo `#0f1011`, padding 2px. Botão: altura 32px, `rounded-[5px]`, texto 11px, `aria-pressed`. Ativo: fundo branco a 8%, texto `#f7f8f8`. Inativo: `#8a8f98`, hover `#d0d6e0`. A preferência fica em `localStorage` na chave `socialpack_posts_view` (`gallery` ou `list`; outro valor cai em `gallery`).

### Navegação

Home: links 13px medium `#d0d6e0`, hover `#f7f8f8`. “Planos” é `<a href="#planos">` e fica `hidden` abaixo de `sm`.

App (perfil, geração, histórico, configurações): links 13px. Inativo `#8a8f98`, hover `#d0d6e0`. Ativo: texto `#f7f8f8` e `border-b-2 border-[#5e6ad2]`. O bloco inteiro é `hidden md:flex`. Abaixo de `md` sobram logo e sair.

Abas de configurações: botão 13px, padding vertical 12px. Ativa: texto `#f7f8f8`, ícone `#5e6ad2`, barra inferior de 2px `#5e6ad2`. Inativa: texto e ícone `#8a8f98`, hover `#d0d6e0` e barra branca a 6%. O `<nav>` tem `aria-label="Abas de Configurações"`.

### Badge, barra e feedback

Badge ativo / “Mais Escolhido”: pílula, texto 11px medium, fundo `#10b981` a 15%, texto e ponto `#10b981`, borda a 30%.

Chip de tema: texto 11px `#7170ff`, fundo `#5e6ad2` a 10% ou 15%, às vezes borda `#5e6ad2` a 20–30%.

Chip neutro: fundo branco a 4% ou 5%, texto `#d0d6e0`, borda 6% ou 8%.

Barra de cota: trilho altura 6px ou 8px, `rounded-full`, fundo branco a 6%. Preenchimento `#5e6ad2`. No perfil, quando a cota enche, o preenchimento troca para `#10b981`. Em configurações o preenchimento continua `#5e6ad2` e o aviso é texto `amber-400`.

Banner de plano: `rounded-lg`, `text-sm`. Sucesso com fundo/borda/texto em `#10b981`. Erro com `red-500/10`, `red-500/30`, `red-400`.

### Modal

Overlay `fixed inset-0 z-50`, centralizado, `p-4`. Preview: `bg-black/85 backdrop-blur-sm` (8px). Exclusão, empresa e upsell: `bg-black/80 backdrop-blur-xs` (4px). Upgrade: `bg-black/75 backdrop-blur-sm`. Vários overlays trazem `animate-in fade-in duration-200`.

Painel: `rounded-xl`, fundo `#0f1011` (upsell `#0d0e12`), borda branca a 12% (upsell: `#5e6ad2` a 50%), `shadow-2xl`, padding 24px ou 28px no `sm`. Fechar: 28px ou 32px, `aria-label="Fechar"`, glifo “✕”. No preview o fechar é círculo `bg-black/60`.

O preview empilha no mobile e fica 50/50 a partir de `md`. A imagem tem `rounded-lg` e borda padrão. Legenda em caixa `#08090a`, `text-xs`, `whitespace-pre-wrap`, `max-h-48`. Hashtag: `text-[10px] font-mono text-[#7170ff]` sobre `#5e6ad2` a 10%.

### Estados vazios, carregando e erro

| Situação | O que a tela mostra |
| --- | --- |
| Semana ainda não gerada | Card `rounded-2xl`, ícone sparkles em caixa 48px, título 16px semibold, texto 12px terciário |
| Gerando | Faixa `#5e6ad2/10` com texto `#7170ff` e spinner; 7 skeletons `animate-pulse` com quadrado e duas barras |
| Sem empresa na geração | Faixa com ícone e link “Cadastrar Empresa” |
| Histórico sem resultado | Card, título “Nenhuma criação encontrada”, botão “Limpar Filtros” |
| Foto ausente | “Sem prévia” em 12px terciário, ou “—” 10px na lista |
| Suspense de login/cadastro | Spinner 20px `#5e6ad2` + “Carregando login...” ou o equivalente de cadastro, texto 12px `#8a8f98` |
| Submit pendente | Botão com spinner 16px e rótulo (“Gerando 7 Artes...”, “Salvando...” no tema, “Compactando ZIP...”, “Excluindo...”) |
| Erro de formulário | Caixa vermelha descrita acima. Cópia de legenda falha em `alert` |
| Assinatura inativa | Card `max-w-md` central, H2 20px, texto 14px, botão primário “Ver plano e assinatura” e secundário “Ativar conta” |

`animate-spin` no CSS publicado: `spin 1s linear infinite`. `animate-pulse`: `pulse 2s cubic-bezier(.4, 0, .6, 1) infinite`.

Durante a troca de tema, `html.theme-transition` aplica em tudo, com `!important`, `transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease` por 300ms.

Hover de foto na galeria: `transition-transform duration-300` e `scale(1.02)`. Seta de card de canal: `group-hover:translate-x-1`.

## Arte 1080×1080

Quem gera o PNG de verdade é `renderPostToPngBuffer` em `src/lib/rendering/satori-renderer.ts`: Satori monta SVG em 1080×1080 e o Resvg rasteriza com `fitTo` largura 1080. A rota `POST /api/generate/weekly` chama essa função. `src/lib/export-image.ts` (`html-to-image`, PNG 1080, `pixelRatio: 1`) não é importado por ninguém.

`layout` do post é `(post.layout ?? 0) % 7`. Cores: as da empresa, ou o índigo padrão. Se a foto falha ou passa de 3,5s, entra um SVG com degradê linear da primária para `#0f1011` (50%) e daí para a secundária.

Fonte de todo layout: Inter, só os quatro pesos locais. CTA padrão quando falta texto: “Saiba mais”, exceto o brutalista (“Fale conosco”).

| # | Nome no código | Fundo e estrutura | Tipo (px / peso) |
| --- | --- | --- | --- |
| 0 | Editorial Kinfolk | `#f4f2ee`, texto `#1a1b1e`, padding 72. Foto 440×600, raio 16, borda `rgba(26,27,30,0.08)` 3px, sombra `0 18px 40px rgba(20,21,22,0.12)` | Tema 22/600 caixa alta, tracking 3, cor primária. Cidade 20/500 `#6b7078`. Título 60/700 `#141516`, linha 1,15. Apoio 26/400 `#4a4f57`, linha 1,45. CTA primária, branco, raio 8, padding 32×16, 22/600. Nome 24/700 `#141516`. Handle 22/500 na primária |
| 1 | Moldura Polaroid | Página `#050506`, padding 56. Cartão branco 920×950, raio 12, padding 40, sombra `0 32px 64px rgba(0,0,0,0.65)`. Foto 848×600, raio 8, fundo `#1d1d1f` | Título 44/700 `#1d1d1f`, linha 1,2. Nome 22/600 na primária. Handle 20/500 `#62666d` |
| 2 | Frase & Foto | `#08090a`, padding 80, texto `#f7f8f8`. Aspas ““ 120/700 na primária, linha 0,8. Foto circular 140×140 (raio 70), borda 4px na cor de destaque | Título 66/700. Apoio 30/400. Nome 26/700. Meta 20 `#8a8f98`. CTA igual à do layout 0 |
| 3 | Cinema Moody | Foto full-bleed sobre `#000`. Faixa preta superior 120px. Degradê inferior 280px, `rgba(0,0,0,0.95)` → `0.72` → `0`. Padding lateral 64 | Nome e tema 20/500, tracking 2, `#c8ccd2`; tema na primária. Título 52/700 branco, linha 1,15, largura máx. 920. Apoio 22 `#d8dde6`, linha 1,4, máx. 680. Handle 22/600 na cor de destaque |
| 4 | Split Vertical | Duas colunas de 540. Esquerda: foto. Direita: `#0f1011` | Kicker 20/600 tracking 2. Título 52/700. Apoio 24/400. CTA raio 8, 22/600, fundo primário. Meta 20 `#8a8f98` |
| 5 | Card Glassmorphism | Foto full-bleed com opacidade 0,75, véu `rgba(8,9,10,0.6)`. Cartão 860px, `rgba(15,16,17,0.85)`, borda 2px `rgba(255,255,255,0.16)`, raio 24, padding 64 | Tema 20/600 caixa alta tracking 2 na primária. Título 58/700 `#f7f8f8` linha 1,15. Apoio 26. CTA raio 8, 20/600. Handle 22/600 `#f7f8f8` |
| 6 | Pôster Brutalista | `#0a0a0c`, borda 10px na primária. Faixa de topo sólida na primária, padding 28×48. Foto 964×460, borda 4px `rgba(255,255,255,0.25)`, sem raio. Rodapé com borda superior 6px na primária | Tema 26/700 branco, caixa alta, tracking 1. Nome 24/700 branco, caixa alta. Título 52/700 `#f7f8f8`, caixa alta, linha 1,15. CTA 22/700, texto `#0a0a0c`, fundo na secundária, padding 10×20. Handle 22/700 branco sobre a primária |

`src/components/cards/PostCanvas.tsx` desenha outros sete quadros com os mesmos nomes (`LAYOUT_NAMES`: Editorial Kinfolk, Moldura Polaroid, Frase & Foto, Cinema Moody, Split Vertical, Card Glassmorphism, Pôster Brutalista), em 1080×1080, para um fluxo de `html-to-image` que não está ligado. Constantes próprias: `INK = #0d0d14`; texto claro ou `#ffffff` conforme a luminância do fundo passar de 0,42 (`readableOn`). Título escala por comprimento: 116, 100, 86, 74 ou 64px, vezes um fator por layout. Apoio: 36, 32 ou 28px. Fundos desse arquivo, diferentes do Satori: editorial `#faf8f5`, polaroid em degradê primária→secundária com cartão branco raio 24, foto cheia `#0e0f12`, cinema `#000`, split e brutalista na cor primária, glass `#1c1c1e` com cartão `rgba(255,255,255,0.82)` raio 44. Vários CTAs são pílula (`borderRadius: 999`). O brutalista desse arquivo usa uma etiqueta `#ffe600`. Nenhum desses números alimenta o PNG da API.

## Regras de uso

O que seguir ao alterar a interface. Onde o código de hoje diverge, a divergência está listada na seção seguinte; a regra vale para a mudança nova.

### Faça

- Mantenha o chrome quase preto, com borda de 1px em branco translúcido e um único acento índigo. O índigo é ação, link e estado ativo. Verde é sucesso. Vermelho é erro ou destrutivo. Âmbar é aviso.
- Use Inter. Título de página: `text-2xl sm:text-3xl font-semibold tracking-tight`. Apoio: `text-xs` ou `text-sm` em `#8a8f98` com `leading-relaxed`. Controle: 12–14px, peso 500.
- Botão de ação: `rounded-md`, altura 36, 40 ou 44px, fundo `#5e6ad2`, hover `#7170ff`, texto branco, `active:scale-[0.98]` se o grupo já usa escala. Botão secundário: fundo branco a 2–4% e borda a 8%.
- Pílula para status e chip. Card e modal em `rounded-xl` (12px).
- Texto longo: `truncate`, `line-clamp-1` ou `line-clamp-2`. Em flex, o filho que trunca precisa de `min-w-0` (a linha de post já faz isso).
- Forme estados de vazio, carregando e erro no mesmo card do restante da tela: título curto, uma frase com o próximo passo, spinner índigo no carregamento.
- Ação destrutiva pede confirmação (o modal de excluir post é o modelo). O botão destrutivo fica vermelho (`red-600` / hover `red-700`), separado do cancelar.
- Link navega (`<a>` ou `Link`). Botão executa. Ícone decorativo continua com `aria-hidden`. Botão que é só ícone leva nome acessível (`aria-label` ou texto visível a partir de um breakpoint, como o toggle de visão).
- Campo com `<label htmlFor>`. Foco visível: a borda `#5e6ad2` já é o sinal dos inputs; não remova o contorno sem pôr outro sinal. Prefira `:focus-visible` para o anel não aparecer em todo clique.
- Hover deixa o controle mais claro que o repouso (índigo → `#7170ff`, texto `#8a8f98` → `#d0d6e0` ou `#f7f8f8`).
- Animação: liste as propriedades (`transition-colors`, `transition-opacity`, `transition-transform`). Movimento que não for essencial respeita `prefers-reduced-motion`.
- No tema claro, toda cor de chrome hardcoded precisa de par em `html.light`, no mesmo espírito das regras que já existem para `#08090a`, `#0f1011` e os textos principais. Melhor ainda: usar as variáveis de `:root` em vez de um hex novo.
- Na arte, a cor da empresa é acento (CTA, kicker, faixa). O PNG continua 1080×1080, Inter, pesos 400–700. Texto de post respeita os tetos do `content/templates/README.md`.
- Reticências de interface no caractere `…` quando o texto for de espera. Números e datas com `Intl` (o plano já usa `toLocaleDateString("pt-BR")`).

### Não faça

- Não introduza outra família no chrome. Bricolage, Playfair e Jakarta não estão carregadas.
- Não troque o botão para pílula, nem o card para raio grande, para “modernizar”. O raio curto é o desenho atual.
- Não acrescente degradê roxo, blob ou vidro no chrome. O único degradê de marketing é o de “1 clique”; o único brilho é o do hero. Vidro e degradê existem na arte (layouts 3 e 5), não na aplicação.
- Não use a paleta da empresa (presets coral, âmbar, navy) como cor de botão do produto.
- Não use `#62666d` para instrução, erro ou rótulo que a pessoa precise ler. Esse tom fica abaixo de 4,5:1 no fundo e no input.
- Não use `transition: all` / `transition-all` em controle novo. Vários botões atuais já têm `transition-all`; isso não autoriza copiar.
- Não use `outline-none` sem substituição visível.
- Não desative zoom (`user-scalable=no`, `maximum-scale=1`). O viewport publicado é `width=device-width, initial-scale=1`.
- Não esconda a nav do app no mobile sem oferecer outro caminho. Hoje ela some abaixo de `md`.
- Não trate `PostCanvas.tsx` como a arte que o usuário baixa. O PNG sai do Satori.
- Não invente token. Se a cor não está nesta página nem no CSS, ela não faz parte do sistema.

## Acessibilidade e responsividade

Regras para a próxima mudança, alinhadas ao que a interface já tenta fazer e ao que falta.

- `lang="pt-BR"` no `<html>`. Mantenha.
- Título da página segue o template `"%s | SocialPack"`; o default publicado é “SocialPack — Geração Semanal de Conteúdo”.
- Hierarquia: uma H1 por tela (`text-2xl`/`text-3xl` no app, `text-4xl`–`text-6xl` na home). Seção da home usa H2. Não pule nível para conseguir tamanho; o tamanho vem da classe.
- Alvo de toque dos controles principais: 32px nos botões de card, 36–44px nos de página. No mobile, “Legenda” e “Baixar” da lista são 32×32 com `title`, sem texto. Ao mexer neles, mantenha no mínimo 32px e um nome acessível.
- Foco: input muda a borda para `#5e6ad2`. Logo usa anel de 1px. A maioria dos botões não tem anel. Ao criar controle, inclua foco visível com `:focus-visible`.
- Contraste: texto de leitura em `#f7f8f8`, `#d0d6e0` ou `#8a8f98` sobre `#08090a` / `#0f1011`. Branco sobre `#5e6ad2` está em 4,70:1. Não desça texto essencial para `#62666d`. No tema claro, não use o quaternário `#94a3b8` para texto (2,45:1 sobre `#f8fafc`).
- Spinner em região que atualiza sozinha (gerar, salvar, excluir) deve poder ser anunciado. Hoje o texto muda (“Gerando 7 Artes...”) e não há `aria-live`.
- Modais precisam de nome, foco preso e fechar por teclado. O código fecha pelo botão “✕” e, nos de confirmação, por Cancelar. Não há `role="dialog"` nem `aria-modal` nos overlays lidos.
- Imagens de post usam `alt` com a headline. Logo usa `alt` do arquivo e o link tem `aria-label="SocialPack Início"`. Ícones de `icons.tsx` são `aria-hidden`.
- Responsivo: desenhe primeiro a coluna única. `sm` (640px) alinha botões e abre a segunda coluna. `md` (768px) devolve a nav do app e o modal lado a lado. `lg` (1024px) abre o hero em duas colunas. `xl` (1280px) a quarta coluna da galeria. Não fixe largura acima de `max-w-6xl` no shell.
- A home em 390px de largura fica numa coluna, texto centralizado, botões em largura cheia, link “Planos” oculto, mosaico de cards abaixo do texto. Confere com as classes `grid-cols-1`, `text-center lg:text-left` e `hidden sm:inline-block`.
- Não há `env(safe-area-inset-*)` nem `theme-color`. Se a tela encostar na borda do telefone, o padding `p-4` / `px-4` já existente é o respiro atual; não zere esse padding.
- Movimento: a troca de tema anima cor por 0,2s em todos os elementos. Não há `prefers-reduced-motion` no CSS. Ao adicionar animação, ofereça redução.

## Inconsistências e lacunas

Observações. Não são correções.

1. Três nomes para o mesmo índigo. No `@theme`, `#5e6ad2` é `brand-indigo`, `#7170ff` é `brand-accent` e `#828fff` é `brand-hover`. Em `:root`, os mesmos hex são `accent-primary`, `accent-hover` e `accent-active`. Na tela, `#7170ff` é o hover do botão e também a cor de link em repouso; `#828fff` é o hover do link. O `:active` do botão não muda a cor, só a escala.
2. As telas ignoram as classes do `@theme` e repetem o hex. O CSS publicado da home nem emite `--color-marketing`. As variáveis de `:root` pintam o `body`; o restante pinta por classe arbitrária.
3. Tema claro incompleto. O `<html>` nasce com `dark`. Cookie e `localStorage` são gravados e não são lidos em nenhum outro arquivo. A classe `light` só entra quando `AppearanceSelector` monta (tela de configurações). Várias cores do escuro não têm override: `#7170ff`, `#5e6ad2`, `#62666d`, `#10b981`, `#0a0b0d`, `#121315`, `#0d0e12`, bordas `white/10` e `white/14`, fundos `white/03`, `white/05`, `white/01`, e as classes `red-*` / `amber-*`. O botão continua `#5e6ad2` no claro, enquanto o token claro de acento é `#4f5cd1` (esse hex aparece no mock do cartão “Tema Claro”, não no botão real).
4. `--font-inter` existe no `<html>` publicado e nenhum estilo da aplicação usa a variável. O `body` depende do nome `Inter` bater com o `@font-face`. Funciona no CSS publicado. O PNG usa outros arquivos: TTF estáticos 400–700, não o woff2 variável 100–900 do site.
5. `PostCanvas.tsx` e `export-image.ts` estão soltos. A arte baixada sai de `satori-renderer.ts`. Os dois desenhos compartilham os sete nomes e divergem em fundo, fonte, raio e CTA. O comentário do `PostCanvas` diz que o PNG do `html-to-image` fica idêntico à prévia; nada chama esse export.
6. `PostCanvas` cita `--font-bricolage`, `--font-playfair` e `--font-jakarta`. Não há `@font-face` nem `next/font` para elas.
7. `content/templates/*.json` não descreve cor, fonte nem layout. Quem escolhe o visual da arte é `post.layout % 7` no Satori.
8. `animate-in` e `fade-in` estão nos overlays e não existem no CSS publicado da home (não há plugin `tailwindcss-animate`). `duration-200` é emitido, mas o overlay não declara `transition`. A abertura do modal, no CSS visto, não anima.
9. Foco e teclado. Inputs usam `outline-none` e trocam a borda no `:focus`, não no `:focus-visible`. O logo tira o outline e põe anel também no `:focus`. Botões primários não têm anel. Sair é botão de ícone com `title` e sem `aria-label`. Excluir post na lista/galeria idem (`title="Excluir Post"`). Excluir empresa pede `window.confirm`; excluir post abre modal. Falha ao copiar legenda chama `alert`.
10. Nav do app é `hidden md:flex` e não há menu substituto. Na home, só “Planos” some abaixo de `sm`; “Entrar” e “Começar” ficam. Visto na captura de 390px.
11. Não há skip link, `color-scheme`, `<meta name="theme-color">` nem `prefers-reduced-motion`. A troca de tema anima `background-color`, `border-color` e `color` em `*` com `!important`. Vários botões usam `transition-all`.
12. Opacidade de desabilitado não é única: 0,6 no submit de auth e no modal de empresa; 0,5 na geração, na conta, no ZIP e na exclusão.
13. Rodapé da home é `text-xs text-[#8a8f98]`. Rodapé do app é `text-xs text-[#62666d]` (3,45:1 sobre `#08090a`).
14. Header da home: `z-50` e fundo a 80%. Header do app: `z-40` e fundo a 85%.
15. Cota cheia: no perfil a barra vira `#10b981`; em configurações a barra fica `#5e6ad2` e o texto fica `amber-400`.
16. O degradê do card Instagram (`#f58529`, `#dd2a7b`, `#8134af`) não faz parte do restante da paleta.
17. `lucide-react` está nas dependências e não é usado em `src`. Os ícones são os SVGs de `icons.tsx`.
18. O site publicado confere com a home atual. A galeria/lista (`PostCard`, `PostListRow`, `PostsViewToggle`) e os fundos novos do Satori (editorial `#f4f2ee`, polaroid `#050506`, cinema full-bleed, faixa brutalista na cor primária) estão no código de `main` e não foram revistos logado no site, nem como PNG gerado.

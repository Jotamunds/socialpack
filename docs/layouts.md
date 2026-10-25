# Layouts de post (L0–L6)

Frames 1080×1080 do arquivo Figma `BIPHNOCOX0wUywJgXFeb6l`, portados para `PostCanvas` (preview) e para o mesmo componente no `satori-renderer` (PNG). Os índices continuam 0–6.

A paleta de cada empresa tem três cores: `primary`, `secondary` e `accent`. O frame foi desenhado com uma família só (`#5e6ad2`, `#828fff`, `#7170ff`). No app esses hex são papéis, não valores copiados. Texto em cima de uma cor de marca usa `readableOn`. Quando a cor de marca é o próprio texto e não contrasta com o fundo, `readableBrand` escurece ou clareia o tom até 3:1.

## Layout × papel

| Layout | primary | secondary | accent | Fixo de identidade |
|---|---|---|---|---|
| L0 Editorial Revista | kicker e CTA | fio sob o kicker | barra de 6px na base da foto | papel `#f6f1e9`, tinta `#14141f`, cinzas `#4a4a5a` e `#6b6b7b` |
| L1 Polaroid Mural | kicker dentro da polaroid | bolha do canto | fundo | polaroid branca, fita `rgba(255,255,255,0.7)`, sombra, pílula tinta |
| L2 Frase & Foto | badge do tema | fio ao lado do CTA | aspas | véu `#14141f` (0 → 92%) para o texto ler sobre a foto; brancos do tipo |
| L3 Cinema Legenda | fio de 4px na base da foto | @ no rodapé | kicker e CTA | preto das barras, REC `#ff4d4d` |
| L4 Split | painel | círculos dos passos | fio sob o kicker | botão tinta `#14141f` |
| L5 Glass Valores | blob inferior | blob superior | bolinha e ✓ | vidro simulado (sem `backdrop-filter`); brancos do tipo e do botão |
| L6 Brutalista | 2ª linha da manchete | borda da foto e ★ | CTA, se contrastar com a tinta | amarelo `#f2ef4a` e tinta `#14141f` |

O número do passo no L4 é `readableOn` da cor do círculo, não o primary cru: o círculo passou a ser `secondary`, e o número precisa continuar legível. Se `secondary` some no painel, o círculo vira a cor de texto do painel.

## Cores fixas, e por quê

- **Papel e tinta do L0.** A página de revista é um objeto neutro. Tingir o fundo com a marca apaga o contraste editorial. Os cinzas `#4a4a5a` e `#6b6b7b` são o texto corrido e o @, não um papel de cor.
- **Polaroid branca, fita e sombra.** É o objeto físico do layout. A pílula do CTA é tinta (`#14141f`) com texto branco, como um carimbo. Se a tinta não separa do fundo, entra um fio de 3px na cor legível do fundo — só nessa situação.
- **Véu escuro do L2 e do L5.** Decisão de leitura sobre a foto, não de marca. O degradê parte de `#14141f`. No L2 ele começa em 18% (o frame ia de 0 a 90%) para a headline no meio do quadro não cair numa foto clara.
- **Preto e REC do L3.** Barras de letterbox e a luz de gravação. `#ff4d4d` não pertence à paleta.
- **Botão tinta do L4.** Mesma regra da pílula do L1. O anel claro só aparece quando o primary é escuro demais para a tinta aparecer.
- **Amarelo do L6: `#f2ef4a`, não `#ffe600`.** O frame usa `#f2ef4a` no fundo, no CTA e no marquee. O `#ffe600` antigo era um neon mais ácido. Ficou o amarelo do cartaz desenhado. O CTA usa `accent` quando ele passa de 3:1 sobre a tinta; senão volta para esse amarelo.

`#14141f` (tinta dos layouts) não é o `INK` de `color.ts` (`#0d0d14`). O `INK` continua sendo o preto de `readableOn`. A tinta dos frames é a cor chapada de bloco, botão e papel.

## Texto no limite do gerador

O gerador corta em 68 (headline), 120 (subheadline), 28 (CTA) e 24 (badge). Cada bloco estima linhas pela largura e reduz a fonte até caber na caixa. Palavra sem espaço quebra (`break-word`). CTA de uma linha reduz a fonte em vez de quebrar o botão. No L1, subheadline e CTA ficam lado a lado quando cabem; se o CTA estoura a largura, ele desce para a linha de baixo.

L4 e L5 não têm campo de lista. Os três passos e os três itens saem da subheadline: frases, senão vírgulas, senão três terços das palavras.

O L6 parte a headline em duas linhas equilibradas, em caixa alta. A fonte começa em 196px e desce até a linha mais longa caber em ~968px e as duas linhas terminarem antes do bloco (y 520).

O `Nº` e o `CENA` usam o índice do dia (`index`, ou `post-N-` no id quando o PNG sai pelo renderer), de 01 a 07.

## Fontes

Google Fonts, SIL Open Font License 1.1. Licença e créditos em `public/fonts/OFL.txt`.

| Família | Pesos no renderer | Uso |
|---|---|---|
| Plus Jakarta Sans | 400, 500, 600, 700 | texto, kickers, botões |
| Playfair Display | 700, 900, itálico 400 | headline do L0 e do L2, aspas, `Nº` |
| Bricolage Grotesque | 700, 800 (opsz 14, wdth 100) | display do L1, L3, L4, L5 e L6 |

Os arquivos são subconjuntos latinos (acentos do português, `“`, `→`, `·`, `º`, `★`). Os contornos não foram redesenhados. O `✓` do L5 é um path SVG: a Jakarta não traz esse glifo. O preview carrega os mesmos TTF por `@font-face`, com o family name que o Satori registra. `next/font` geraria outro nome e o PNG divergiria do preview.

## Satori

O PNG renderiza `PostCard`, o mesmo componente do preview. Limitações visíveis:

- Não há `backdrop-filter`. O vidro do L5 é um degradê (branco 28% → tinta 88%), borda `rgba(255,255,255,0.35)` e raio 40. A foto leva `blur(12px)`, que o Satori aceita; os blobs são `radial-gradient`, não um blur gaussiano de 60px.
- Não há `z-index`. A ordem dos elementos no JSX é a ordem de pintura.
- `letter-spacing` vai em pixels. O sublinhado do CTA no L0 é `text-decoration: underline`.
- O resvg (2.6) entra em pânico em `fit_to_rect` se um shape clipado fica inteiro depois de ~2× o canvas (x ≥ 2200 num quadro de 1080). A faixa do L6 repete `handle ★ badge ★` só até cobrir a largura e não emite peça que comece em x ≥ 1900. Texto que começa dentro do quadro e vaza para a direita não dispara isso.

## Previews

`docs/layouts-preview/` tem os 7 layouts em duas paletas, gerados por `scripts/render-layout-previews.ts`:

- pastel: `#8FB8E8` / `#F3B7C8` / `#B7E0C4`
- escura: `#4C1D95` / `#E11D48` / `#F59E0B`

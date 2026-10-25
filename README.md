# SocialPack

Este repositório é um **projeto de teste de conhecimentos**: um exercício de estudo e prática. Não é um produto em produção.

## O que é

Aplicação web para montar uma semana de posts de feed do Instagram a partir do perfil de uma empresa (nome, nicho, cidade, tom de voz e cores). O motor em `src/lib/generator.ts` monta **7 posts** com textos de `content/templates/` e fotos da curadoria em `src/lib/curated-images.ts`. Nichos e tons de voz ficam em `content/catalog.json`. O formato dos JSON de nicho está em `content/templates/README.md`.

A geração renderiza cada arte em PNG 1080×1080 no servidor (`satori` + `@resvg/resvg-js`) e envia o arquivo ao bucket privado `generated-arts`. O cliente também pode exportar a prévia com `html-to-image` e baixar o pacote da semana em ZIP (`jszip`).

Telas e rotas:

- `/` — landing
- `/cadastro` e `/login` — conta com e-mail e senha (Supabase Auth)
- `/perfil` — empresas
- `/geracao` — redireciona para `/geracao/instagram/posts`
- `/geracao/historico` — posts já gerados
- `/configuracoes` — perfil, aparência e plano
- `POST /api/generate/weekly` — gera a semana da empresa autenticada

Rotas `/perfil`, `/geracao` e `/configuracoes` exigem sessão. O schema (tabelas, RLS e bucket) está em `supabase/migrations/`.

Os planos `starter` (1 empresa) e `pro` (3 empresas) são registros em `public.subscriptions`. O upgrade grava o plano direto nessa tabela. `cancelSubscriptionAction` é uma ação simulada. O código não integra gateway de pagamento.

## Tecnologias

Do `package.json`:

- Next.js 16.4.3, React 19.3.0 e TypeScript
- Tailwind CSS 4 (`tailwindcss` e `@tailwindcss/postcss`)
- Supabase (`@supabase/supabase-js` e `@supabase/ssr`)
- Zod
- Satori, `@resvg/resvg-js`, `html-to-image` e `jszip`
- ESLint 9 com `eslint-config-next` 16.4.3

## Como rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e substitua os placeholders. O script `scripts/seed-templates.ts` lê `.env.local` e, se esse arquivo não existir, `.env`. O `.gitignore` ignora `.env*`, exceto `.env.example`.

   | Variável | Papel |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (client e servidor) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima pública |
   | `SUPABASE_SERVICE_ROLE_KEY` | Chave service role, só no servidor |
   | `NEXT_PUBLIC_APP_URL` | URL da aplicação; o exemplo usa `http://localhost:3000` |

   Aplique no projeto Supabase o SQL de `supabase/migrations/0001_schema_v4.sql` e `supabase/migrations/0002_posts_integrity.sql`. Não há script npm para isso.

3. Suba o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   O script executa `next dev`.

Outros scripts do `package.json`:

- `npm run build` — `next build`
- `npm run start` — `next start` (depois do build)
- `npm run lint` — `eslint`

Os arquivos em `scripts/` (`seed-templates.ts`, `test-phase1.mjs` a `test-phase7.mjs` e `test-brand-logos.mjs`) não têm entrada no `package.json`.

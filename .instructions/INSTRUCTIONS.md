# SocialPack — Manual de Engenharia, Segurança e Design System (Antigravity)
**Versão:** 4.0  
**Status:** Oficial  
**Público-Alvo:** Agentes de Engenharia Autônoma (Antigravity / Codex) e Desenvolvedores Sênior.

---

## 1. Princípios Inegociáveis do Projeto

```text
1. SEGURANÇA PRIMORDIAL (Zero Trust, Defesa em Profundidade, RLS Obrigatório, Isolamento de Secrets).
2. DESIGN SYSTEM ULTRA-REFINADO (Linear / Apple Dark Mode Native, Luminance Stacking, Tipografia Inter cv01/ss03).
3. ARQUITETURA DETERMINÍSTICA (Zero dependência de IA externa em runtime, templates por nicho, custo fixo zero).
4. EXECUÇÃO FOCADA (Executar fase a fase com validação rigorosa, sem saltar etapas e sem escopo especulativo).
```

---

## 2. Invariantes de Segurança & Conformidade (Prioridade Absoluta)

Toda linha de código gerada pelo agente DEVE obedecer a estes 7 mandamentos de segurança:

1. **Isolamento de Segredos (`server-only`):**
   * A chave `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** pode ser importada, referenciada ou enviada para o cliente/navegador.
   * Arquivos com acesso administrativo devem incluir obrigatoriamente `import 'server-only';`.
   * No cliente, apenas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são permitidos via `@supabase/ssr`.

2. **Row Level Security (RLS) & Defesa em Profundidade:**
   * 100% das tabelas do banco (`profiles`, `subscriptions`, `companies`, `templates`, `posts`) possuem RLS habilitado.
   * Toda política de `UPDATE` deve conter explicitamente `USING ((select auth.uid()) = ...) WITH CHECK ((select auth.uid()) = ...)` para impedir usurpação de registros.
   * O cliente (`authenticated`) **NÃO POSSUI GRANT DE INSERT OU DELETE** na tabela `public.posts`. Criação e exclusão são orquestradas unicamente pelo backend.

3. **Conformidade de Pagamentos & Dados Sensíveis (PCI-DSS):**
   * **NUNCA** armazene números de cartão de crédito, datas de validade ou CVV no PostgreSQL/Supabase.
   * Armazene apenas identificadores opacos do gateway (`gateway_customer_id`, `gateway_subscription_id`) e metadados inofensivos (`plan`, `status`, `current_period_end`).

4. **Controle Atômico de Cotas (Anti-Race Condition):**
   * A cota de empresas (Starter = 1; Pro = 3) é aplicada via gatilho no PostgreSQL (`enforce_company_quota`) com `FOR UPDATE` sobre a assinatura. Duas requisições paralelas jamais poderão furar o limite.
   * A validade temporal da assinatura (`current_period_end > now()`) e status (`active` ou `trialing`) é requisito obrigatório antes de permitir qualquer cadastro de empresa ou geração de arte.

5. **Prevenção de Arquivos Órfãos no Supabase Storage:**
   * O bucket `generated-arts` é estritamente **privado** (`public = false`).
   * A política de leitura do bucket valida se o primeiro segmento do caminho é exatamente o UID do usuário (`(storage.foldername(name))[1] = (select auth.uid())::text`).
   * A exclusão de posts é orquestrada no backend: o arquivo PNG no Storage é apagado antes da remoção da linha no banco. Se o banco falhar, o arquivo é mantido; se o storage falhar, o banco não apaga.

6. **Validação de Fronteira com Zod:**
   * Nenhum dado externo (body de requisição, Server Action args, JSONB do banco) entra no sistema sem validação de esquema estrita com Zod (`CreateCompanyInputSchema`, `TemplateLayoutStructureSchema`).
   * Arrays de cores devem respeitar a regex `^#[0-9A-Fa-f]{6}$` e estados devem ser UFs brasileiras válidas (`^[A-Z]{2}$`).

7. **Tratamento Seguro de Erros (Sem Information Leakage):**
   * Stack traces de banco de dados, URLs internas ou chaves JWT jamais devem ser retornados para a UI. Toda mensagem de erro em `posts.error_message` deve passar pela função de sanitização (`sanitizePublicErrorMessage`).

---

## 3. Diretrizes Rigorosas de Design System (Linear / Apple)

> **AVISO AO AGENTE:** Evite interfaces genéricas de IA (como fundos roxos vibrantes, glassmorphism excessivo e ilegível, sombras borradas, botões arredondados demais sem propósito, ou bordas brancas grossas). O padrão visual do SocialPack é minimalista, cirúrgico, escuro nativo e projetado para alta legibilidade.

### 3.1 Paleta de Cores & Tokens de Superfície (Luminance Stacking)
No tema escuro, a elevação **não é feita com sombras pretas** (invisíveis no escuro), mas pelo escalonamento sutil da luminância do fundo e bordas translúcidas.

| Token | Hex / Valor | Uso Exclusivo |
|---|---|---|
| **Marketing Canvas** | `#08090A` | Fundo principal da aplicação (quase preto puro com tom frio imperceptível). |
| **Panel Dark** | `#0F1011` | Fundo de sidebars, painéis recessed e inputs. |
| **Surface Level 2** | `rgba(255, 255, 255, 0.02)` | Fundo padrão de cartões e artigos na página. |
| **Surface Hover** | `rgba(255, 255, 255, 0.04)` | Estado hover e elevação tátil. |
| **Border Subtle** | `rgba(255, 255, 255, 0.06)` | Linhas divisórias internas, grids e separadores de abas. |
| **Border Standard** | `rgba(255, 255, 255, 0.08)` | Bordas externas de cartões, formulários e modais. |
| **Border Focus** | `rgba(255, 255, 255, 0.14)` | Hover / Foco secundário. |
| **Brand Indigo** | `#5E6AD2` | **Única cor cromática do sistema:** botões primários de CTA e destaques ativos. |
| **Brand Accent** | `#7170FF` | Links interativos e estados de seleção. |
| **Brand Hover** | `#828FFF` | Hover sobre elementos interativos indigo. |
| **Text Primary** | `#F7F8F8` | Títulos e textos de alta ênfase (nunca use `#FFFFFF` puro no corpo). |
| **Text Secondary** | `#D0D6E0` | Texto de leitura regular e descrições. |
| **Text Muted** | `#8A8F98` | Metadados, labels e placeholders. |
| **Status Active** | `#10B981` | Pílulas de sucesso e indicador de plano ativo. |

### 3.2 Tipografia de Alta Precisão (Inter Variable)
* **Família:** `Inter Variable`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`.
* **OpenType Features Obrigatórias:** `font-feature-settings: "cv01", "ss03";` ativado globalmente no body (produz caracteres geométricos mais limpos, assinatura da Linear).
* **Pesos Tipográficos:**
  * `400` (Regular): Leitura longa e descrições.
  * `510` (Medium Linear): O peso assinatura entre regular e medium para botões, inputs, abas e navegação.
  * `590` / `600` (Semibold): Títulos de seções e ênfase.
* **Tracking Negativo Rigoroso (Display):**
  * Títulos de 72px: `letter-spacing: -1.58px`
  * Títulos de 48px: `letter-spacing: -1.05px`
  * Títulos de 24px a 32px: `letter-spacing: -0.5px`
  * Corpo (14px a 16px): `letter-spacing: -0.011em`

### 3.3 Regras de Componentes
1. **Botões:**
   * **Primário:** Fundo `#5E6AD2`, texto `#FFFFFF`, `border-radius: 6px`, altura `36px` ou `40px`, sem sombras pesadas.
   * **Secundário (Ghost):** Fundo `rgba(255, 255, 255, 0.02)`, borda `1px solid rgba(255, 255, 255, 0.08)`, texto `#D0D6E0`, hover para `rgba(255, 255, 255, 0.05)`.
2. **Inputs & Seletores:**
   * Fundo `#0F1011`, borda `1px solid rgba(255, 255, 255, 0.08)`, texto `#F7F8F8`, foco `border-[#5E6AD2]`. Sem glow azul exagerado.
3. **Cartões:**
   * Fundo translúcido `rgba(255, 255, 255, 0.02)`, borda `1px solid rgba(255, 255, 255, 0.08)`, `border-radius: 8px` ou `12px`.
   * **Anti-Pattern Proibido:** Jamais aninhar cartões dentro de cartões dentro de cartões (*cards-inside-cards-inside-cards*). Use espaçamento e divisores sutis em vez de criar novas caixas.

---

## 4. Roteiro de Implementação das 7 Fases

```text
FASE 1: Fundação & Setup (Dependências, Next.js, Clientes Supabase & Middleware)
   ↓
FASE 2: Banco de Dados & Catálogo de Presets (Schema V4 & Seed no Supabase)
   ↓
FASE 3: Autenticação & Entrada (Landing Page `/`, `/cadastro`, `/login`)
   ↓
FASE 4: Gestão de Perfis de Empresas (`/perfil` — CRUD, Cores & Cotas)
   ↓
FASE 5: Motor de Geração Determinística (`/geracao/instagram/posts` — Satori & Download)
   ↓
FASE 6: Histórico & Gestão de Arquivos (`/geracao/historico` — Bucket Privado & Exclusão)
   ↓
FASE 7: Painel de Configurações (`/configuracoes` — 3 Abas, Assinatura & Theming)
```

### Detalhamento das Fases

#### FASE 1: Fundação & Setup
* **Alvo:** Instalação limpa de dependências e configuração do runtime.
* **Tarefas:**
  1. Criar `package.json` com `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `satori`, `@resvg/resvg-js`, `tailwindcss`.
  2. Configurar `next.config.ts` com `images.remotePatterns` para `images.unsplash.com` e `*.supabase.co`.
  3. Criar `src/lib/supabase/client.ts` (sessão `@supabase/ssr`) e `src/lib/supabase/admin.ts` (`service_role` com `import 'server-only'`).
  4. Implementar `src/middleware.ts` protegendo as rotas privadas `/perfil`, `/geracao/:path*` e `/configuracoes`.
* **Critério de Aceite:** `npm run dev` roda perfeitamente; rotas privadas redirecionam para `/login`.

#### FASE 2: Banco de Dados & Catálogo (Seed)
* **Alvo:** Executar a migração V4 e carregar os templates determinísticos.
* **Tarefas:**
  1. Executar o script consolidado `schema_supabase-v4.sql` no banco Supabase.
  2. Executar `test_supabase_security-v2.sql` para validar que cotas e permissões passam com 100% de sucesso.
  3. Criar script `scripts/seed-templates.ts` lendo `content/catalog.json` e `content/templates/**/*.json` para popular `public.templates`.
* **Critério de Aceite:** Tabelas criadas, bucket `generated-arts` configurado e catálogo de 36 nichos consultável via SQL.

#### FASE 3: Autenticação & Fluxo de Entrada
* **Alvo:** Landing Page oficial e páginas de login/cadastro conectadas ao Supabase Auth.
* **Tarefas:**
  1. Implementar Landing Page (`app/page.tsx`) com hero dark fullscreen, rotação de artes e cards comparativos dos planos Starter (R$ 49,90) e Pro (R$ 97,00).
  2. Implementar `app/cadastro/page.tsx` e `app/login/page.tsx` com formulários acessíveis.
  3. No cadastro, repassar `full_name` e `phone` no `raw_user_meta_data` do Supabase para acionar o trigger `handle_new_user()`.
* **Critério de Aceite:** Novo cadastro cria o usuário no Auth, aciona o trigger em `public.profiles` e autentica via cookie `HttpOnly`.

#### FASE 4: Gestão de Perfis de Empresas (`/perfil`)
* **Alvo:** Interface modular e Server Actions para cadastro de empresas.
* **Tarefas:**
  1. Construir `app/perfil/page.tsx` com o grid de cartões de empresas e slot tracejado para nova empresa.
  2. Criar modal de criação com seletores encadeados de Segmento ➔ Nicho, UF (2 letras) e Cidade.
  3. Integrar com `createCompanyAction` mapeando o erro `P0003` para disparar o modal de Upsell do Plano Pro quando o Starter tentar a 2ª empresa.
* **Critério de Aceite:** Usuário Starter cadastra 1 empresa com sucesso e é bloqueado ao tentar a 2ª com mensagem amigável de upgrade.

#### FASE 5: Motor de Geração Determinística (`/geracao/instagram/posts`)
* **Alvo:** Renderização das 7 artes semanais com Satori e download instantâneo.
* **Tarefas:**
  1. Implementar `app/geracao/instagram/posts/page.tsx` com seletor de empresa ativa no topo.
  2. Conectar a função pura `generateWeek()` (lendo os templates em `/content/templates` e fotos curadas do Unsplash).
  3. Criar Route Handler `app/api/generate/weekly/route.ts` (`export const maxDuration = 60`) executando o orquestrador `generateWeeklyPackOrchestrator`.
  4. Implementar download individual via URL assinada e download do pacote completo em ZIP.
* **Critério de Aceite:** 7 imagens geradas em PNG 1080×1080px com a paleta da empresa aplicada, sem erros de timeout e sem uso de IA externa.

#### FASE 6: Histórico & Gestão Segura (`/geracao/historico`)
* **Alvo:** Consulta de postagens salvas e exclusão sem arquivos órfãos.
* **Tarefas:**
  1. Construir `app/geracao/historico/page.tsx` com seleção de aplicativo (Instagram ativo; YouTube e TikTok com status "Em breve").
  2. Construir `app/geracao/historico/instagram/page.tsx` exibindo a galeria de artes geradas com filtro por empresa e data.
  3. Conectar a Server Action `deletePostOrchestratedAction`, removendo o arquivo do Storage antes de apagar o registro no banco.
* **Critério de Aceite:** Ao excluir um post, o registro desaparece da lista e o arquivo PNG é comprovadamente deletado do bucket `generated-arts`.

#### FASE 7: Painel de Configurações (`/configuracoes`)
* **Alvo:** Gestão de assinatura, dados cadastrais e tema.
* **Tarefas:**
  1. Construir `app/configuracoes/page.tsx` estruturada em 3 abas acessíveis:
     * **Aba 1 (Plano & Custos):** Exibição do plano ativo, barra de progresso da cota de empresas (ex.: 2 de 3) e botões de upgrade/cancelamento.
     * **Aba 2 (Configurações da Conta):** Edição de nome/WhatsApp e exibição protegida do e-mail.
     * **Aba 3 (Aparência):** Alternância entre Tema Escuro (`#08090a`) e Tema Claro através de classes e variáveis CSS.
* **Critério de Aceite:** Abas alternam sem recarregar a tela; troca de tema reativa e dados salvos no Supabase.

---

## 5. Arquivos de Referência e Invariantes

Ao executar as fases, o agente deve consultar e manter os seguintes arquivos canônicos:
* `schema_supabase-v4.sql` — Fonte de verdade do banco de dados e políticas RLS.
* `test_supabase_security-v2.sql` — Bateria de testes de segurança automatizada.
* `socialpack-schemas.ts` — Contratos de tipos Zod para templates e configs.
* `satori-template-pilot.tsx` — Motor de renderização JSX compatível com o Satori.
* `socialpack-supabase-clients.ts` — Inicialização segura dos clientes Supabase.
* `socialpack-backend-actions.ts` — Server Actions e orquestração backend.
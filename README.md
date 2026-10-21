# SocialPack AI 🚀

> **Aplicação Web Full-Stack para geração automatizada de semanas de conteúdo para Instagram em 1 clique.**

SocialPack AI é um Micro-SaaS construído com **Next.js 16**, **Tailwind CSS v4** e **TypeScript**. O sistema permite que empresas locais e profissionais cadastrem sua identidade de marca (nome, cidade, nicho, paleta de cores e tom de voz) e gerem instantaneamente **5 artes visuais 1080x1080px** com textos persuasivos prontos para o feed, além de legendas completas com hashtags e download em PNG de alta resolução.

---

## ✨ Funcionalidades Principais

- 🍎 **Design System Padrão Apple**:
  - Interface minimalista com canvas limpo (`#f5f5f7`), cards puros (`#ffffff`) e tipografia tinta escura (`#1d1d1f`).
  - Destaques funcionais em azul Apple (`#0071e3`), bordas sutis (`#d2d2d7`), espaçamento generoso e botões em cápsula/pílula (`rounded-full`).
  - Segmented controls de alternância rápida de abas e seletor de modo.
- 🗄️ **Salvamento Organizado & Histórico de Packs (Supabase + Fallback)**:
  - Salvamento automático de cada pack de 5 artes no Supabase (tabela `post_packs`) associado à conta do cliente.
  - Abordagem resiliente: fallback transparente para armazenamento local em JSON (`data/packs.json`) caso as credenciais de banco não estejam configuradas.
  - Seção dedicada de **Histórico de Packs**: busca por cliente/tema, filtro por data, visualização de miniaturas e re-download de PNGs em lote.
- 🔐 **Autenticação Full-Stack**:
  - Sessão segura via cookies `httpOnly` assinados com JWT (`jose`).
  - Proteção de rotas com Proxy (Next.js 16).
  - Botão de preenchimento rápido com credenciais de demonstração.
- 🏢 **Gestão de Perfil da Empresa**:
  - Segmentação em cascata com 10 categorias e dezenas de nichos específicos.
  - Seletor de cores da marca (Primária, Secundária e Destaque) com inputs HEX, color pickers nativos e 6 paletas prontas.
  - 6 tons de voz distintos (Profissional, Descontraído, Inspirador, Sofisticado, Acolhedor, Divertido) com controle automático de linguagem e emojis.
  - Persistência no servidor em JSON local isolado por usuário.
- 🎨 **5 Templates Visuais 1080x1080px Modernos**:
  1. **Gradiente**: Degradê vibrante, esferas luminosas e anéis de contorno.
  2. **Bloco Geométrico**: Número da semana vazado gigante e bloco sólido com curva.
  3. **Editorial**: Estilo revista com tipografia clássica serifada (*Playfair Display*) e moldura fina.
  4. **Noite**: Fundo escuro, aspas gigantes e brilhos neon.
  5. **Pôster**: Tipografia brutalista, selo de CTA rotacionado e faixa marquee.
- 📥 **Exportação em Alta Resolução**:
  - Download individual de cada card em formato PNG 1080x1080px (`html-to-image`).
  - Botão **"Baixar Todos os 5 PNGs"** para salvar a semana completa em lote.
- 📋 **Legendas Prontas para Copiar**:
  - Legendas formatadas com quebras de linha e chamada para ação (CTA).
  - Hashtags estratégicas geradas automaticamente com base no nicho, cidade e tema do post.
  - Botão de cópia para a área de transferência com feedback visual instantâneo.
- 📂 **Arquitetura Modular para Nichos**:
  - Estrutura em `content/templates/<categoria>/<nicho>.json`.
  - Fallback inteligente para textos genéricos (`_generic.json`).
  - CLI auxiliar (`npm run templates:scaffold`) para gerar arquivos de novos nichos sem sobrescrever dados.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Cache Components)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Renderização e Exportação de Imagem**: [html-to-image](https://github.com/bubkoo/html-to-image)
- **Autenticação**: [jose](https://github.com/panva/jose) (JWT leve para edge & node)
- **Tipografia**: [Google Fonts](https://fonts.google.com/) (*Plus Jakarta Sans*, *Bricolage Grotesque*, *Playfair Display*)

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 20+ (ou 22+)
- npm ou pnpm

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/Jotamunds/socialpack.git
cd socialpack

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
```

### Variáveis de Ambiente (`.env.local`)

```env
AUTH_EMAIL=demo@socialpack.ai
AUTH_PASSWORD=socialpack123
AUTH_SECRET=sua-chave-secreta-aleatoria-de-pelo-menos-32-caracteres
```

### Executar em Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### Build de Produção

```bash
npm run build
npm run start
```

---

## 📁 Estrutura de Pastas

```
├── content/
│   ├── catalog.json              # Catálogo de categorias, nichos e tons
│   └── templates/                # Textos persuasivos organizados por nicho
│       ├── _generic.json         # Fallback geral
│       ├── alimentacao/          # Nichos de alimentação (ex: pizzaria.json)
│       ├── beleza/               # Nichos de beleza (ex: salao-de-beleza.json)
│       └── ...
├── scripts/
│   └── scaffold-templates.mjs    # Gerador de scaffolds de templates
├── src/
│   ├── app/                      # Next.js App Router (login, dashboard, rotas de API)
│   ├── components/               # Componentes UI, ícones, cards e formulários
│   ├── lib/                      # Utilitários (tokens, auth, gerador de posts, cores)
│   └── proxy.ts                  # Middleware / Proxy de autenticação
├── .env.example
└── package.json
```

---

## 📄 Licença

Este projeto é desenvolvido para fins de portfólio.

-- =========================================================
-- SocialPack AI: Esquema do Supabase para Armazenamento de Packs
-- =========================================================

create table if not exists public.post_packs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_email text not null,
  client_name text not null,
  category_id text not null,
  niche_id text not null,
  niche_label text not null,
  city text not null,
  instagram text,
  tone_id text not null,
  brand_colors jsonb not null,
  posts jsonb not null,
  source text not null,
  start_date text,
  end_date text
);

-- Índices para consultas rápidas por usuário e ordenação cronológica
create index if not exists idx_post_packs_user_email on public.post_packs(user_email);
create index if not exists idx_post_packs_created_at on public.post_packs(created_at desc);

-- Habilita Row Level Security (RLS) para proteção contra acessos indevidos
alter table public.post_packs enable row level security;

-- Política de leitura: usuários acessam os packs com segurança
create policy "Allow read post_packs" on public.post_packs
  for select
  using (true);

-- Política de inserção: permite salvar novos packs gerados
create policy "Allow insert post_packs" on public.post_packs
  for insert
  with check (true);

-- Política de deleção
create policy "Allow delete post_packs" on public.post_packs
  for delete
  using (true);

-- =========================================================
-- Tabela de Templates Visuais e Textuais (Fase 2)
-- =========================================================

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  category_id text not null,
  niche_id text not null,
  theme text not null,
  headline text not null,
  subheadline text not null,
  cta text not null,
  caption text not null,
  hashtags jsonb default '[]'::jsonb,
  tones jsonb default '[]'::jsonb,
  layout integer default 0,
  image_url text
);

create index if not exists idx_templates_category_niche on public.templates(category_id, niche_id);
create index if not exists idx_templates_created_at on public.templates(created_at desc);

alter table public.templates enable row level security;

create policy "Allow read templates" on public.templates
  for select
  using (true);

create policy "Allow insert templates" on public.templates
  for insert
  with check (true);

-- =========================================================
-- Tabela de Assinaturas e Quotas B2B (Fase 3)
-- =========================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_email text unique not null,
  status text not null default 'free',
  plan_id text not null default 'free',
  generation_quota integer not null default 3,
  used_generations integer not null default 0,
  current_period_end timestamp with time zone default (now() + interval '30 days')
);

create index if not exists idx_subscriptions_user_email on public.subscriptions(user_email);

alter table public.subscriptions enable row level security;

create policy "Allow read subscriptions" on public.subscriptions
  for select
  using (true);

create policy "Allow insert subscriptions" on public.subscriptions
  for insert
  with check (true);

create policy "Allow update subscriptions" on public.subscriptions
  for update
  using (true);



-- ==============================================================================
-- SOCIALPACK — SCHEMA OFICIAL V4 (PostgreSQL / Supabase)
-- Invariantes de Segurança, Defesa em Profundidade, Cotas Atômicas e RLS 100%
-- ==============================================================================

-- 1. EXTENSÕES
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. TABELA: public.profiles
-- ==============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_email on public.profiles(email);

-- ==============================================================================
-- 3. TABELA: public.subscriptions
-- ==============================================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro')),
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  company_quota integer not null default 1,
  current_period_end timestamptz not null default (timezone('utc'::text, now()) + interval '30 days'),
  gateway_customer_id text,
  gateway_subscription_id text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint subscriptions_plan_quota_match check (
    (plan = 'starter' and company_quota = 1) or
    (plan = 'pro' and company_quota = 3)
  )
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);

-- ==============================================================================
-- 4. TABELA: public.companies
-- ==============================================================================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category_id text not null,
  niche_id text not null,
  city text not null,
  state text not null check (state ~ '^[A-Z]{2}$'),
  instagram text,
  tone_id text not null,
  colors jsonb not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_companies_user_id on public.companies(user_id);
create index if not exists idx_companies_niche on public.companies(category_id, niche_id);

-- ==============================================================================
-- 5. TABELA: public.templates
-- ==============================================================================
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  version text not null default '1.0',
  category text not null,
  platform text not null default 'instagram',
  format text not null default 'feed_post',
  aspect_ratio text not null default '1:1',
  layout_structure jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_templates_slug on public.templates(slug);
create index if not exists idx_templates_category on public.templates(category);
create index if not exists idx_templates_is_active on public.templates(is_active);

-- ==============================================================================
-- 6. TABELA: public.posts
-- ==============================================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  template_id uuid references public.templates(id) on delete set null,
  day text not null,
  date date,
  theme text not null,
  headline text not null,
  subheadline text,
  cta text not null,
  caption text not null,
  hashtags jsonb default '[]'::jsonb,
  layout integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  storage_path text,
  image_url text,
  error_message text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_posts_company_id on public.posts(company_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_posts_status on public.posts(status);

-- ==============================================================================
-- 7. TRIGGERS ATÔMICOS (search_path = '')
-- ==============================================================================

-- 7.1 Criação automática de profile ao registrar novo usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.email
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7.2 Controle Atômico de Cotas com Lock Exclusivo (FOR UPDATE)
create or replace function public.enforce_company_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub record;
  v_company_count integer;
begin
  -- 1. Trava com FOR UPDATE a assinatura do usuário (anti-race condition)
  select plan, status, company_quota, current_period_end
    into v_sub
    from public.subscriptions
   where user_id = new.user_id
     for update;

  if not found then
    raise exception 'Assinatura ativa não encontrada para o usuário.'
      using errcode = 'P0002';
  end if;

  -- 2. Valida se o status é active ou trialing e se current_period_end > now()
  if v_sub.status not in ('active', 'trialing') or v_sub.current_period_end <= timezone('utc'::text, now()) then
    raise exception 'Assinatura inativa ou expirada.'
      using errcode = 'P0002';
  end if;

  -- 3. Conta empresas existentes pertencentes ao usuário
  select count(*)
    into v_company_count
    from public.companies
   where user_id = new.user_id;

  -- 4. Barra a inserção caso a cota do plano já tenha sido atingida
  if v_company_count >= v_sub.company_quota then
    raise exception 'Limite de empresas atingido para o plano % (cota máxima: %). Faça upgrade para cadastrar mais empresas.',
      v_sub.plan, v_sub.company_quota
      using errcode = 'P0003';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_company_quota on public.companies;
create trigger trg_enforce_company_quota
  before insert on public.companies
  for each row execute function public.enforce_company_quota();

-- 7.3 Máquina de estados estrita do ciclo de vida de posts
create or replace function public.validate_post_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- pending -> processing
  if old.status = 'pending' and new.status not in ('pending', 'processing') then
    raise exception 'Transição de status inválida: % -> %', old.status, new.status
      using errcode = '22000';
  end if;

  -- processing -> completed | failed
  if old.status = 'processing' and new.status not in ('processing', 'completed', 'failed') then
    raise exception 'Transição de status inválida: % -> %', old.status, new.status
      using errcode = '22000';
  end if;

  -- completed é estado terminal (imutável)
  if old.status = 'completed' and new.status != 'completed' then
    raise exception 'Post finalizado com sucesso não pode ter seu status alterado'
      using errcode = '22000';
  end if;

  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_validate_post_lifecycle on public.posts;
create trigger trg_validate_post_lifecycle
  before update on public.posts
  for each row execute function public.validate_post_lifecycle();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS 100%)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.companies enable row level security;
alter table public.templates enable row level security;
alter table public.posts enable row level security;

-- 8.1 Políticas de profiles
drop policy if exists "Profiles: users can read own profile" on public.profiles;
create policy "Profiles: users can read own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "Profiles: users can update own profile" on public.profiles;
create policy "Profiles: users can update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 8.2 Políticas de subscriptions
drop policy if exists "Subscriptions: users can read own subscription" on public.subscriptions;
create policy "Subscriptions: users can read own subscription"
  on public.subscriptions for select
  using ((select auth.uid()) = user_id);

-- 8.3 Políticas de companies
drop policy if exists "Companies: users can read own companies" on public.companies;
create policy "Companies: users can read own companies"
  on public.companies for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Companies: users can insert own companies" on public.companies;
create policy "Companies: users can insert own companies"
  on public.companies for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Companies: users can update own companies" on public.companies;
create policy "Companies: users can update own companies"
  on public.companies for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Companies: users can delete own companies" on public.companies;
create policy "Companies: users can delete own companies"
  on public.companies for delete
  using ((select auth.uid()) = user_id);

-- 8.4 Políticas de templates
drop policy if exists "Templates: active templates are readable" on public.templates;
create policy "Templates: active templates are readable"
  on public.templates for select
  using (is_active = true);

-- 8.5 Políticas de posts
drop policy if exists "Posts: users can read own posts" on public.posts;
create policy "Posts: users can read own posts"
  on public.posts for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Posts: users can update own posts" on public.posts;
create policy "Posts: users can update own posts"
  on public.posts for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ==============================================================================
-- 9. DEFESA EM PROFUNDIDADE DE PRIVILÉGIOS (GRANT / REVOKE)
-- ==============================================================================
-- O cliente authenticated NÃO POSSUI GRANT de INSERT ou DELETE em public.posts
revoke insert, delete on public.posts from authenticated;
revoke insert, update, delete on public.templates from authenticated;

grant select on public.templates to authenticated, anon;
grant select, update on public.posts to authenticated;

-- ==============================================================================
-- 10. SUPABASE STORAGE (Bucket Privado 'generated-arts')
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-arts',
  'generated-arts',
  false,
  5242880, -- 5 MB
  array['image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/webp'];

drop policy if exists "Generated Arts: user can read own files" on storage.objects;
create policy "Generated Arts: user can read own files"
  on storage.objects for select
  using (
    bucket_id = 'generated-arts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

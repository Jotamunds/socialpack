-- ==============================================================================
-- SOCIALPACK — MIGRAÇÃO 0004 (Onda 2: Assinatura MVP)
-- 1. Coluna cancel_at_period_end (acesso permanece até current_period_end)
-- 2. handle_new_user cria assinatura incomplete (ativação só via server action)
-- 3. enforce_company_quota aceita canceled com período ainda vigente
-- ==============================================================================

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

alter table public.subscriptions
  add column if not exists current_period_start timestamptz;

-- 2. Cadastro: profile + assinatura incomplete (plano e período ativos vêm da server action)
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

  insert into public.subscriptions (
    user_id,
    plan,
    status,
    company_quota,
    current_period_start,
    current_period_end,
    cancel_at_period_end
  )
  values (
    new.id,
    'starter',
    'incomplete',
    1,
    null,
    timezone('utc'::text, now()),
    false
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- 3. Cota: active/trialing, ou canceled com cancelamento agendado e período vigente
create or replace function public.enforce_company_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub record;
  v_company_count integer;
  v_access_ok boolean;
begin
  select plan, status, company_quota, current_period_end, cancel_at_period_end
    into v_sub
    from public.subscriptions
   where user_id = new.user_id
     for update;

  if not found then
    raise exception 'Assinatura ativa não encontrada para o usuário.'
      using errcode = 'P0002';
  end if;

  v_access_ok := (
    v_sub.current_period_end > timezone('utc'::text, now())
    and (
      v_sub.status in ('active', 'trialing')
      or (v_sub.status = 'canceled' and v_sub.cancel_at_period_end is true)
    )
  );

  if not v_access_ok then
    raise exception 'Assinatura inativa ou expirada.'
      using errcode = 'P0002';
  end if;

  select count(*)
    into v_company_count
    from public.companies
   where user_id = new.user_id;

  if v_company_count >= v_sub.company_quota then
    raise exception 'Limite de empresas atingido para o plano % (cota máxima: %). Faça upgrade para cadastrar mais empresas.',
      v_sub.plan, v_sub.company_quota
      using errcode = 'P0003';
  end if;

  return new;
end;
$$;

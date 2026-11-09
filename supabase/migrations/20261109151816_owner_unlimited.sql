-- Dono do app: cria empresas e gera posts sem cota, assinatura ou rate limit.
-- A linha é inserida só se o UID já existe em auth.users. Nenhum outro usuário é alterado.
-- anon/authenticated não inserem, atualizam nem apagam. A função não é executável pela API.

create table if not exists public.app_owners (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz default now()
);

comment on table public.app_owners is
  'Contas sem limite de plano, cota ou rate limit. Escrita só por migration.';

alter table public.app_owners enable row level security;

drop policy if exists "App owners: read own row" on public.app_owners;
create policy "App owners: read own row"
  on public.app_owners
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.app_owners from public, anon, authenticated, service_role;
grant select on table public.app_owners to authenticated, service_role;

create or replace function public.is_app_owner(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_owners
    where user_id = uid
  );
$$;

comment on function public.is_app_owner(uuid) is
  'True apenas quando uid está em app_owners. Gates de limite chamam esta função.';

revoke all on function public.is_app_owner(uuid) from public, anon, authenticated, service_role;

-- Mesma regra de 20261025145459, com retorno antecipado para o dono.
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
  if public.is_app_owner(new.user_id) then
    return new;
  end if;

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

revoke all on function public.enforce_company_quota() from public, anon, authenticated;

insert into public.app_owners (user_id)
select '9e795664-836d-413b-aa36-d17bc919a215'::uuid
where exists (
  select 1
  from auth.users
  where id = '9e795664-836d-413b-aa36-d17bc919a215'::uuid
)
on conflict (user_id) do nothing;

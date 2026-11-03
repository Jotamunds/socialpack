-- Uso direto: cadastrar empresa não depende de plano, status ou período.
-- Tabelas e colunas de cobrança permanecem (histórico). RLS não muda.
-- O teto continua 3 empresas por usuário, serializado por advisory lock.

create or replace function public.enforce_company_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_count integer;
begin
  if new.user_id is null then
    raise exception 'Empresa sem dono.'
      using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  select count(*)
    into v_company_count
    from public.companies
   where user_id = new.user_id;

  if v_company_count >= 3 then
    raise exception 'Limite de empresas atingido (máximo: 3).'
      using errcode = 'P0003';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_company_quota() from public, anon, authenticated;

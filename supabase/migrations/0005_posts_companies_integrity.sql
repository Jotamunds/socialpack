-- ==============================================================================
-- SOCIALPACK — MIGRAÇÃO 0005 (Onda 3: Integridade do banco)
-- FK composta posts→companies, constraints de completed/failed, lifecycle,
-- templates só para authenticated, REVOKE EXECUTE nas funções definer,
-- check hexadecimal em companies.colors.
-- ==============================================================================

-- 1. Dados: limpar posts sem empresa e backfill de campos exigidos em completed/failed
delete from public.posts where company_id is null;

update public.posts
   set image_storage_path = coalesce(image_storage_path, storage_path),
       caption_copy = coalesce(caption_copy, caption),
       generation_config = coalesce(
         generation_config,
         jsonb_build_object('hashtags', coalesce(hashtags, '[]'::jsonb))
       ),
       completed_at = coalesce(completed_at, updated_at, created_at)
 where status = 'completed';

update public.posts
   set error_message = coalesce(error_message, 'Falha registrada sem detalhe.')
 where status = 'failed'
   and error_message is null;

-- 2. companies: unique (id, user_id) para FK composta
do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'companies_id_user_id_key'
       and conrelid = 'public.companies'::regclass
  ) then
    alter table public.companies
      add constraint companies_id_user_id_key unique (id, user_id);
  end if;
end;
$$;

-- 3. companies.colors: objeto com primary/secondary/accent em #RRGGBB
alter table public.companies drop constraint if exists companies_brand_colors_valid;
alter table public.companies
  add constraint companies_brand_colors_valid check (
    jsonb_typeof(colors) = 'object'
    and (colors->>'primary') ~ '^#[0-9A-Fa-f]{6}$'
    and (colors->>'secondary') ~ '^#[0-9A-Fa-f]{6}$'
    and (colors->>'accent') ~ '^#[0-9A-Fa-f]{6}$'
  );

-- 4. posts: company_id obrigatório + FK composta com cascade
alter table public.posts drop constraint if exists posts_company_id_fkey;

alter table public.posts
  alter column company_id set not null;

alter table public.posts
  add constraint posts_company_user_fkey
  foreign key (company_id, user_id)
  references public.companies (id, user_id)
  on delete cascade;

-- 5. Constraints de estado apertadas
alter table public.posts drop constraint if exists posts_completed_integrity;
alter table public.posts
  add constraint posts_completed_integrity check (
    status <> 'completed'
    or (
      image_storage_path is not null
      and caption_copy is not null
      and generation_config is not null
      and completed_at is not null
      and error_message is null
    )
  );

alter table public.posts drop constraint if exists posts_failed_integrity;
alter table public.posts
  add constraint posts_failed_integrity check (
    status <> 'failed'
    or error_message is not null
  );

-- 6. Máquina de estados: pending→failed, failed terminal, identidade imutável
create or replace function public.validate_post_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Colunas de identidade imutáveis após o INSERT
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.company_id is distinct from old.company_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Colunas de identidade do post são imutáveis (id, user_id, company_id, created_at)'
      using errcode = '22000';
  end if;

  -- pending -> pending | processing | failed
  if old.status = 'pending' and new.status not in ('pending', 'processing', 'failed') then
    raise exception 'Transição de status inválida: % -> %', old.status, new.status
      using errcode = '22000';
  end if;

  -- processing -> processing | completed | failed
  if old.status = 'processing' and new.status not in ('processing', 'completed', 'failed') then
    raise exception 'Transição de status inválida: % -> %', old.status, new.status
      using errcode = '22000';
  end if;

  -- completed é estado terminal
  if old.status = 'completed' and new.status is distinct from 'completed' then
    raise exception 'Post finalizado com sucesso não pode ter seu status alterado'
      using errcode = '22000';
  end if;

  -- failed é estado terminal
  if old.status = 'failed' and new.status is distinct from 'failed' then
    raise exception 'Post com falha não pode ter seu status alterado'
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

-- 7. Templates: leitura apenas para authenticated (catálogo proprietário)
revoke select on public.templates from anon;
revoke insert, update, delete on public.templates from authenticated, anon;
grant select on public.templates to authenticated;

drop policy if exists "Templates: active templates are readable" on public.templates;
create policy "Templates: active templates are readable"
  on public.templates for select
  to authenticated
  using (is_active = true);

-- 8. Funções SECURITY DEFINER: sem EXECUTE para anon/authenticated
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.enforce_company_quota() from public, anon, authenticated;
revoke all on function public.validate_post_lifecycle() from public, anon, authenticated;

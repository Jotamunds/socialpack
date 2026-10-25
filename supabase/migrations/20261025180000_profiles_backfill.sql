-- ==============================================================================
-- SOCIALPACK — Backfill de public.profiles para usuários sem linha
-- Colunas conferidas em 0001 e 0006:
--   id (PK, sem default), email/full_name/phone (nullable),
--   created_at/updated_at e theme_preference são NOT NULL com default.
-- theme_preference não entra no insert: o default 'dark' cobre a coluna.
-- Idempotente: NOT EXISTS e ON CONFLICT (id) DO NOTHING.
-- ==============================================================================

insert into public.profiles (id, email, full_name, phone)
select u.id, u.email, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'phone'
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

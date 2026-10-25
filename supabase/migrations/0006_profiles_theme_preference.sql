-- ==============================================================================
-- SOCIALPACK — MIGRAÇÃO 0006 (Onda 6: preferência de tema em profiles)
-- ==============================================================================

alter table public.profiles
  add column if not exists theme_preference text not null default 'dark';

alter table public.profiles drop constraint if exists profiles_theme_preference_check;
alter table public.profiles
  add constraint profiles_theme_preference_check
  check (theme_preference in ('dark', 'light'));

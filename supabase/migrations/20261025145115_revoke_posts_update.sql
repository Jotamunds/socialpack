-- ==============================================================================
-- SOCIALPACK — MIGRAÇÃO 0003 (Onda 1: Storage)
-- Remove UPDATE de authenticated em public.posts.
-- Toda mutação de posts passa pelo backend com service_role após validar a sessão
-- e o prefixo {userId}/ no caminho do Storage.
-- ==============================================================================

drop policy if exists "Posts: users can update own posts" on public.posts;

revoke update on public.posts from authenticated;

grant select on public.posts to authenticated;

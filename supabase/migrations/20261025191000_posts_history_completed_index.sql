-- Índice parcial da listagem do histórico: posts concluídos do usuário,
-- do mais recente para o mais antigo.
-- A consulta sempre filtra user_id + status = 'completed' e ordena created_at.
-- Idempotente. Não altera RLS nem políticas.

create index if not exists idx_posts_user_completed_created_at
  on public.posts (user_id, created_at desc)
  where status = 'completed';

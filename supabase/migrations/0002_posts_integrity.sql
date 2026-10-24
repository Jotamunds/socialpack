-- ==============================================================================
-- SOCIALPACK — MIGRAÇÃO 0002 (Integridade de public.posts para Fase 5)
-- Adiciona colunas complementares e constraints de integridade para a máquina de estados
-- ==============================================================================

alter table public.posts
  add column if not exists image_storage_path text,
  add column if not exists caption_copy text,
  add column if not exists generation_config jsonb,
  add column if not exists completed_at timestamptz;

-- Constraint de integridade de conclusão (posts_completed_integrity)
alter table public.posts drop constraint if exists posts_completed_integrity;
alter table public.posts add constraint posts_completed_integrity check (
  status != 'completed' or (
    (image_storage_path is not null or storage_path is not null) and
    (caption_copy is not null or caption is not null) and
    (generation_config is not null or hashtags is not null) and
    error_message is null
  )
);

-- Constraint de integridade de falha (posts_failed_integrity)
alter table public.posts drop constraint if exists posts_failed_integrity;
alter table public.posts add constraint posts_failed_integrity check (
  status != 'failed' or error_message is not null
);

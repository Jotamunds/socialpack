-- ==============================================================================
-- SOCIALPACK — MIGRAÇÃO 20261026170000 (Códigos estruturados de revisão de Webhook)
-- Adiciona review_code e user_id em billing_webhook_events e seus índices
-- ==============================================================================

-- 1) Colunas novas (aditivas, não destrutivas)
alter table public.billing_webhook_events
  add column if not exists review_code text,
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- 2) Índices para leitura operacional
create index if not exists idx_billing_webhook_events_review
  on public.billing_webhook_events(status, review_code);
create index if not exists idx_billing_webhook_events_user
  on public.billing_webhook_events(user_id);

-- 3) NADA mais. Não alterar acquire_billing_webhook_event (a versão da
--    migration 20261026160000 já trata manual_review como terminal).

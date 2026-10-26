-- ==============================================================================
-- SOCIALPACK — MIGRAÇÃO 20261026160000 (Revisão Manual de Webhooks Asaas)
-- 1. Atualiza constraint de status em public.billing_webhook_events para permitir 'manual_review'
-- 2. Atualiza função acquire_billing_webhook_event para tratar 'manual_review' como estado terminal idempotente
-- ==============================================================================

-- 1. Atualiza constraint de status para incluir 'manual_review'
alter table public.billing_webhook_events
  drop constraint if exists billing_webhook_events_status_check;

alter table public.billing_webhook_events
  add constraint billing_webhook_events_status_check
  check (status in ('processing', 'processed', 'failed', 'manual_review'));

-- 2. Atualiza a função atômica transacional acquire_billing_webhook_event
create or replace function public.acquire_billing_webhook_event(
  p_event_id text,
  p_event_type text,
  p_payload jsonb,
  p_timeout_seconds integer default 60
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_last_attempt timestamptz;
  v_attempts integer;
begin
  -- 1. Tentativa de inserção atômica com ON CONFLICT (id) DO NOTHING
  insert into public.billing_webhook_events (
    id, event, status, payload, attempts, last_attempt_at, created_at
  ) values (
    p_event_id, p_event_type, 'processing', p_payload, 1, timezone('utc'::text, now()), timezone('utc'::text, now())
  )
  on conflict (id) do nothing;

  -- Se a linha foi inserida nesta execução, o lock foi adquirido atomicamente
  if found then
    return 'acquired';
  end if;

  -- 2. Linha já existia:
  select status, last_attempt_at, attempts
  into v_status, v_last_attempt, v_attempts
  from public.billing_webhook_events
  where id = p_event_id
  for update;

  if not found then
    return 'in_progress';
  end if;

  -- Evento já concluído ou em revisão manual terminal: idempotência imediata
  if v_status in ('processed', 'manual_review') then
    return 'already_processed';
  end if;

  -- Evento em processamento ativo dentro da janela de timeout: recusa concorrência
  if v_status = 'processing' then
    if v_last_attempt is not null and (timezone('utc'::text, now()) - v_last_attempt) < (p_timeout_seconds || ' seconds')::interval then
      return 'in_progress';
    end if;
  end if;

  -- Evento 'failed' ou 'processing' expirado (> timeout): retoma processamento atômico
  update public.billing_webhook_events
  set status = 'processing',
      attempts = coalesce(v_attempts, 0) + 1,
      last_attempt_at = timezone('utc'::text, now()),
      payload = p_payload,
      error_message = null
  where id = p_event_id;

  return 'acquired';
end;
$$;

revoke all on function public.acquire_billing_webhook_event(text, text, jsonb, integer) from public, anon, authenticated;
grant execute on function public.acquire_billing_webhook_event(text, text, jsonb, integer) to service_role;

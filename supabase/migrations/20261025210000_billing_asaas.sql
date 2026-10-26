-- ==============================================================================
-- SOCIALPACK — MIGRAÇÃO 20261025210000 (Integração de Cobrança Asaas com Resiliência)
-- 1. Colunas de pending_plan, payment_link_id, payment_url, previous_gateway_subscription_id e pending_checkout_id em public.subscriptions
-- 2. Tabela public.billing_payments com RLS estrita
-- 3. Tabela public.billing_webhook_events com ciclo de vida (processing, processed, failed), last_attempt_at e tentativas
-- 4. Função atômica transacional acquire_billing_webhook_event para concorrência segura
-- ==============================================================================

-- 1. Extensões e ajustes em public.subscriptions
alter table public.subscriptions
  add column if not exists pending_plan text check (pending_plan in ('starter', 'pro')),
  add column if not exists payment_link_id text,
  add column if not exists payment_url text,
  add column if not exists previous_gateway_subscription_id text,
  add column if not exists pending_checkout_id text;

create index if not exists idx_subscriptions_gateway_sub
  on public.subscriptions(gateway_subscription_id);

create index if not exists idx_subscriptions_payment_link
  on public.subscriptions(payment_link_id);

create index if not exists idx_subscriptions_previous_gateway_sub
  on public.subscriptions(previous_gateway_subscription_id);

-- 2. Tabela de pagamentos/faturas (histórico seguro para leitura do usuário)
create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asaas_payment_id text unique not null,
  asaas_subscription_id text,
  asaas_payment_link_id text,
  plan text not null check (plan in ('starter', 'pro')),
  status text not null,
  value numeric(10, 2) not null,
  net_value numeric(10, 2),
  billing_type text,
  invoice_url text,
  due_date date,
  payment_date timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_billing_payments_user_id
  on public.billing_payments(user_id);

create index if not exists idx_billing_payments_asaas_id
  on public.billing_payments(asaas_payment_id);

create index if not exists idx_billing_payments_status
  on public.billing_payments(status);

-- 3. Tabela de eventos de Webhook para garantia de idempotência e recuperação de falhas
create table if not exists public.billing_webhook_events (
  id text primary key, -- Ex: 'evt_05b708f961d739ea7eba7e4db318f621&368604920'
  event text not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  payload jsonb not null,
  error_message text,
  attempts integer not null default 1,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  last_attempt_at timestamptz default timezone('utc'::text, now()) not null,
  processed_at timestamptz
);

-- Garante colunas caso a tabela já tenha sido criada anteriormente sem elas
alter table public.billing_webhook_events
  add column if not exists last_attempt_at timestamptz default timezone('utc'::text, now()) not null,
  add column if not exists error_message text,
  add column if not exists attempts integer default 1 not null,
  add column if not exists processed_at timestamptz;

create index if not exists idx_billing_webhook_events_status
  on public.billing_webhook_events(status);

create index if not exists idx_billing_webhook_events_created_at
  on public.billing_webhook_events(created_at desc);

create index if not exists idx_billing_webhook_events_last_attempt
  on public.billing_webhook_events(last_attempt_at desc);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS 100%) & DEFESA EM PROFUNDIDADE
-- ==============================================================================
alter table public.billing_payments enable row level security;
alter table public.billing_webhook_events enable row level security;

-- Usuários só podem ler seus próprios pagamentos
drop policy if exists "Billing Payments: users can read own payments" on public.billing_payments;
create policy "Billing Payments: users can read own payments"
  on public.billing_payments for select
  using ((select auth.uid()) = user_id);

-- Clientes authenticated e anon NUNCA podem inserir, alterar ou deletar pagamentos
revoke insert, update, delete on public.billing_payments from authenticated, anon;
grant select on public.billing_payments to authenticated;

-- Eventos de webhook não possuem política para usuários comuns (acesso exclusivo service_role)
revoke all on public.billing_webhook_events from authenticated, anon;

-- ==============================================================================
-- 5. FUNÇÃO TRANSACIONAL ATÔMICA PARA AQUISIÇÃO DE PROCESSAMENTO DE WEBHOOK
-- ==============================================================================
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
  select status, last_attempt_at, attempts
  into v_status, v_last_attempt, v_attempts
  from public.billing_webhook_events
  where id = p_event_id
  for update;

  if not found then
    insert into public.billing_webhook_events (
      id, event, status, payload, attempts, last_attempt_at, created_at
    ) values (
      p_event_id, p_event_type, 'processing', p_payload, 1, timezone('utc'::text, now()), timezone('utc'::text, now())
    );
    return 'acquired';
  end if;

  if v_status = 'processed' then
    return 'already_processed';
  end if;

  if v_status = 'processing' then
    if v_last_attempt is not null and (timezone('utc'::text, now()) - v_last_attempt) < (p_timeout_seconds || ' seconds')::interval then
      return 'in_progress';
    end if;
  end if;

  -- Evento failed ou processing expirado: retoma processamento atômico
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


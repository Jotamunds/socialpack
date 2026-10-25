-- ==============================================================================
-- SOCIALPACK — MIGRAÇÃO 20261025210000 (Integração de Cobrança Asaas com Resiliência)
-- 1. Colunas de pending_plan, payment_link_id, payment_url e previous_gateway_subscription_id em public.subscriptions
-- 2. Tabela public.billing_payments com RLS estrita
-- 3. Tabela public.billing_webhook_events com ciclo de vida (processing, processed, failed)
-- ==============================================================================

-- 1. Extensões e ajustes em public.subscriptions
alter table public.subscriptions
  add column if not exists pending_plan text check (pending_plan in ('starter', 'pro')),
  add column if not exists payment_link_id text,
  add column if not exists payment_url text,
  add column if not exists previous_gateway_subscription_id text;

create index if not exists idx_subscriptions_gateway_sub
  on public.subscriptions(gateway_subscription_id);

create index if not exists idx_subscriptions_payment_link
  on public.subscriptions(payment_link_id);

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
  processed_at timestamptz
);

create index if not exists idx_billing_webhook_events_status
  on public.billing_webhook_events(status);

create index if not exists idx_billing_webhook_events_created_at
  on public.billing_webhook_events(created_at desc);

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

-- Rate limit por usuário, janela fixa em UTC.
-- A rota lê user.id em auth.getUser() e chama esta função com a service role.
-- O limite numérico vem do servidor (env opcional). O browser não executa a função,
-- não lê a tabela e não zera o próprio contador.
-- Linhas com mais de 2 dias saem no próprio pedido, só daquele usuário.

create table if not exists public.user_rate_limit_buckets (
  user_id uuid not null references auth.users (id) on delete cascade,
  scope text not null,
  window_seconds integer not null,
  window_start bigint not null,
  hits integer not null,
  primary key (user_id, scope, window_seconds, window_start),
  constraint user_rate_limit_buckets_scope_check
    check (scope in ('weekly_generate', 'history_zip')),
  constraint user_rate_limit_buckets_window_check
    check (window_seconds in (3600, 86400)),
  constraint user_rate_limit_buckets_start_check
    check (window_start >= 0),
  constraint user_rate_limit_buckets_hits_check
    check (hits >= 0 and hits <= 10000)
);

comment on table public.user_rate_limit_buckets is
  'Contadores de rate limit. Sem policy e sem grant para a API; só consume_user_rate_limit grava.';

alter table public.user_rate_limit_buckets enable row level security;

revoke all on table public.user_rate_limit_buckets from public;
revoke all on table public.user_rate_limit_buckets from anon;
revoke all on table public.user_rate_limit_buckets from authenticated;
revoke all on table public.user_rate_limit_buckets from service_role;

create or replace function public.consume_user_rate_limit(
  p_user_id uuid,
  p_scope text,
  p_windows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now_epoch numeric;
  v_item jsonb;
  v_window_text text;
  v_limit_text text;
  v_window_seconds integer;
  v_limit integer;
  v_seconds integer[] := array[]::integer[];
  v_limits integer[] := array[]::integer[];
  v_count integer;
  v_index integer;
  v_bucket bigint;
  v_hits integer;
  v_blocked boolean := false;
  v_retry integer := 0;
  v_remain integer;
begin
  if p_user_id is null then
    raise exception 'rate limit rejected'
      using errcode = '42501';
  end if;

  -- PostgREST preenche auth.role() com a role do JWT. service_role não tem auth.uid().
  if auth.role() is distinct from 'service_role' then
    raise exception 'rate limit rejected'
      using errcode = '42501';
  end if;

  if auth.uid() is not null and auth.uid() is distinct from p_user_id then
    raise exception 'rate limit rejected'
      using errcode = '42501';
  end if;

  if p_scope is null or p_scope not in ('weekly_generate', 'history_zip') then
    raise exception 'rate limit rejected'
      using errcode = '22023';
  end if;

  if p_windows is null or pg_catalog.jsonb_typeof(p_windows) <> 'array' then
    raise exception 'rate limit rejected'
      using errcode = '22023';
  end if;

  v_count := pg_catalog.jsonb_array_length(p_windows);
  if v_count < 1 or v_count > 2 then
    raise exception 'rate limit rejected'
      using errcode = '22023';
  end if;

  for v_item in
    select value
      from pg_catalog.jsonb_array_elements(p_windows)
  loop
    if pg_catalog.jsonb_typeof(v_item) <> 'object' then
      raise exception 'rate limit rejected'
        using errcode = '22023';
    end if;

    v_window_text := v_item ->> 'window_seconds';
    v_limit_text := v_item ->> 'limit';

    if v_window_text is null or v_window_text not in ('3600', '86400') then
      raise exception 'rate limit rejected'
        using errcode = '22023';
    end if;

    if v_limit_text is null or v_limit_text !~ '^[1-9][0-9]{0,4}$' then
      raise exception 'rate limit rejected'
        using errcode = '22023';
    end if;

    v_window_seconds := v_window_text::integer;
    v_limit := v_limit_text::integer;

    if v_limit < 1 or v_limit > 10000 then
      raise exception 'rate limit rejected'
        using errcode = '22023';
    end if;

    if v_window_seconds = any (v_seconds) then
      raise exception 'rate limit rejected'
        using errcode = '22023';
    end if;

    v_seconds := pg_catalog.array_append(v_seconds, v_window_seconds);
    v_limits := pg_catalog.array_append(v_limits, v_limit);
  end loop;

  if pg_catalog.cardinality(v_seconds) <> v_count then
    raise exception 'rate limit rejected'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':' || p_scope, 0)
  );

  v_now_epoch := pg_catalog.date_part('epoch', pg_catalog.now());

  delete from public.user_rate_limit_buckets
   where user_id = p_user_id
     and window_start < pg_catalog.trunc(v_now_epoch)::bigint - 172800;

  for v_index in 1 .. pg_catalog.cardinality(v_seconds) loop
    v_window_seconds := v_seconds[v_index];
    v_limit := v_limits[v_index];
    v_bucket := pg_catalog.trunc(pg_catalog.floor(v_now_epoch / v_window_seconds) * v_window_seconds)::bigint;

    select hits
      into v_hits
      from public.user_rate_limit_buckets
     where user_id = p_user_id
       and scope = p_scope
       and window_seconds = v_window_seconds
       and window_start = v_bucket;

    if found and v_hits >= v_limit then
      v_blocked := true;
      -- greatest é sintaxe do parser; qualificar com pg_catalog quebra a função.
      v_remain := greatest(
        1,
        pg_catalog.ceil(v_window_seconds::numeric - (v_now_epoch - v_bucket))::integer
      );
      if v_remain > v_retry then
        v_retry := v_remain;
      end if;
    end if;
  end loop;

  if v_blocked then
    return pg_catalog.jsonb_build_object(
      'allowed', false,
      'retry_after_seconds', v_retry
    );
  end if;

  for v_index in 1 .. pg_catalog.cardinality(v_seconds) loop
    v_window_seconds := v_seconds[v_index];
    v_bucket := pg_catalog.trunc(pg_catalog.floor(v_now_epoch / v_window_seconds) * v_window_seconds)::bigint;

    insert into public.user_rate_limit_buckets as bucket (
      user_id,
      scope,
      window_seconds,
      window_start,
      hits
    ) values (
      p_user_id,
      p_scope,
      v_window_seconds,
      v_bucket,
      1
    )
    on conflict (user_id, scope, window_seconds, window_start)
    do update set hits = bucket.hits + 1;
  end loop;

  return pg_catalog.jsonb_build_object(
    'allowed', true,
    'retry_after_seconds', 0
  );
end;
$$;

revoke all on function public.consume_user_rate_limit(uuid, text, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.consume_user_rate_limit(uuid, text, jsonb) to service_role;

comment on function public.consume_user_rate_limit(uuid, text, jsonb) is
  'Consome uma unidade do rate limit do usuário. Só service_role. Não zera contador.';

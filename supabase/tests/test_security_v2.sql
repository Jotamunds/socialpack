-- ==============================================================================
-- SOCIALPACK — BATERIA DE TESTES DE SEGURANÇA E INTEGRIDADE (V2 / Onda 4)
-- Compatível com migrations 0001–0005.
-- Executar no SQL Editor ou via CLI. Toda a suíte roda em uma transação e
-- termina com ROLLBACK — nenhum dado de teste permanece no banco.
-- ==============================================================================

begin;

do $$
declare
  v_test_user_id uuid := gen_random_uuid();
  v_company_id uuid;
  v_post_completed_id uuid;
  v_post_failed_id uuid;
  v_caught_p0002 boolean := false;
  v_caught_p0003 boolean := false;
  v_caught_invalid_status boolean := false;
  v_caught_identity boolean := false;
  v_caught_colors boolean := false;
  v_can_insert_posts boolean;
  v_can_update_posts boolean;
  v_can_delete_posts boolean;
  v_anon_select_templates boolean;
  v_anon_exec_handle boolean;
  v_auth_exec_quota boolean;
  v_bucket_is_public boolean;
  v_bucket_size_limit bigint;
  v_brand_colors jsonb := '{"primary":"#5e6ad2","secondary":"#7170ff","accent":"#828fff"}'::jsonb;
begin
  raise notice '=== INICIANDO TESTES DE SEGURANÇA V2 (ONDAS 1–3) ===';

  -- --------------------------------------------------------------------------
  -- FIXTURE: usuário real em auth.users (dispara handle_new_user → incomplete)
  -- --------------------------------------------------------------------------
  insert into auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
  ) values (
    v_test_user_id,
    'authenticated',
    'authenticated',
    'security-test-' || v_test_user_id::text || '@example.invalid',
    crypt('security-test-password', gen_salt('bf')),
    timezone('utc'::text, now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Security Test","phone":"11999999999"}'::jsonb,
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    false,
    false
  );

  -- --------------------------------------------------------------------------
  -- TESTE 1: authenticated sem INSERT / UPDATE / DELETE em public.posts
  -- --------------------------------------------------------------------------
  v_can_insert_posts := has_table_privilege('authenticated', 'public.posts', 'insert');
  v_can_update_posts := has_table_privilege('authenticated', 'public.posts', 'update');
  v_can_delete_posts := has_table_privilege('authenticated', 'public.posts', 'delete');

  if v_can_insert_posts or v_can_update_posts or v_can_delete_posts then
    raise exception
      'FALHA DE SEGURANÇA: authenticated ainda muta posts (insert=%, update=%, delete=%).',
      v_can_insert_posts, v_can_update_posts, v_can_delete_posts;
  end if;

  raise notice '✓ TESTE 1 PASS: authenticated só tem leitura em posts (sem INSERT/UPDATE/DELETE).';

  -- --------------------------------------------------------------------------
  -- TESTE 2: bucket generated-arts privado (5 MB)
  -- --------------------------------------------------------------------------
  select public, file_size_limit
    into v_bucket_is_public, v_bucket_size_limit
    from storage.buckets
   where id = 'generated-arts';

  if v_bucket_is_public is distinct from false then
    raise exception 'FALHA DE SEGURANÇA: Bucket generated-arts não é privado (public = false).';
  end if;

  if v_bucket_size_limit is distinct from 5242880 then
    raise exception 'FALHA DE SEGURANÇA: Limite do bucket incorreto. Esperado 5MB (5242880).';
  end if;

  raise notice '✓ TESTE 2 PASS: Bucket generated-arts é privado com limite de 5MB.';

  -- --------------------------------------------------------------------------
  -- TESTE 3: templates inacessíveis a anon + funções definer sem EXECUTE público
  -- --------------------------------------------------------------------------
  v_anon_select_templates := has_table_privilege('anon', 'public.templates', 'select');
  v_anon_exec_handle := has_function_privilege('anon', 'public.handle_new_user()', 'execute');
  v_auth_exec_quota := has_function_privilege('authenticated', 'public.enforce_company_quota()', 'execute');

  if v_anon_select_templates then
    raise exception 'FALHA DE SEGURANÇA: Role anon possui SELECT em public.templates.';
  end if;

  if v_anon_exec_handle or v_auth_exec_quota then
    raise exception
      'FALHA DE SEGURANÇA: Funções SECURITY DEFINER ainda executáveis (anon handle=%, auth quota=%).',
      v_anon_exec_handle, v_auth_exec_quota;
  end if;

  raise notice '✓ TESTE 3 PASS: Templates e funções definer isolados de anon/authenticated.';

  -- --------------------------------------------------------------------------
  -- TESTE 4: P0002 sem assinatura ativa (usuário nasce incomplete)
  -- --------------------------------------------------------------------------
  begin
    insert into public.companies (
      user_id, name, category_id, niche_id, city, state, tone_id, colors
    ) values (
      v_test_user_id, 'Empresa Sem Assinatura Ativa', 'alimentacao', 'pizzaria',
      'São Paulo', 'SP', 'profissional', v_brand_colors
    );
  exception
    when sqlstate 'P0002' then
      v_caught_p0002 := true;
  end;

  if not v_caught_p0002 then
    raise exception 'FALHA DE SEGURANÇA: Empresa criada com assinatura incomplete (deveria P0002).';
  end if;

  raise notice '✓ TESTE 4 PASS: P0002 emitido para assinatura incomplete.';

  -- --------------------------------------------------------------------------
  -- TESTE 5: Starter cota 1 → segunda empresa P0003 + cores inválidas
  -- --------------------------------------------------------------------------
  update public.subscriptions
     set plan = 'starter',
         status = 'active',
         company_quota = 1,
         cancel_at_period_end = false,
         current_period_start = timezone('utc'::text, now()),
         current_period_end = timezone('utc'::text, now()) + interval '30 days',
         updated_at = timezone('utc'::text, now())
   where user_id = v_test_user_id;

  begin
    insert into public.companies (
      user_id, name, category_id, niche_id, city, state, tone_id, colors
    ) values (
      v_test_user_id, 'Cores Inválidas', 'alimentacao', 'pizzaria',
      'São Paulo', 'SP', 'profissional', '{"primary":"red","secondary":"#7170ff","accent":"#828fff"}'::jsonb
    );
  exception
    when check_violation then
      v_caught_colors := true;
  end;

  if not v_caught_colors then
    raise exception 'FALHA DE SEGURANÇA: companies.colors aceitou hexadecimal inválido.';
  end if;

  insert into public.companies (
    user_id, name, category_id, niche_id, city, state, tone_id, colors
  ) values (
    v_test_user_id, 'Primeira Empresa Starter', 'alimentacao', 'pizzaria',
    'São Paulo', 'SP', 'profissional', v_brand_colors
  ) returning id into v_company_id;

  begin
    insert into public.companies (
      user_id, name, category_id, niche_id, city, state, tone_id, colors
    ) values (
      v_test_user_id, 'Segunda Empresa Bloqueada', 'alimentacao', 'hamburgueria',
      'São Paulo', 'SP', 'descontraido', v_brand_colors
    );
  exception
    when sqlstate 'P0003' then
      v_caught_p0003 := true;
  end;

  if not v_caught_p0003 then
    raise exception 'FALHA DE SEGURANÇA: Starter criou mais de 1 empresa (deveria P0003).';
  end if;

  raise notice '✓ TESTE 5 PASS: Cores inválidas rejeitadas e cota Starter (P0003) validada.';

  -- --------------------------------------------------------------------------
  -- TESTE 6: ciclo de vida — completed com campos obrigatórios + identidade
  -- --------------------------------------------------------------------------
  insert into public.posts (
    user_id, company_id, day, theme, headline, cta, caption, status
  ) values (
    v_test_user_id, v_company_id, 'Segunda, 26/10', 'Promoção',
    'Headline Teste', 'Compre Agora', 'Legenda teste completa', 'pending'
  ) returning id into v_post_completed_id;

  -- pending → completed direto (inválido)
  v_caught_invalid_status := false;
  begin
    update public.posts
       set status = 'completed',
           image_storage_path = v_test_user_id::text || '/' || v_company_id::text || '/' || v_post_completed_id::text || '.png',
           caption_copy = 'Legenda teste completa',
           generation_config = '{"templateSlug":"test","templateVersion":1}'::jsonb,
           completed_at = timezone('utc'::text, now())
     where id = v_post_completed_id;
  exception
    when others then
      v_caught_invalid_status := true;
  end;

  if not v_caught_invalid_status then
    raise exception 'FALHA DE SEGURANÇA: pending → completed direto foi aceito.';
  end if;

  -- pending → processing → completed (com integridade)
  update public.posts
     set status = 'processing'
   where id = v_post_completed_id;

  update public.posts
     set status = 'completed',
         storage_path = v_test_user_id::text || '/' || v_company_id::text || '/' || v_post_completed_id::text || '.png',
         image_storage_path = v_test_user_id::text || '/' || v_company_id::text || '/' || v_post_completed_id::text || '.png',
         caption_copy = 'Legenda teste completa',
         generation_config = jsonb_build_object(
           'templateSlug', 'test',
           'templateVersion', 1,
           'resolvedColors', v_brand_colors,
           'renderedSlots', jsonb_build_object('headline', 'Headline Teste')
         ),
         completed_at = timezone('utc'::text, now()),
         error_message = null
   where id = v_post_completed_id;

  -- completed é terminal
  v_caught_invalid_status := false;
  begin
    update public.posts
       set status = 'failed',
           error_message = 'não deveria'
     where id = v_post_completed_id;
  exception
    when others then
      v_caught_invalid_status := true;
  end;

  if not v_caught_invalid_status then
    raise exception 'FALHA DE SEGURANÇA: post completed teve status alterado.';
  end if;

  -- identidade imutável
  begin
    update public.posts
       set user_id = gen_random_uuid()
     where id = v_post_completed_id;
  exception
    when others then
      v_caught_identity := true;
  end;

  if not v_caught_identity then
    raise exception 'FALHA DE SEGURANÇA: user_id do post foi alterado.';
  end if;

  raise notice '✓ TESTE 6 PASS: completed exige campos e identidade permanece imutável.';

  -- --------------------------------------------------------------------------
  -- TESTE 7: pending → failed válido; failed → processing inválido
  -- --------------------------------------------------------------------------
  insert into public.posts (
    user_id, company_id, day, theme, headline, cta, caption, status
  ) values (
    v_test_user_id, v_company_id, 'Terça, 27/10', 'Falha',
    'Headline Falha', 'Tentar', 'Legenda de falha controlada', 'pending'
  ) returning id into v_post_failed_id;

  update public.posts
     set status = 'failed',
         error_message = 'Falha simulada na suíte de segurança'
   where id = v_post_failed_id;

  if not exists (
    select 1 from public.posts where id = v_post_failed_id and status = 'failed'
  ) then
    raise exception 'FALHA DE SEGURANÇA: pending → failed não foi aceito.';
  end if;

  v_caught_invalid_status := false;
  begin
    update public.posts
       set status = 'processing'
     where id = v_post_failed_id;
  exception
    when others then
      v_caught_invalid_status := true;
  end;

  if not v_caught_invalid_status then
    raise exception 'FALHA DE SEGURANÇA: failed → processing foi aceito (failed deve ser terminal).';
  end if;

  raise notice '✓ TESTE 7 PASS: pending → failed válido; failed → processing bloqueado.';

  raise notice '=== TODOS OS 7 TESTES DE SEGURANÇA PASSARAM (rollback a seguir) ===';
end;
$$;

rollback;

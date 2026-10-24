-- ==============================================================================
-- BATERIA DE TESTES DE SEGURANÇA E INTEGRIDADE DO BANCO DE DADOS (V2)
-- Executar no Supabase SQL Editor para validar conformidade do Schema V4
-- ==============================================================================

do $$
declare
  v_test_user_id uuid := gen_random_uuid();
  v_pro_user_id uuid := gen_random_uuid();
  v_company_id uuid;
  v_post_id uuid;
  v_caught_p0002 boolean := false;
  v_caught_p0003 boolean := false;
  v_caught_invalid_status boolean := false;
  v_can_insert_posts boolean;
  v_can_delete_posts boolean;
  v_bucket_is_public boolean;
  v_bucket_size_limit bigint;
begin
  raise notice '=== INICIANDO TESTES DE SEGURANÇA V2 (SCHEMA V4) ===';

  -- ----------------------------------------------------------------------------
  -- TESTE 1: DEFESA EM PROFUNDIDADE DE PRIVILÉGIOS (REVOKE NA ROLE AUTHENTICATED)
  -- ----------------------------------------------------------------------------
  v_can_insert_posts := has_table_privilege('authenticated', 'public.posts', 'insert');
  v_can_delete_posts := has_table_privilege('authenticated', 'public.posts', 'delete');

  if v_can_insert_posts then
    raise exception 'FALHA DE SEGURANÇA: Role authenticated possui permissão de INSERT em public.posts';
  end if;

  if v_can_delete_posts then
    raise exception 'FALHA DE SEGURANÇA: Role authenticated possui permissão de DELETE em public.posts';
  end if;

  raise notice '✓ TESTE 1 PASS: Role authenticated não possui GRANT de INSERT ou DELETE em posts.';

  -- ----------------------------------------------------------------------------
  -- TESTE 2: CONFIGURAÇÃO DO STORAGE PRIVADO (generated-arts)
  -- ----------------------------------------------------------------------------
  select public, file_size_limit
    into v_bucket_is_public, v_bucket_size_limit
    from storage.buckets
   where id = 'generated-arts';

  if v_bucket_is_public is distinct from false then
    raise exception 'FALHA DE SEGURANÇA: Bucket generated-arts não é privado (public = false).';
  end if;

  if v_bucket_size_limit != 5242880 then
    raise exception 'FALHA DE SEGURANÇA: Limite do bucket incorreto. Esperado 5MB (5242880).';
  end if;

  raise notice '✓ TESTE 2 PASS: Bucket generated-arts é estritamente privado com limite de 5MB.';

  -- ----------------------------------------------------------------------------
  -- TESTE 3: COTAS DE EMPRESA - ERRO P0002 (SEM ASSINATURA ATIVA)
  -- ----------------------------------------------------------------------------
  begin
    insert into public.companies (
      user_id, name, category_id, niche_id, city, state, tone_id, colors
    ) values (
      v_test_user_id, 'Empresa Teste Sem Sub', 'alimentacao', 'pizzaria',
      'São Paulo', 'SP', 'profissional', '{"primary":"#5e6ad2","secondary":"#7170ff","accent":"#828fff"}'::jsonb
    );
  exception
    when sqlstate 'P0002' then
      v_caught_p0002 := true;
  end;

  if not v_caught_p0002 then
    raise exception 'FALHA DE SEGURANÇA: Cadastro de empresa sem assinatura ativa permitida (deveria lançar P0002).';
  end if;

  raise notice '✓ TESTE 3 PASS: Erro P0002 emitido corretamente ao tentar cadastrar empresa sem assinatura ativa.';

  -- ----------------------------------------------------------------------------
  -- TESTE 4: COTAS DE EMPRESA - PLANO STARTER (COTA = 1 EMPRESA, BLOQUEIO P0003)
  -- ----------------------------------------------------------------------------
  -- Criar assinatura Starter válida
  insert into public.subscriptions (
    user_id, plan, status, company_quota, current_period_end
  ) values (
    v_test_user_id, 'starter', 'active', 1, timezone('utc'::text, now()) + interval '30 days'
  );

  -- 1ª Empresa deve ser inserida com sucesso
  insert into public.companies (
    user_id, name, category_id, niche_id, city, state, tone_id, colors
  ) values (
    v_test_user_id, 'Primeira Empresa Starter', 'alimentacao', 'pizzaria',
    'São Paulo', 'SP', 'profissional', '{"primary":"#5e6ad2","secondary":"#7170ff","accent":"#828fff"}'::jsonb
  ) returning id into v_company_id;

  -- 2ª Empresa DEVE falhar com erro P0003
  begin
    insert into public.companies (
      user_id, name, category_id, niche_id, city, state, tone_id, colors
    ) values (
      v_test_user_id, 'Segunda Empresa Bloqueada', 'alimentacao', 'hamburgueria',
      'São Paulo', 'SP', 'descontraido', '{"primary":"#5e6ad2","secondary":"#7170ff","accent":"#828fff"}'::jsonb
    );
  exception
    when sqlstate 'P0003' then
      v_caught_p0003 := true;
  end;

  if not v_caught_p0003 then
    raise exception 'FALHA DE SEGURANÇA: Starter conseguiu cadastrar mais de 1 empresa (deveria lançar P0003).';
  end if;

  raise notice '✓ TESTE 4 PASS: Trava atômica de cota Starter (P0003) validada com sucesso.';

  -- ----------------------------------------------------------------------------
  -- TESTE 5: MÁQUINA DE ESTADOS DO CICLO DE VIDA DO POST (validate_post_lifecycle)
  -- ----------------------------------------------------------------------------
  insert into public.posts (
    user_id, company_id, day, theme, headline, cta, caption, status
  ) values (
    v_test_user_id, v_company_id, 'Segunda, 24/10', 'Promoção',
    'Headline Teste', 'Compre Agora', 'Legenda teste', 'pending'
  ) returning id into v_post_id;

  -- Transição inválida: pending -> completed direto (deve falhar)
  begin
    update public.posts
       set status = 'completed'
     where id = v_post_id;
  exception
    when others then
      v_caught_invalid_status := true;
  end;

  if not v_caught_invalid_status then
    raise exception 'FALHA DE SEGURANÇA: Post avançou de pending para completed diretamente sem passar por processing.';
  end if;

  -- Transição válida: pending -> processing -> completed
  update public.posts set status = 'processing' where id = v_post_id;
  update public.posts set status = 'completed' where id = v_post_id;

  -- Tentativa de alterar post completed (deve falhar)
  v_caught_invalid_status := false;
  begin
    update public.posts
       set status = 'failed'
     where id = v_post_id;
  exception
    when others then
      v_caught_invalid_status := true;
  end;

  if not v_caught_invalid_status then
    raise exception 'FALHA DE SEGURANÇA: Post com status completed foi modificado.';
  end if;

  raise notice '✓ TESTE 5 PASS: Máquina de estados de posts validada contra transições inválidas.';

  -- ----------------------------------------------------------------------------
  -- LIMPEZA DOS REGISTROS DE TESTE
  -- ----------------------------------------------------------------------------
  delete from public.posts where id = v_post_id;
  delete from public.companies where id = v_company_id;
  delete from public.subscriptions where user_id = v_test_user_id;

  raise notice '=== TODOS OS 5 TESTES DE SEGURANÇA FORAM CONCLUÍDOS COM 100%% DE SUCESSO! ===';
end;
$$;

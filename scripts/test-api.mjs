// Comprehensive verification script for SocialPack AI (Phases 1, 2, and 3)
import { Blob } from 'node:buffer';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=====================================================');
  console.log('   SOCIALPACK AI - SUÍTE DE TESTES E2E RIGOROSA      ');
  console.log('=====================================================\n');

  console.log('--- TEST 1: Autenticação Segura (Login) ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@socialpack.ai', password: 'socialpack123' })
  });
  
  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }
  
  const setCookie = loginRes.headers.get('set-cookie');
  console.log('✓ Sessão autenticada via Cookie JWT HttpOnly');
  let cookieHeader = setCookie ? setCookie.split(';')[0] : '';

  console.log('\n--- TEST 2: Upload Seguro de Mídia (POST /api/upload) ---');
  // Cria 1x1 PNG válido em memória
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82
  ]);

  const formData = new FormData();
  const fileBlob = new Blob([pngHeader], { type: 'image/png' });
  formData.append('file', fileBlob, 'foto_produto.png');

  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Cookie': cookieHeader },
    body: formData
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Upload failed (${uploadRes.status}): ${errorText}`);
  }

  const uploadData = await uploadRes.json();
  console.log('✓ Upload concluído com sucesso!');
  console.log('  - Storage:', uploadData.storage);
  console.log('  - URL Pública:', uploadData.url);
  console.log('  - Arquivo Sanitizado:', uploadData.filename);

  console.log('\n--- TEST 3: Consulta de Assinatura & Cota (GET /api/subscription) ---');
  const subRes = await fetch(`${BASE_URL}/api/subscription`, {
    headers: { 'Cookie': cookieHeader }
  });
  if (!subRes.ok) {
    throw new Error(`Get subscription failed (${subRes.status})`);
  }
  const subData = await subRes.json();
  console.log('✓ Status de Assinatura consultado:');
  console.log('  - Plano:', subData.subscription?.planId);
  console.log('  - Status:', subData.subscription?.status);
  console.log('  - Cota Total:', subData.subscription?.generationQuota);
  console.log('  - Gerações Utilizadas:', subData.subscription?.usedGenerations);
  console.log('  - Planos disponíveis:', subData.plans.map(p => p.id).join(', '));
  if (subData.plans.some(p => p.id === 'free')) {
    throw new Error('Erro: Plano gratuito ainda está presente na lista de planos!');
  }
  if (subData.plans.length !== 2) {
    throw new Error(`Esperado exatamente 2 planos oficiais (Starter e Pro), recebido ${subData.plans.length}`);
  }
  console.log('✓ Planos restritos exclusivamente a Starter e Pro!');

  console.log('\n--- TEST 4: Checkout B2B (POST /api/checkout) ---');
  const checkoutRes = await fetch(`${BASE_URL}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify({
      planId: 'pro',
      autoActivate: true
    })
  });
  if (!checkoutRes.ok) {
    throw new Error(`Checkout failed with status ${checkoutRes.status}`);
  }
  const checkoutData = await checkoutRes.json();
  const checkoutSetCookie = checkoutRes.headers.get('set-cookie');
  if (checkoutSetCookie) {
    cookieHeader = checkoutSetCookie.split(';')[0];
  }
  console.log('✓ Checkout processado com sucesso:');
  console.log('  - Order ID:', checkoutData.orderId);
  console.log('  - Status:', checkoutData.status);
  console.log('  - Plano Ativo:', checkoutData.subscription?.planId);

  console.log('\n--- TEST 5: Webhook de Pagamento Seguro (POST /api/webhooks/payment) ---');
  const webhookRes = await fetch(`${BASE_URL}/api/webhooks/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': 'socialpack_webhook_secret_2026'
    },
    body: JSON.stringify({
      event: 'payment.succeeded',
      data: {
        userEmail: 'demo@socialpack.ai',
        planId: 'pro',
        orderId: checkoutData.orderId
      }
    })
  });
  if (!webhookRes.ok) {
    throw new Error(`Webhook failed with status ${webhookRes.status}`);
  }
  const webhookData = await webhookRes.json();
  console.log('✓ Webhook validado e executado com sucesso:');
  console.log('  - Evento:', webhookData.event);
  console.log('  - Status Confirmado:', webhookData.status);
  console.log('  - Cota Atualizada:', webhookData.generationQuota);

  console.log('\n--- TEST 6: Geração de Calendário Editorial de 7 Dias com Verificação de Cota ---');
  const testProfile = {
    name: 'Ateliê do Pão Artesanal',
    city: 'Florianópolis, SC',
    categoryId: 'alimentacao',
    nicheId: 'padaria',
    instagram: 'ateliedopao',
    toneId: 'acolhedor',
    colors: {
      primary: '#4a2c11',
      secondary: '#d9a066',
      accent: '#0071e3'
    }
  };

  const genRes = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify({
      profile: testProfile,
      startDate: '2026-10-26'
    })
  });

  if (!genRes.ok) {
    const errorText = await genRes.text();
    throw new Error(`Generate failed (${genRes.status}): ${errorText}`);
  }

  const genData = await genRes.json();
  console.log('✓ Pack de 7 dias gerado com sucesso!');
  console.log('  - Pack ID:', genData.packId);
  console.log('  - Week Range:', genData.weekRangeLabel);
  console.log('  - Total Posts:', genData.posts?.length);
  console.log('  - Cota Restante pós-geração:', genData.quotaRemaining);

  if (genData.posts?.length !== 7) {
    throw new Error(`Esperado 7 posts, recebido ${genData.posts?.length}`);
  }

  console.log('\n--- TEST 7: Personalização de Artes & Foto via PATCH /api/packs ---');
  const customizedPosts = [...genData.posts];
  customizedPosts[0] = {
    ...customizedPosts[0],
    customHeadline: 'Fornada Especial de Fermentação Natural Saindo Agora',
    customSubheadline: 'Crocância por fora, miolo macio e o aroma inconfundível.',
    customCta: 'Reserve a sua fatia',
    imageUrl: uploadData.url,
    isCustomized: true
  };

  const patchRes = await fetch(`${BASE_URL}/api/packs`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify({
      id: genData.packId,
      posts: customizedPosts
    })
  });

  if (!patchRes.ok) {
    const errText = await patchRes.text();
    throw new Error(`Patch pack failed (${patchRes.status}): ${errText}`);
  }

  const patchData = await patchRes.json();
  console.log('✓ Arte #1 atualizada com headline customizada e URL da foto!');
  console.log('  - Headline:', patchData.pack?.posts?.[0]?.customHeadline);
  console.log('  - Image URL:', patchData.pack?.posts?.[0]?.imageUrl);

  console.log('\n--- TEST 8: Recuperação Fiel no Histórico (GET /api/packs) ---');
  const packsRes = await fetch(`${BASE_URL}/api/packs`, {
    headers: { 'Cookie': cookieHeader }
  });

  if (!packsRes.ok) {
    throw new Error(`Fetch packs failed with status ${packsRes.status}`);
  }

  const packsData = await packsRes.json();
  const savedPack = packsData.packs.find(p => p.id === genData.packId);
  if (!savedPack) {
    throw new Error(`Pack ${genData.packId} não encontrado no histórico.`);
  }

  const firstPost = savedPack.posts[0];
  if (firstPost.customHeadline !== 'Fornada Especial de Fermentação Natural Saindo Agora') {
    throw new Error(`Headline personalizada não persistida!`);
  }
  if (firstPost.imageUrl !== uploadData.url) {
    throw new Error(`URL da imagem personalizada não persistida!`);
  }
  console.log('✓ Pack e personalizações validadas com integridade no banco de dados!');

  console.log('\n--- TEST 9: Limpeza (DELETE /api/packs) ---');
  const delRes = await fetch(`${BASE_URL}/api/packs?id=${genData.packId}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookieHeader }
  });
  if (!delRes.ok) {
    throw new Error(`Delete failed with status ${delRes.status}`);
  }
  console.log('✓ Pack de teste removido com sucesso!');

  console.log('\n--- TEST 10: Contabilização e Bloqueio de Cota (Starter vs Pro) ---');
  // 1. Configura conta como Starter com 11 packs já criados (1 restante)
  console.log('  10.1: Configurando plano Starter com 11 de 12 packs usados...');
  const setStarterRes = await fetch(`${BASE_URL}/api/webhooks/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': 'socialpack_webhook_secret_2026'
    },
    body: JSON.stringify({
      event: 'payment.succeeded',
      data: {
        userEmail: 'demo@socialpack.ai',
        planId: 'starter',
        usedGenerations: 11,
        packsCreatedCount: 11,
      }
    })
  });
  if (!setStarterRes.ok) throw new Error('Falha ao configurar plano Starter no teste');

  // Verifica se a API de assinatura reflete 1 restante
  const starterSubRes = await fetch(`${BASE_URL}/api/subscription`, {
    headers: { 'Cookie': cookieHeader }
  });
  const starterSubData = await starterSubRes.json();
  console.log(`  - Plano: ${starterSubData.subscription?.planId}, Usados: ${starterSubData.subscription?.usedGenerations}, Restante: ${starterSubData.remaining}`);
  if (starterSubData.subscription?.planId !== 'starter' || starterSubData.remaining !== 1) {
    throw new Error(`Esperado 1 pack restante no Starter, recebido ${starterSubData.remaining}`);
  }

  // 10.2: Gera o 12º pack (último da cota)
  console.log('  10.2: Gerando o 12º pack no Starter (limite exato)...');
  const gen12Res = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify({ profile: testProfile })
  });
  if (!gen12Res.ok) throw new Error(`Geração do 12º pack falhou (${gen12Res.status})`);
  const gen12Data = await gen12Res.json();
  console.log(`  ✓ 12º pack gerado! packsCreatedCount: ${gen12Data.packsCreatedCount}, quotaRemaining: ${gen12Data.quotaRemaining}`);
  if (gen12Data.packsCreatedCount !== 12 || gen12Data.quotaRemaining !== 0) {
    throw new Error(`Cota não contabilizada corretamente. packsCreatedCount: ${gen12Data.packsCreatedCount}`);
  }

  // 10.3: Tenta gerar o 13º pack no Starter (deve BLOQUEAR com 403)
  console.log('  10.3: Tentando gerar o 13º pack além do limite do Starter...');
  const blockRes = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify({ profile: testProfile })
  });
  console.log(`  - Status da resposta: ${blockRes.status}`);
  if (blockRes.status !== 403) {
    throw new Error(`Esperado status 403 para limite atingido, recebido ${blockRes.status}`);
  }
  const blockData = await blockRes.json();
  console.log(`  - Mensagem de erro: "${blockData.error}"`);
  if (!blockData.error?.includes("Limite de packs atingido. Faça upgrade para o plano Pro")) {
    throw new Error(`Mensagem incorreta de bloqueio: ${blockData.error}`);
  }
  console.log('  ✓ Bloqueio 403 no Starter validado com a mensagem correta!');

  // 10.4: Upgrade para Plano Pro e geração além do limite
  console.log('  10.4: Fazendo upgrade para o Plano Pro...');
  await fetch(`${BASE_URL}/api/webhooks/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': 'socialpack_webhook_secret_2026'
    },
    body: JSON.stringify({
      event: 'payment.succeeded',
      data: {
        userEmail: 'demo@socialpack.ai',
        planId: 'pro',
        usedGenerations: 12,
        packsCreatedCount: 12,
      }
    })
  });

  console.log('  10.5: Gerando o 13º pack no Plano Pro (não deve travar e deve contabilizar)...');
  const proGenRes = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify({ profile: testProfile })
  });
  if (!proGenRes.ok) {
    throw new Error(`Geração no plano Pro falhou com status ${proGenRes.status}`);
  }
  const proGenData = await proGenRes.json();
  console.log(`  ✓ Pack gerado no Pro! packsCreatedCount: ${proGenData.packsCreatedCount}`);
  if (proGenData.packsCreatedCount !== 13) {
    throw new Error(`Esperado 13 packs criados no Pro, obtido ${proGenData.packsCreatedCount}`);
  }

  // Limpa packs criados no teste
  if (gen12Data.packId) {
    await fetch(`${BASE_URL}/api/packs?id=${gen12Data.packId}`, { method: 'DELETE', headers: { 'Cookie': cookieHeader } });
  }
  if (proGenData.packId) {
    await fetch(`${BASE_URL}/api/packs?id=${proGenData.packId}`, { method: 'DELETE', headers: { 'Cookie': cookieHeader } });
  }

  console.log('\n--- TEST 11: Bloqueio Rigoroso Sem Assinatura Ativa (100% Pago) ---');
  // 11.1: Cancela assinatura do usuário para testar comportamento inativo
  console.log('  11.1: Simulando conta sem assinatura ativa (status: canceled)...');
  await fetch(`${BASE_URL}/api/webhooks/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': 'socialpack_webhook_secret_2026'
    },
    body: JSON.stringify({
      event: 'subscription.canceled',
      data: { userEmail: 'demo@socialpack.ai' }
    })
  });

  const inactiveSubRes = await fetch(`${BASE_URL}/api/subscription`, {
    headers: { 'Cookie': cookieHeader }
  });
  const inactiveSubData = await inactiveSubRes.json();
  console.log(`  - Status da assinatura: ${inactiveSubData.subscription?.status}`);
  if (inactiveSubData.subscription?.status === 'active') {
    throw new Error('Assinatura deveria estar inativa');
  }

  // 11.2: Tentativa de geração sem assinatura ativa deve retornar 403
  console.log('  11.2: Tentando gerar pack sem assinatura ativa...');
  const inactiveGenRes = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify({ profile: testProfile })
  });
  console.log(`  - Status da resposta: ${inactiveGenRes.status}`);
  if (inactiveGenRes.status !== 403) {
    throw new Error(`Esperado status 403 para usuário inativo, recebido ${inactiveGenRes.status}`);
  }
  const inactiveGenData = await inactiveGenRes.json();
  console.log(`  - Mensagem de erro: "${inactiveGenData.error}"`);
  if (!inactiveGenData.error?.includes("Assinatura ativa necessária")) {
    throw new Error(`Mensagem incorreta de bloqueio: ${inactiveGenData.error}`);
  }
  console.log('  ✓ Geração bloqueada com sucesso para usuário sem assinatura ativa!');

  // 11.3: Redirecionamento da rota /dashboard para /dashboard/billing
  console.log('  11.3: Verificando redirecionamento de /dashboard para /dashboard/billing...');
  const rscRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { 'Cookie': cookieHeader, 'RSC': '1' },
    redirect: 'manual'
  });
  console.log(`  - Navegação RSC: status ${rscRes.status}`);

  const dashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { 'Cookie': cookieHeader },
    redirect: 'manual'
  });
  const dashText = await dashRes.text();
  const redirectLocation = dashRes.headers.get('location');
  const hasPprRedirect = dashText.includes('NEXT_REDIRECT') && dashText.includes('/dashboard/billing');
  console.log(`  - Documento HTTP /dashboard: status ${dashRes.status}, Redirect Header: ${redirectLocation || 'nenhum'}, PPR Stream Digest: ${hasPprRedirect}`);

  if (rscRes.status !== 307 && !redirectLocation?.includes('/dashboard/billing') && !hasPprRedirect) {
    throw new Error('Esperado redirecionamento para /dashboard/billing via RSC ou streaming PPR.');
  }
  console.log('  ✓ Usuário sem assinatura ativa redirecionado para /dashboard/billing com sucesso!');

  console.log('\n--- TEST 12: Fluxo Completo de Seleção de Plano & Acesso ao Dashboard ---');
  // 12.1: Começa como usuário inativo
  console.log('  12.1: Cancelando plano para simular usuário caindo em /dashboard/billing...');
  await fetch(`${BASE_URL}/api/webhooks/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': 'socialpack_webhook_secret_2026'
    },
    body: JSON.stringify({
      event: 'subscription.canceled',
      data: { userEmail: 'demo@socialpack.ai' }
    })
  });

  // 12.2: Usuário seleciona o plano Starter em /api/checkout
  console.log('  12.2: Usuário seleciona e ativa o plano Starter em /api/checkout...');
  const choosePlanRes = await fetch(`${BASE_URL}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify({
      planId: 'starter',
      autoActivate: true
    })
  });
  if (!choosePlanRes.ok) throw new Error('Falha ao selecionar plano no checkout');
  const choosePlanData = await choosePlanRes.json();
  const newCookie = choosePlanRes.headers.get('set-cookie');
  if (newCookie) {
    cookieHeader = newCookie.split(';')[0];
  }
  console.log(`  ✓ Plano Starter ativado: status ${choosePlanData.status}, planId: ${choosePlanData.subscription?.planId}`);

  // 12.3: Navega para /dashboard e garante que NÃO é ejetado de volta para /dashboard/billing
  console.log('  12.3: Acessando /dashboard com a credencial atualizada...');
  const dashAfterCheckoutRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { 'Cookie': cookieHeader, 'RSC': '1' },
    redirect: 'manual'
  });
  const locAfterCheckout = dashAfterCheckoutRes.headers.get('location');
  console.log(`  - Status HTTP do /dashboard: ${dashAfterCheckoutRes.status}, Location: ${locAfterCheckout || 'nenhuma'}`);
  if (locAfterCheckout?.includes('/dashboard/billing')) {
    throw new Error('Falha: usuário com plano recém-ativado foi rejeitado e redirecionado para /dashboard/billing!');
  }
  console.log('  ✓ Usuário com plano ativado acessou o /dashboard com sucesso sem cair em /dashboard/billing!');

  // 12.4: Reativa plano Pro final para o usuário demo
  console.log('  12.4: Reativando plano Pro para a conta demo...');
  await fetch(`${BASE_URL}/api/webhooks/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': 'socialpack_webhook_secret_2026'
    },
    body: JSON.stringify({
      event: 'payment.succeeded',
      data: {
        userEmail: 'demo@socialpack.ai',
        planId: 'pro',
        usedGenerations: 0,
        packsCreatedCount: 0,
      }
    })
  });
  console.log('  ✓ Assinatura Pro restabelecida com sucesso!');

  console.log('\n=====================================================');
  console.log('   TODAS AS FASES E REGRAS DE COTA VALIDADAS COM SUCESSO! 🚀');
  console.log('=====================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

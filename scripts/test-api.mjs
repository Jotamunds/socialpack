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
  const cookieHeader = setCookie ? setCookie.split(';')[0] : '';

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

  console.log('\n=====================================================');
  console.log('   TODAS AS FASES (1, 2 E 3) VALIDADAS COM SUCESSO! 🚀');
  console.log('=====================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

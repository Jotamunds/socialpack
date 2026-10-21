// Programmatic verification script for SocialPack AI endpoints
import { readFileSync } from 'node:fs';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- TEST 1: Logging in ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@socialpack.ai', password: 'socialpack123' })
  });
  
  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }
  
  const setCookie = loginRes.headers.get('set-cookie');
  console.log('✓ Login successful! Cookie received:', setCookie ? 'Yes' : 'No');
  
  const cookieHeader = setCookie ? setCookie.split(';')[0] : '';

  console.log('\n--- TEST 2: Generating a 5-Post Pack & Saving ---');
  const testProfile = {
    name: 'Café & Grão Especial',
    city: 'Curitiba, PR',
    categoryId: 'alimentacao',
    nicheId: 'cafeteria',
    instagram: 'cafegrao',
    toneId: 'acolhedor',
    colors: {
      primary: '#6f4e37',
      secondary: '#c4a482',
      accent: '#ffd700'
    }
  };

  const genRes = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify(testProfile)
  });

  if (!genRes.ok) {
    const errorText = await genRes.text();
    throw new Error(`Generate failed (${genRes.status}): ${errorText}`);
  }

  const genData = await genRes.json();
  console.log(`✓ Pack generated successfully!`);
  console.log(`  - Pack ID: ${genData.packId}`);
  console.log(`  - Created At: ${genData.createdAt}`);
  console.log(`  - Total Posts: ${genData.posts?.length}`);

  if (genData.posts?.length !== 5) {
    throw new Error(`Expected 5 posts, got ${genData.posts?.length}`);
  }

  console.log('\n--- TEST 3: Fetching Saved Packs History ---');
  const packsRes = await fetch(`${BASE_URL}/api/packs`, {
    headers: { 'Cookie': cookieHeader }
  });

  if (!packsRes.ok) {
    throw new Error(`Fetch packs failed with status ${packsRes.status}`);
  }

  const packsData = await packsRes.json();
  console.log(`✓ Retrieved ${packsData.packs?.length} packs from storage.`);
  console.log(`  - Storage source: ${packsData.source}`);

  const found = packsData.packs.find(p => p.id === genData.packId);
  if (!found) {
    throw new Error(`Generated pack ${genData.packId} was not found in history!`);
  }
  console.log(`✓ Found newly generated pack in history!`);
  console.log(`  - Client Name: ${found.clientName}`);
  console.log(`  - Category / Niche: ${found.categoryId} / ${found.nicheId}`);
  console.log(`  - Posts stored: ${found.posts.length}`);

  console.log('\n--- TEST 5: Deleting Pack from History ---');
  const delRes = await fetch(`${BASE_URL}/api/packs?id=${genData.packId}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookieHeader }
  });
  if (!delRes.ok) {
    throw new Error(`Delete failed with status ${delRes.status}`);
  }
  const delData = await delRes.json();
  console.log(`✓ Pack deleted successfully:`, delData.ok);

  console.log('\nALL TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

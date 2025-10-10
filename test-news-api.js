/**
 * Test News API
 * Run with: node test-news-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPublicAPI() {
  console.log('\n=== Testing Public News API (No Auth) ===\n');

  try {
    // Test 1: Get news for INFY
    console.log('Test 1: GET /api/stocks/INFY/activities');
    const res1 = await axios.get(`${BASE_URL}/api/stocks/INFY/activities?limit=5`);
    console.log('✅ Success!');
    console.log(`   Total: ${res1.data.data.total}`);
    console.log(`   Retrieved: ${res1.data.data.activities.length}`);
    if (res1.data.data.activities.length > 0) {
      console.log(`   First headline: "${res1.data.data.activities[0].headline}"`);
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n');

  try {
    // Test 2: Get news for TCS
    console.log('Test 2: GET /api/stocks/TCS/activities');
    const res2 = await axios.get(`${BASE_URL}/api/stocks/TCS/activities?limit=5`);
    console.log('✅ Success!');
    console.log(`   Total: ${res2.data.data.total}`);
    console.log(`   Retrieved: ${res2.data.data.activities.length}`);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

async function testAdminAPI() {
  console.log('\n=== Testing Admin News API (Requires Auth) ===\n');

  // Get token from user
  const token = process.env.ADMIN_TOKEN || '';

  if (!token) {
    console.log('⚠️  No admin token provided. Set ADMIN_TOKEN environment variable to test.');
    console.log('   Example: ADMIN_TOKEN=your_token node test-news-api.js');
    return;
  }

  try {
    console.log('Test 3: GET /api/admin/stocks/news');
    const res = await axios.get(`${BASE_URL}/api/admin/stocks/news?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Success!');
    console.log(`   Total: ${res.data.data.total}`);
    console.log(`   Retrieved: ${res.data.data.activities.length}`);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     Stock News API Test Suite         ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('\nMake sure your dev server is running: npm run dev\n');

  await testPublicAPI();
  await testAdminAPI();

  console.log('\n✅ Tests completed!\n');
  console.log('If you see news data above, the API is working.');
  console.log('If not, check:');
  console.log('  1. Is the dev server running? (npm run dev)');
  console.log('  2. Is MongoDB connected?');
  console.log('  3. Check browser console for errors\n');
}

runTests().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});

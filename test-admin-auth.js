/**
 * Test Admin Authentication and News API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAdminAuth() {
  console.log('\n=== Testing Admin News API with Auth ===\n');

  // First, let's check what's in localStorage (you need to get this from browser)
  console.log('Step 1: Get your admin token from browser');
  console.log('  1. Open browser console (F12)');
  console.log('  2. Run: localStorage.getItem("authToken")');
  console.log('  3. Copy the token\n');

  // For now, let's try without auth to see the error
  console.log('Step 2: Testing without auth (to see error)');
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/stocks/news?limit=5`);
    console.log('✅ Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Expected error (no auth):');
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
      console.log('\n⚠️  Is the dev server running? Run: npm run dev\n');
    }
  }

  console.log('\n');

  // Test with a fake token
  console.log('Step 3: Testing with fake token (to see error)');
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/stocks/news?limit=5`, {
      headers: { Authorization: 'Bearer fake-token-12345' }
    });
    console.log('✅ Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Expected error (invalid token):');
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }

  console.log('\n=== Testing Public API (Should Work) ===\n');

  try {
    const response = await axios.get(`${BASE_URL}/api/stocks/INFY/activities?limit=3`);
    console.log('✅ Public API works!');
    console.log('   Total articles:', response.data.data.total);
    console.log('   Retrieved:', response.data.data.activities.length);
    if (response.data.data.activities.length > 0) {
      console.log('   Sample:', response.data.data.activities[0].headline.substring(0, 50) + '...');
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n=== Instructions ===\n');
  console.log('To test with your real token:');
  console.log('1. Login to admin panel in browser');
  console.log('2. Open browser console (F12)');
  console.log('3. Run: localStorage.getItem("authToken")');
  console.log('4. Run: ADMIN_TOKEN=your_token node test-admin-auth.js');
  console.log('\nOr check browser Network tab for the actual error\n');
}

// Check if token was provided
if (process.env.ADMIN_TOKEN) {
  console.log('\n✅ Admin token found, testing with real auth...\n');

  axios.get(`${BASE_URL}/api/admin/stocks/news?limit=5`, {
    headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` }
  })
  .then(response => {
    console.log('✅ SUCCESS! Admin API works!');
    console.log('   Total:', response.data.data.total);
    console.log('   Retrieved:', response.data.data.activities.length);
    console.log('\n🎉 The admin news API is working perfectly!\n');
  })
  .catch(error => {
    console.log('❌ Error with your token:');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data);
    console.log('\n💡 This might be an auth issue. Try logging out and back in.\n');
  });
} else {
  testAdminAuth();
}

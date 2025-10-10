/**
 * Quick Test Script for Stock Activities API
 *
 * This script tests the basic functionality of the stock activities system
 * Run with: node test-activity-api.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_SYMBOL = 'INFY';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function testTickertapeAPI() {
  log('\n=== Test 1: Tickertape API Direct Call ===', 'blue');
  try {
    const url = `https://analyze.api.tickertape.in/v2/stocks/feed/${TEST_SYMBOL}?types=news-article,news-video&offset=1&count=5`;
    const response = await axios.get(url);

    if (response.data?.success && response.data?.data?.items?.length > 0) {
      log('✓ Tickertape API is working', 'green');
      log(`  Found ${response.data.data.total} total items`, 'green');
      log(`  Retrieved ${response.data.data.items.length} items`, 'green');
      log(`  Sample headline: "${response.data.data.items[0].headline}"`, 'yellow');
      return true;
    } else {
      log('✗ No data from Tickertape API', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error calling Tickertape API: ${error.message}`, 'red');
    return false;
  }
}

async function testGetActivitiesAPI() {
  log('\n=== Test 2: Get Activities API ===', 'blue');
  try {
    const url = `${BASE_URL}/api/stocks/${TEST_SYMBOL}/activities?limit=5`;
    const response = await axios.get(url);

    if (response.data?.success) {
      const { activities, total } = response.data.data;
      log('✓ Get Activities API is working', 'green');
      log(`  Total activities in DB: ${total}`, 'green');
      log(`  Retrieved: ${activities.length} activities`, 'green');

      if (activities.length > 0) {
        log(`  Latest: "${activities[0].headline}"`, 'yellow');
        log(`  Type: ${activities[0].activityType}`, 'yellow');
      } else {
        log('  Note: No activities found in database. Run sync first.', 'yellow');
      }
      return true;
    } else {
      log('✗ API returned error', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    if (error.response?.data) {
      log(`  Server response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testLatestActivitiesAPI() {
  log('\n=== Test 3: Latest Activities API ===', 'blue');
  try {
    const url = `${BASE_URL}/api/stocks/activities/latest?limit=5`;
    const response = await axios.get(url);

    if (response.data?.success) {
      const { activities, total } = response.data.data;
      log('✓ Latest Activities API is working', 'green');
      log(`  Total activities (all stocks): ${total}`, 'green');
      log(`  Retrieved: ${activities.length} activities`, 'green');

      if (activities.length > 0) {
        const stocks = [...new Set(activities.map(a => a.stockSymbol))];
        log(`  Stocks in result: ${stocks.join(', ')}`, 'yellow');
      }
      return true;
    } else {
      log('✗ API returned error', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║  Stock Activities API Test Suite     ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');

  log(`\nTesting with symbol: ${TEST_SYMBOL}`, 'yellow');
  log(`Base URL: ${BASE_URL}`, 'yellow');

  const results = {
    tickertape: await testTickertapeAPI(),
    getActivities: await testGetActivitiesAPI(),
    latestActivities: await testLatestActivitiesAPI(),
  };

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('TEST SUMMARY', 'blue');
  log('='.repeat(50), 'blue');

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✓ PASSED' : '✗ FAILED';
    const color = passed ? 'green' : 'red';
    log(`${status}: ${test}`, color);
  });

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    log('\n🎉 All tests passed!', 'green');
    log('\nNext steps:', 'yellow');
    log('1. Run sync command: npm run sync-activities', 'yellow');
    log('2. Or use admin API to sync specific stocks', 'yellow');
    log('3. Check the documentation: docs/STOCK_ACTIVITIES_API.md', 'yellow');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'red');
    log('\nTroubleshooting:', 'yellow');
    log('1. Make sure Next.js dev server is running: npm run dev', 'yellow');
    log('2. Check MongoDB connection in .env.local', 'yellow');
    log('3. Verify the API endpoints exist', 'yellow');
  }

  log('\n');
}

// Run tests
runTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});

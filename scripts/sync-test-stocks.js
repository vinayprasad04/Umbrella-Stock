/**
 * Test Script to Sync a Few Known Stocks
 *
 * This script syncs a small list of popular stocks for testing
 */

const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_CONNECTION_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_CONNECTION_URI is not defined in .env.local');
  process.exit(1);
}

// Test with popular stocks
const TEST_STOCKS = ['INFY', 'TCS', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'WIPRO', 'LT', 'BHARTIARTL', 'TATAMOTORS'];

const CONFIG = {
  types: ['news-article', 'news-video'],
  count: 50,
  requestTimeout: 10000
};

const StockActivitySchema = new mongoose.Schema({
  stockSymbol: { type: String, required: true, uppercase: true, index: true },
  activityType: { type: String, required: true, index: true },
  headline: { type: String, required: true },
  summary: { type: String },
  publishedAt: { type: Date, required: true, index: true },
  source: { type: String },
  sourceUrl: { type: String },
  imageUrl: { type: String },
  tags: [String],
  feedType: { type: String },
  version: { type: String },
  isActive: { type: Boolean, default: true },
  sentiment: { type: String },
  priority: { type: Number, default: 0 }
}, { timestamps: true });

StockActivitySchema.index({ stockSymbol: 1, publishedAt: -1 });
StockActivitySchema.index({ stockSymbol: 1, activityType: 1, headline: 1, publishedAt: 1 }, { unique: true });

const StockActivity = mongoose.models.StockActivity || mongoose.model('StockActivity', StockActivitySchema);

async function syncActivitiesForStock(symbol) {
  try {
    // Note: Don't use 'types' parameter - API returns 400 error with it
    const url = `https://analyze.api.tickertape.in/v2/stocks/feed/${symbol}?offset=1&count=${CONFIG.count}`;

    const response = await axios.get(url, {
      timeout: CONFIG.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Debug: log the response
    console.log(`  📥 ${symbol} Response:`, response.data?.sucess ? 'Success' : response.data);

    // Note: API has typo "sucess" instead of "success"
    if (!response.data?.sucess || !response.data?.data?.items) {
      return { symbol, added: 0, skipped: 0, status: 'no-data' };
    }

    const items = response.data.data.items;
    let added = 0;
    let skipped = 0;

    for (const item of items) {
      try {
        await StockActivity.create({
          stockSymbol: symbol,
          activityType: item.feed_type,
          headline: item.headline,
          summary: item.summary,
          publishedAt: new Date(item.date),
          source: item.publisher,
          sourceUrl: item.link,
          imageUrl: item.imageUrl,
          tags: item.tag ? [item.tag] : [],
          feedType: item.feed_type,
          version: item.version,
          isActive: true
        });
        added++;
      } catch (error) {
        if (error.code === 11000) {
          skipped++;
        }
      }
    }

    return { symbol, added, skipped, status: 'success' };
  } catch (error) {
    return { symbol, added: 0, skipped: 0, error: error.message, status: 'error' };
  }
}

async function testSync() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing Stock Activities Sync');
  console.log('⏰ Time:', new Date().toLocaleString());
  console.log('='.repeat(60) + '\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`📊 Syncing ${TEST_STOCKS.length} test stocks: ${TEST_STOCKS.join(', ')}\n`);

    let totalAdded = 0;
    let totalSkipped = 0;
    let successCount = 0;

    for (const symbol of TEST_STOCKS) {
      const result = await syncActivitiesForStock(symbol);

      if (result.status === 'success') {
        successCount++;
        totalAdded += result.added;
        totalSkipped += result.skipped;
        console.log(`  ✅ ${result.symbol}: +${result.added} new, ${result.skipped} skipped`);
      } else if (result.status === 'no-data') {
        console.log(`  ⚠️  ${result.symbol}: No data available`);
      } else {
        console.log(`  ❌ ${result.symbol}: ${result.error}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully synced: ${successCount}/${TEST_STOCKS.length} stocks`);
    console.log(`➕ New activities added: ${totalAdded}`);
    console.log(`⏭️  Activities skipped (duplicates): ${totalSkipped}`);
    console.log('='.repeat(60));

    if (totalAdded > 0) {
      console.log('\n🎉 Success! You can now view news on stock details pages:');
      console.log('   http://localhost:3000/stocks/INFY');
      console.log('   http://localhost:3000/stocks/TCS');
      console.log('   http://localhost:3000/stocks/RELIANCE\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

testSync()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

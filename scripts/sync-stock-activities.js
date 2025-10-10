/**
 * Cron Job Script to Sync Stock Activities Daily
 *
 * This script fetches the latest news and activities from Tickertape API
 * and stores them in MongoDB. Run this daily to keep activities updated.
 *
 * Usage:
 * - node scripts/sync-stock-activities.js
 * - Or add to package.json: "sync-activities": "node scripts/sync-stock-activities.js"
 *
 * For automated daily sync, use cron:
 * - Linux/Mac: Add to crontab: 0 2 * * * cd /path/to/project && node scripts/sync-stock-activities.js
 * - Windows: Use Task Scheduler
 * - Or use a service like Vercel Cron, GitHub Actions, etc.
 */

const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_CONNECTION_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_CONNECTION_URI is not defined in .env.local');
  console.error('Please check your .env.local file and make sure MONGODB_CONNECTION_URI is set.');
  process.exit(1);
}

// Configuration
const CONFIG = {
  types: ['news-article', 'news-video'],
  count: 50, // Fetch last 50 activities per stock
  batchSize: 10, // Process 10 stocks at a time
  delayBetweenBatches: 2000, // 2 seconds delay between batches
  requestTimeout: 10000 // 10 seconds timeout per request
};

// Define Schema (same as StockActivity model)
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

const EquityStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
});

const EquityStock = mongoose.models.EquityStock || mongoose.model('EquityStock', EquityStockSchema);

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch activities for a single stock
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

    // Note: API has typo "sucess" instead of "success"
    if (!response.data?.sucess || !response.data?.data?.items) {
      console.log(`  ⚠️  ${symbol}: No data received`);
      return { symbol, added: 0, skipped: 0, error: 'No data' };
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
        } else {
          console.error(`    ❌ Error processing item: ${error.message}`);
        }
      }
    }

    return { symbol, added, skipped, status: 'success' };

  } catch (error) {
    console.log(`  ❌ ${symbol}: ${error.message}`);
    return { symbol, added: 0, skipped: 0, error: error.message, status: 'error' };
  }
}

// Main sync function
async function syncAllActivities() {
  console.log('🚀 Starting stock activities sync...\n');
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all active stocks
    const stocks = await EquityStock.find({ isActive: true }).select('symbol').lean();
    console.log(`📊 Found ${stocks.length} active stocks to sync\n`);

    if (stocks.length === 0) {
      console.log('⚠️  No active stocks found. Exiting...');
      return;
    }

    // Process stocks in batches
    const batches = [];
    for (let i = 0; i < stocks.length; i += CONFIG.batchSize) {
      batches.push(stocks.slice(i, i + CONFIG.batchSize));
    }

    let totalAdded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const results = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} stocks)...`);

      // Process batch in parallel
      const batchPromises = batch.map(stock => syncActivitiesForStock(stock.symbol));
      const batchResults = await Promise.all(batchPromises);

      // Aggregate results
      batchResults.forEach(result => {
        results.push(result);
        if (result.status === 'success') {
          totalAdded += result.added;
          totalSkipped += result.skipped;
          if (result.added > 0) {
            console.log(`  ✅ ${result.symbol}: +${result.added} new, ${result.skipped} skipped`);
          }
        } else {
          totalErrors++;
        }
      });

      // Delay before next batch to avoid rate limiting
      if (i < batches.length - 1) {
        console.log(`  ⏳ Waiting ${CONFIG.delayBetweenBatches}ms before next batch...\n`);
        await delay(CONFIG.delayBetweenBatches);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total stocks processed: ${stocks.length}`);
    console.log(`➕ New activities added: ${totalAdded}`);
    console.log(`⏭️  Activities skipped (duplicates): ${totalSkipped}`);
    console.log(`❌ Errors: ${totalErrors}`);
    console.log('='.repeat(60));

    // Log stocks with errors
    const errorStocks = results.filter(r => r.status === 'error');
    if (errorStocks.length > 0) {
      console.log('\n❌ Stocks with errors:');
      errorStocks.forEach(stock => {
        console.log(`  - ${stock.symbol}: ${stock.error}`);
      });
    }

    console.log(`\n⏰ Completed at: ${new Date().toLocaleString()}`);
    console.log('✨ Sync completed successfully!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the sync
syncAllActivities()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

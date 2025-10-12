/**
 * Cron Job Script to Sync Stock Activities Daily
 *
 * This script fetches the latest news and activities from Tickertape API
 * and stores them in MongoDB. Run this daily to keep activities updated.
 *
 * Features:
 * - Smart incremental sync: 50 news for new stocks, 20 for existing stocks
 * - Uses correct Tickertape symbol mapping (screenerId field)
 * - Stops early when duplicates are found for stocks with existing news
 * - Batch processing: 10 stocks at a time
 *
 * Usage:
 * - node scripts/sync-stock-activities.js
 * - Or: npm run sync-activities
 *
 * For automated daily sync, use cron:
 * - Linux/Mac: 0 2 * * * cd /path/to/project && npm run sync-activities
 * - Windows: Use Task Scheduler
 * - Cloud: Vercel Cron, GitHub Actions, etc.
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
  batchSize: 10, // Process 10 stocks at a time
  delayBetweenBatches: 2000, // 2 seconds delay between batches
  delayBetweenRequests: 500, // 500ms delay between individual requests
  requestTimeout: 10000, // 10 seconds timeout per request
  maxNewsForNewStock: 50, // Maximum news for stocks WITHOUT any news
  maxNewsForExistingStock: 20 // Maximum news for stocks WITH existing news
};

// Define Schemas
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
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

StockActivitySchema.index({ stockSymbol: 1, publishedAt: -1 });
StockActivitySchema.index({ stockSymbol: 1, activityType: 1, headline: 1, publishedAt: 1 }, { unique: true });

const StockActivity = mongoose.models.StockActivity || mongoose.model('StockActivity', StockActivitySchema);

const EquityStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  screenerId: { type: String }, // Tickertape symbol (e.g., RELI for RELIANCE)
  isActive: { type: Boolean, default: true }
});

const EquityStock = mongoose.models.EquityStock || mongoose.model('EquityStock', EquityStockSchema);

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch activities for a single stock using Tickertape API
async function syncActivitiesForStock(stock, hasExistingNews) {
  const { symbol, screenerId } = stock;

  try {
    // Use screenerId (Tickertape symbol) if available, otherwise use NSE symbol
    const tickertapeSymbol = screenerId || symbol;

    // Determine count based on whether stock has existing news
    const count = hasExistingNews ? CONFIG.maxNewsForExistingStock : CONFIG.maxNewsForNewStock;

    // Tickertape API URL
    const url = `https://analyze.api.tickertape.in/v2/stocks/feed/${tickertapeSymbol}?offset=1&count=${count}`;

    const response = await axios.get(url, {
      timeout: CONFIG.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Note: API has typo "sucess" instead of "success"
    if (!response.data?.sucess || !response.data?.data?.items) {
      return {
        symbol,
        added: 0,
        skipped: 0,
        error: 'No data',
        hasExistingNews,
        status: 'error'
      };
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
          skipped++; // Duplicate
          // If stock has existing news and we hit a duplicate, stop processing
          if (hasExistingNews) {
            break;
          }
        } else {
          console.error(`    ❌ Error processing item: ${error.message}`);
        }
      }
    }

    // Small delay between requests
    await delay(CONFIG.delayBetweenRequests);

    return { symbol, added, skipped, status: 'success', hasExistingNews };

  } catch (error) {
    const errorMsg = error.response?.status
      ? `HTTP ${error.response.status}`
      : error.message;

    return {
      symbol,
      added: 0,
      skipped: 0,
      error: errorMsg,
      status: 'error',
      hasExistingNews
    };
  }
}

// Main sync function
async function syncAllActivities() {
  console.log('🚀 Starting stock activities sync from Tickertape API...\n');
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch active stocks with screenerId (Tickertape symbol mapping)
    const stocks = await EquityStock.find({
      isActive: true
    }).select('symbol screenerId').lean();

    console.log(`📊 Found ${stocks.length} active stocks\n`);

    if (stocks.length === 0) {
      console.log('⚠️  No active stocks found. Exiting...');
      return;
    }

    // Count stocks with screenerId mapping
    const stocksWithMapping = stocks.filter(s => s.screenerId).length;
    const stocksWithoutMapping = stocks.filter(s => !s.screenerId).length;

    console.log(`   ✅ Stocks with Tickertape mapping: ${stocksWithMapping}`);
    console.log(`   ⚠️  Stocks without mapping: ${stocksWithoutMapping}`);
    if (stocksWithoutMapping > 0) {
      console.log(`   💡 Run "npm run import-screener-slugs" to add mappings\n`);
    }

    // Check which stocks already have news
    console.log('🔍 Checking which stocks already have news...');
    const stocksWithNews = await StockActivity.distinct('stockSymbol');
    const stocksWithNewsSet = new Set(stocksWithNews);

    const stocksWithoutNews = stocks.filter(s => !stocksWithNewsSet.has(s.symbol));
    const stocksWithExistingNews = stocks.filter(s => stocksWithNewsSet.has(s.symbol));

    console.log(`   📰 Stocks with existing news: ${stocksWithExistingNews.length} (will fetch up to ${CONFIG.maxNewsForExistingStock} latest)`);
    console.log(`   🆕 Stocks without news: ${stocksWithoutNews.length} (will fetch up to ${CONFIG.maxNewsForNewStock})\n`);

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

      // Process batch in parallel (Tickertape API can handle it)
      const batchPromises = batch.map(stock => {
        const hasExistingNews = stocksWithNewsSet.has(stock.symbol);
        return syncActivitiesForStock(stock, hasExistingNews);
      });
      const batchResults = await Promise.all(batchPromises);

      // Aggregate results
      batchResults.forEach(result => {
        results.push(result);
        if (result.status === 'success') {
          totalAdded += result.added;
          totalSkipped += result.skipped;
          if (result.added > 0) {
            const newsType = result.hasExistingNews ? '🔄 update' : '🆕 new';
            console.log(`  ✅ ${result.symbol} (${newsType}): +${result.added} new, ${result.skipped} skipped`);
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

    // Calculate stats
    const newStocksProcessed = results.filter(r => !r.hasExistingNews && r.status === 'success');
    const existingStocksProcessed = results.filter(r => r.hasExistingNews && r.status === 'success');
    const newStocksWithNews = newStocksProcessed.filter(r => r.added > 0).length;
    const existingStocksUpdated = existingStocksProcessed.filter(r => r.added > 0).length;

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total stocks processed: ${stocks.length}`);
    console.log(`   🆕 Stocks without existing news: ${stocksWithoutNews.length}`);
    console.log(`      - Got news for: ${newStocksWithNews} stocks`);
    console.log(`   🔄 Stocks with existing news: ${stocksWithExistingNews.length}`);
    console.log(`      - Updated with new news: ${existingStocksUpdated} stocks`);
    console.log(`\n➕ Total new activities added: ${totalAdded}`);
    console.log(`⏭️  Activities skipped (duplicates): ${totalSkipped}`);
    console.log(`❌ Errors: ${totalErrors}`);
    console.log('='.repeat(60));

    // Log stocks with errors
    const errorStocks = results.filter(r => r.status === 'error');
    if (errorStocks.length > 0) {
      console.log('\n❌ Stocks with errors (first 20):');
      errorStocks.slice(0, 20).forEach(stock => {
        console.log(`  - ${stock.symbol}: ${stock.error}`);
      });
      if (errorStocks.length > 20) {
        console.log(`  ... and ${errorStocks.length - 20} more`);
      }
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

/**
 * Node-Cron Service for Daily Stock Activities Sync
 *
 * This service runs automatically when the Next.js server starts
 * and syncs stock activities daily at 2:00 AM
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const CONFIG = {
  types: ['news-article', 'news-video'],
  count: 50,
  batchSize: 10,
  delayBetweenBatches: 2000,
  requestTimeout: 10000
};

// Check if already initialized
let isInitialized = false;

// Define Schema
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

const EquityStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function syncActivitiesForStock(symbol, StockActivity) {
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

async function runDailySync() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 Starting Daily Stock Activities Sync (CRON)');
  console.log('⏰ Time:', new Date().toLocaleString());
  console.log('='.repeat(60) + '\n');

  try {
    // Ensure models are initialized
    const StockActivity = mongoose.models.StockActivity ||
      mongoose.model('StockActivity', StockActivitySchema);
    const EquityStock = mongoose.models.EquityStock ||
      mongoose.model('EquityStock', EquityStockSchema);

    // Check if connected
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  MongoDB not connected. Skipping sync.');
      return;
    }

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

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      const batchPromises = batch.map(stock => syncActivitiesForStock(stock.symbol, StockActivity));
      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(result => {
        if (result.status === 'success') {
          totalAdded += result.added;
          totalSkipped += result.skipped;
        } else {
          totalErrors++;
        }
      });

      // Delay before next batch
      if (i < batches.length - 1) {
        await delay(CONFIG.delayBetweenBatches);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Daily Sync Completed');
    console.log('='.repeat(60));
    console.log(`➕ New activities added: ${totalAdded}`);
    console.log(`⏭️  Activities skipped: ${totalSkipped}`);
    console.log(`❌ Errors: ${totalErrors}`);
    console.log(`⏰ Completed at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
}

/**
 * Initialize the cron job
 */
function initCronJob() {
  if (isInitialized) {
    console.log('⚠️  Cron job already initialized. Skipping...');
    return;
  }

  // Schedule: Run every day at 2:00 AM
  // Cron format: second minute hour day month dayOfWeek
  // 0 2 * * * = At 2:00 AM every day
  const cronSchedule = '0 2 * * *';

  cron.schedule(cronSchedule, async () => {
    await runDailySync();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Change to your timezone
  });

  isInitialized = true;

  console.log('✅ Stock Activities Cron Job Initialized');
  console.log(`⏰ Schedule: Daily at 2:00 AM (${cronSchedule})`);
  console.log(`🌍 Timezone: Asia/Kolkata`);
  console.log('📝 Next run will be at 2:00 AM tomorrow\n');

  // Optional: Run immediately on server start (for testing)
  // Uncomment the line below to sync on server startup
  // runDailySync();
}

module.exports = {
  initCronJob,
  runDailySync // Export for manual testing
};

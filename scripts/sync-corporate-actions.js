/**
 * Sync Corporate Actions (Dividends, Announcements, Legal Orders)
 *
 * Fetches corporate actions from Tickertape API and stores them in StockActivity collection
 * - Dividends: cashDividend type
 * - Announcements: company announcements
 * - Legal Orders: legal/court orders
 *
 * Usage: node scripts/sync-corporate-actions.js [symbol]
 * Example: node scripts/sync-corporate-actions.js RELIANCE
 */

const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_CONNECTION_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_CONNECTION_URI is not defined in .env.local');
  process.exit(1);
}

// Configuration
const CONFIG = {
  maxPerType: 10, // Max items to fetch per type
  delayBetweenRequests: 500, // 500ms delay between requests
  requestTimeout: 10000
};

// Define Schemas
const EquityStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  companyName: String,
  screenerId: String, // Tickertape symbol (e.g., RELI)
  isActive: Boolean
});

const StockActivitySchema = new mongoose.Schema({
  stockSymbol: { type: String, required: true, index: true },
  activityType: { type: String, required: true, enum: ['news-article', 'dividend', 'announcement', 'legal-order'] },
  headline: { type: String, required: true },
  summary: String,
  publishedAt: { type: Date, required: true, index: true },
  source: String,
  sourceUrl: String,
  imageUrl: String,
  tags: [String],
  feedType: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicates
StockActivitySchema.index(
  { stockSymbol: 1, activityType: 1, headline: 1, publishedAt: 1 },
  { unique: true }
);

const EquityStock = mongoose.models.EquityStock || mongoose.model('EquityStock', EquityStockSchema);
const StockActivity = mongoose.models.StockActivity || mongoose.model('StockActivity', StockActivitySchema);

/**
 * Fetch dividends from Tickertape API
 */
async function fetchDividends(tickertapeSymbol, nseSymbol) {
  const url = `https://api.tickertape.in/stocks/corporates/dividends/${tickertapeSymbol}?count=${CONFIG.maxPerType}&offset=0`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: CONFIG.requestTimeout
    });

    if (!response.data?.success || !response.data?.data) {
      return [];
    }

    const dividends = [...(response.data.data.upcoming || []), ...(response.data.data.past || [])];

    return dividends.map(div => ({
      stockSymbol: nseSymbol,
      activityType: 'dividend',
      headline: `${div.subType} Dividend - ₹${div.value} per share`,
      summary: `<p><strong>Type:</strong> ${div.title}</p><p><strong>Amount:</strong> ₹${div.dividend} per share</p><p><strong>Ex-Date:</strong> ${new Date(div.exDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>`,
      publishedAt: new Date(div.exDate),
      source: 'Tickertape',
      sourceUrl: `https://www.tickertape.in/stocks/${tickertapeSymbol.toLowerCase()}`,
      isActive: true,
      metadata: {
        dividendAmount: div.dividend,
        dividendType: div.type,
        subType: div.subType,
        exDate: div.exDate
      }
    }));
  } catch (error) {
    console.error(`  ❌ Error fetching dividends for ${tickertapeSymbol}:`, error.message);
    return [];
  }
}

/**
 * Fetch announcements from Tickertape API
 */
async function fetchAnnouncements(tickertapeSymbol, nseSymbol) {
  const url = `https://api.tickertape.in/stocks/corporates/announcements/${tickertapeSymbol}?count=${CONFIG.maxPerType}&offset=0`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: CONFIG.requestTimeout
    });

    if (!response.data?.success || !response.data?.data) {
      return [];
    }

    const announcements = [...(response.data.data.upcoming || []), ...(response.data.data.past || [])];

    return announcements.map(ann => ({
      stockSymbol: nseSymbol,
      activityType: 'announcement',
      headline: ann.subject || 'Company Announcement',
      summary: ann.description ? `<p>${ann.description.replace(/\n/g, '<br>')}</p>` : '',
      publishedAt: new Date(ann.broadcastTime),
      source: 'NSE/BSE',
      sourceUrl: ann.attachement || `https://www.tickertape.in/stocks/${tickertapeSymbol.toLowerCase()}`,
      isActive: true,
      metadata: {
        subject: ann.subject,
        broadcastTime: ann.broadcastTime,
        attachement: ann.attachement
      }
    }));
  } catch (error) {
    console.error(`  ❌ Error fetching announcements for ${tickertapeSymbol}:`, error.message);
    return [];
  }
}

/**
 * Fetch legal orders from Tickertape API
 */
async function fetchLegalOrders(tickertapeSymbol, nseSymbol) {
  const url = `https://api.tickertape.in/stocks/corporates/legal/${tickertapeSymbol}?count=${CONFIG.maxPerType}&offset=0`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: CONFIG.requestTimeout
    });

    if (!response.data?.success || !response.data?.data) {
      return [];
    }

    const legalOrders = [...(response.data.data.upcoming || []), ...(response.data.data.past || [])];

    return legalOrders.map(legal => ({
      stockSymbol: nseSymbol,
      activityType: 'legal-order',
      headline: `Case ${legal.caseNo}: ${legal.desc}`,
      summary: `<p><strong>Case Number:</strong> ${legal.caseNo}</p><p><strong>Description:</strong> ${legal.desc}</p><p><strong>Source:</strong> ${legal.source}</p><p><strong>Order Date:</strong> ${new Date(legal.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>`,
      publishedAt: new Date(legal.orderDate),
      source: legal.source || 'Court',
      sourceUrl: legal.link || `https://www.tickertape.in/stocks/${tickertapeSymbol.toLowerCase()}`,
      isActive: true,
      metadata: {
        caseNo: legal.caseNo,
        orderDate: legal.orderDate,
        courtSource: legal.source
      }
    }));
  } catch (error) {
    console.error(`  ❌ Error fetching legal orders for ${tickertapeSymbol}:`, error.message);
    return [];
  }
}

/**
 * Save activities to database
 */
async function saveActivities(activities) {
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  for (const activity of activities) {
    try {
      await StockActivity.create(activity);
      saved++;
    } catch (error) {
      if (error.code === 11000) {
        skipped++; // Duplicate
      } else {
        errors++;
        console.error(`    ❌ Error saving activity:`, error.message);
      }
    }
  }

  return { saved, skipped, errors };
}

/**
 * Sync corporate actions for a single stock
 */
async function syncStockCorporateActions(stock) {
  const { symbol, screenerId, companyName } = stock;
  const tickertapeSymbol = screenerId || symbol;

  console.log(`\n📊 Processing: ${symbol} (${companyName})`);
  console.log(`   Tickertape Symbol: ${tickertapeSymbol}`);

  let totalSaved = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Fetch dividends
  console.log(`   📥 Fetching dividends...`);
  const dividends = await fetchDividends(tickertapeSymbol, symbol);
  await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));

  // Fetch announcements
  console.log(`   📥 Fetching announcements...`);
  const announcements = await fetchAnnouncements(tickertapeSymbol, symbol);
  await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));

  // Fetch legal orders
  console.log(`   📥 Fetching legal orders...`);
  const legalOrders = await fetchLegalOrders(tickertapeSymbol, symbol);
  await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));

  // Save all activities
  const allActivities = [...dividends, ...announcements, ...legalOrders];

  if (allActivities.length > 0) {
    const result = await saveActivities(allActivities);
    totalSaved = result.saved;
    totalSkipped = result.skipped;
    totalErrors = result.errors;
  }

  console.log(`   ✅ Dividends: ${dividends.length}, Announcements: ${announcements.length}, Legal Orders: ${legalOrders.length}`);
  console.log(`   💾 Saved: ${totalSaved}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`);

  return {
    symbol,
    dividends: dividends.length,
    announcements: announcements.length,
    legalOrders: legalOrders.length,
    saved: totalSaved,
    skipped: totalSkipped,
    errors: totalErrors
  };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Corporate Actions Sync...\n');
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);

  const specificSymbol = process.argv[2];

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    let stocks;

    if (specificSymbol) {
      console.log(`🎯 Syncing specific stock: ${specificSymbol}\n`);
      stocks = await EquityStock.find({
        symbol: specificSymbol.toUpperCase(),
        isActive: true
      });

      if (stocks.length === 0) {
        console.error(`❌ Stock ${specificSymbol} not found or inactive`);
        process.exit(1);
      }
    } else {
      console.log('🎯 Syncing all active stocks with Tickertape mapping\n');
      stocks = await EquityStock.find({
        isActive: true,
        screenerId: { $exists: true, $ne: null, $ne: '' }
      }).limit(100); // Limit to avoid overwhelming API
    }

    console.log(`📈 Found ${stocks.length} stock(s) to process\n`);
    console.log('='.repeat(60));

    const results = [];

    for (const stock of stocks) {
      const result = await syncStockCorporateActions(stock);
      results.push(result);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));

    const totalDividends = results.reduce((sum, r) => sum + r.dividends, 0);
    const totalAnnouncements = results.reduce((sum, r) => sum + r.announcements, 0);
    const totalLegalOrders = results.reduce((sum, r) => sum + r.legalOrders, 0);
    const totalSaved = results.reduce((sum, r) => sum + r.saved, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

    console.log(`✅ Stocks processed: ${results.length}`);
    console.log(`💰 Dividends fetched: ${totalDividends}`);
    console.log(`📢 Announcements fetched: ${totalAnnouncements}`);
    console.log(`⚖️  Legal Orders fetched: ${totalLegalOrders}`);
    console.log(`💾 Total saved: ${totalSaved}`);
    console.log(`⏭️  Total skipped (duplicates): ${totalSkipped}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log('='.repeat(60));

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
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

/**
 * Test Script to Sync a Few Known Stocks from Screener.in
 *
 * This script syncs a small list of popular stocks for testing.
 * Uses the same intelligent logic as the main script.
 */

const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');

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
  delayBetweenRequests: 2000,
  requestTimeout: 15000,
  maxNewsForNewStock: 50,
  maxNewsForExistingStock: 20
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
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

StockActivitySchema.index({ stockSymbol: 1, publishedAt: -1 });
StockActivitySchema.index({ stockSymbol: 1, activityType: 1, headline: 1, publishedAt: 1 }, { unique: true });

const StockActivity = mongoose.models.StockActivity || mongoose.model('StockActivity', StockActivitySchema);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function parseScreenerNews(html, symbol, maxNews) {
  const $ = cheerio.load(html);
  const newsItems = [];

  $('h2, h3, h4').each((i, heading) => {
    const $heading = $(heading);
    const headingText = $heading.text().trim();

    if (headingText.toLowerCase().includes('announcement')) {
      const $nextElement = $heading.next();

      if ($nextElement.hasClass('show-more-box')) {
        $nextElement.find('li').each((j, li) => {
          if (newsItems.length >= maxNews) return false;

          try {
            const $li = $(li);
            const $link = $li.find('a');

            if ($link.length > 0) {
              const headline = $link.contents().first().text().trim();
              const sourceUrl = $link.attr('href');

              let dateText = '';
              const $dateSpan = $li.find('span.smaller, div.smaller, span.ink-600');
              if ($dateSpan.length > 0) {
                dateText = $dateSpan.first().text().trim();
              }

              if (!dateText) {
                const fullText = $li.text().trim();
                const dateMatch = fullText.match(/^(\d+d?|(\d{1,2}\s+\w{3}))/);
                if (dateMatch) {
                  dateText = dateMatch[0];
                }
              }

              if (headline && headline.length > 10) {
                const publishedAt = parseScreenerDate(dateText || 'today');
                newsItems.push({
                  headline,
                  publishedAt,
                  sourceUrl,
                  source: 'Screener.in'
                });
              }
            }
          } catch (error) {
            console.error(`    ⚠️  Error parsing item: ${error.message}`);
          }
        });
      }
    }
  });

  return newsItems;
}

function parseScreenerDate(dateStr) {
  if (!dateStr || dateStr === 'today') {
    return new Date();
  }

  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const str = dateStr.trim();

  const daysAgoMatch = str.match(/^(\d+)d$/i);
  if (daysAgoMatch) {
    const daysAgo = parseInt(daysAgoMatch[1]);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  const parts = str.split(/\s+/);
  if (parts.length === 2) {
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const currentYear = new Date().getFullYear();

    if (!isNaN(day) && month !== undefined) {
      return new Date(currentYear, month, day);
    }
  }

  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = 2000 + parseInt(parts[2]);

    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  return new Date();
}

async function syncStock(symbol, hasExistingNews) {
  const maxNews = hasExistingNews ? CONFIG.maxNewsForExistingStock : CONFIG.maxNewsForNewStock;
  const newsType = hasExistingNews ? '🔄 update' : '🆕 new';

  console.log(`\n📈 ${symbol} (${newsType}) - will fetch up to ${maxNews} news`);

  try {
    const url = `https://www.screener.in/company/${symbol}/`;
    console.log(`   🌐 Fetching: ${url}`);

    const response = await axios.get(url, {
      timeout: CONFIG.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    console.log(`   ✅ Response: HTTP ${response.status}`);

    const newsItems = parseScreenerNews(response.data, symbol, maxNews);
    console.log(`   📊 Found ${newsItems.length} news items`);

    let added = 0;
    let skipped = 0;

    for (const newsItem of newsItems) {
      try {
        await StockActivity.create({
          stockSymbol: symbol,
          activityType: 'news-article',
          headline: newsItem.headline,
          publishedAt: newsItem.publishedAt,
          source: newsItem.source,
          sourceUrl: newsItem.sourceUrl,
          feedType: 'news-article',
          isActive: true
        });
        added++;
      } catch (error) {
        if (error.code === 11000) {
          skipped++;
          if (hasExistingNews) {
            console.log(`   🛑 Hit existing news, stopping...`);
            break;
          }
        }
      }
    }

    console.log(`   ✅ Result: +${added} new, ${skipped} duplicates`);
    await delay(CONFIG.delayBetweenRequests);

    return { symbol, added, skipped, status: 'success', hasExistingNews };
  } catch (error) {
    const errorMsg = error.response?.status ? `HTTP ${error.response.status}` : error.message;
    console.log(`   ❌ Error: ${errorMsg}`);
    return { symbol, added: 0, skipped: 0, status: 'error', error: errorMsg, hasExistingNews };
  }
}

async function testSync() {
  console.log('🧪 Testing Stock News Sync from Screener.in...\n');
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`📊 Testing with ${TEST_STOCKS.length} stocks: ${TEST_STOCKS.join(', ')}\n`);

    // Check which stocks have existing news
    console.log('🔍 Checking which stocks already have news...');
    const stocksWithNews = await StockActivity.distinct('stockSymbol');
    const stocksWithNewsSet = new Set(stocksWithNews);

    const testStocksWithNews = TEST_STOCKS.filter(s => stocksWithNewsSet.has(s));
    const testStocksWithoutNews = TEST_STOCKS.filter(s => !stocksWithNewsSet.has(s));

    console.log(`   📰 With existing news: ${testStocksWithNews.length}`);
    console.log(`   🆕 Without news: ${testStocksWithoutNews.length}\n`);
    console.log('='.repeat(60));

    let totalAdded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const symbol of TEST_STOCKS) {
      const hasExistingNews = stocksWithNewsSet.has(symbol);
      const result = await syncStock(symbol, hasExistingNews);

      if (result.status === 'success') {
        totalAdded += result.added;
        totalSkipped += result.skipped;
      } else {
        totalErrors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Stocks tested: ${TEST_STOCKS.length}`);
    console.log(`➕ New news added: ${totalAdded}`);
    console.log(`⏭️  Duplicates skipped: ${totalSkipped}`);
    console.log(`❌ Errors: ${totalErrors}`);
    console.log('='.repeat(60));

    console.log(`\n⏰ Completed at: ${new Date().toLocaleString()}`);
    console.log('✨ Test completed!\n');

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

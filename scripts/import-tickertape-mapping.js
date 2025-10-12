/**
 * Import Tickertape Symbol Mapping from stockData.json
 *
 * This script imports Tickertape symbol mappings (sid) from stockData.json
 * and updates the EquityStock collection with screenerId field.
 * The screenerId is used by Tickertape API (e.g., RELI for RELIANCE).
 *
 * Usage: node scripts/import-screener-slugs.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_CONNECTION_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_CONNECTION_URI is not defined in .env.local');
  process.exit(1);
}

// Stock Data JSON path
const STOCK_DATA_PATH = 'C:/Users/QSS/Downloads/stockData2.json';

// Define Schema
const EquityStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  screenerSlug: { type: String },
  screenerId: { type: String }
});

const EquityStock = mongoose.models.EquityStock || mongoose.model('EquityStock', EquityStockSchema);

async function importSlugMapping() {
  console.log('🚀 Starting Tickertape mapping import...\n');
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);

  try {
    // Check if file exists
    if (!fs.existsSync(STOCK_DATA_PATH)) {
      console.error(`❌ Error: File not found at ${STOCK_DATA_PATH}`);
      console.error('Please ensure the stockData2.json file is in the Downloads folder.');
      process.exit(1);
    }

    // Read and parse JSON file
    console.log(`📂 Reading file: ${STOCK_DATA_PATH}`);
    const fileContent = fs.readFileSync(STOCK_DATA_PATH, 'utf8');
    const stockData = JSON.parse(fileContent);
    console.log(`✅ Loaded ${stockData.length} stocks from file\n`);

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get stocks without news (screenerId is null or missing)
    const stocksWithoutNews = await EquityStock.find({
      $or: [
        { screenerId: { $exists: false } },
        { screenerId: null },
        { screenerId: '' }
      ]
    }).select('symbol');

    const stocksWithoutNewsSymbols = new Set(stocksWithoutNews.map(s => s.symbol));
    console.log(`📊 Found ${stocksWithoutNewsSymbols.size} stocks without Tickertape mapping\n`);

    let updated = 0;
    let notFound = 0;
    let skipped = 0;
    let errors = 0;
    const notFoundStocks = [];

    console.log('📊 Processing stocks (only updating stocks without Tickertape mapping)...\n');

    for (const item of stockData) {
      try {
        const { ticker, slug, sid, name } = item;

        // Skip if stock is not in our "without news" list
        if (!stocksWithoutNewsSymbols.has(ticker)) {
          skipped++;
          continue;
        }

        // Update stock with slug information
        const result = await EquityStock.updateOne(
          { symbol: ticker },
          {
            $set: {
              screenerSlug: slug,
              screenerId: sid
            }
          }
        );

        if (result.matchedCount > 0) {
          updated++;
          if (updated % 50 === 0) {
            console.log(`  ✅ Processed ${updated} stocks...`);
          }
        } else {
          notFound++;
          notFoundStocks.push({ ticker, name });
        }
      } catch (error) {
        errors++;
        console.error(`  ❌ Error processing ${item.ticker}: ${error.message}`);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total stocks in file: ${stockData.length}`);
    console.log(`⏭️  Stocks skipped (already have mapping): ${skipped}`);
    console.log(`➕ Stocks updated: ${updated}`);
    console.log(`⚠️  Stocks not found in DB: ${notFound}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(60));

    // Show some stocks not found (first 20)
    if (notFoundStocks.length > 0) {
      console.log('\n⚠️  Sample stocks not found in database (first 20):');
      notFoundStocks.slice(0, 20).forEach(stock => {
        console.log(`  - ${stock.ticker}: ${stock.name}`);
      });
      if (notFoundStocks.length > 20) {
        console.log(`  ... and ${notFoundStocks.length - 20} more`);
      }
      console.log('\n💡 These stocks may not be in your EquityStock collection yet.');
    }

    console.log(`\n⏰ Completed at: ${new Date().toLocaleString()}`);
    console.log('✨ Import completed successfully!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the import
importSlugMapping()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

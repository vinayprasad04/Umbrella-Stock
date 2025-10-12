/**
 * Quick script to update a single stock's Tickertape mapping
 * Usage: node scripts/update-single-mapping.js SYMBOL
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_CONNECTION_URI;
const STOCK_DATA_PATH = 'C:/Users/QSS/Downloads/stockData2.json';

const EquityStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  companyName: String,
  screenerSlug: String,
  screenerId: String
});

const EquityStock = mongoose.models.EquityStock || mongoose.model('EquityStock', EquityStockSchema);

async function updateMapping(symbol) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Read stock data
    const stockData = JSON.parse(fs.readFileSync(STOCK_DATA_PATH, 'utf8'));
    const stockInfo = stockData.find(s => s.ticker === symbol);

    if (!stockInfo) {
      console.error(`❌ ${symbol} not found in stockData2.json`);
      process.exit(1);
    }

    console.log(`📊 Found in JSON:`, stockInfo);

    // Update in database
    const result = await EquityStock.updateOne(
      { symbol: symbol },
      {
        $set: {
          screenerSlug: stockInfo.slug,
          screenerId: stockInfo.sid
        }
      }
    );

    console.log(`\n✅ Update result:`, result);

    // Verify
    const updated = await EquityStock.findOne({ symbol: symbol }).select('symbol screenerId screenerSlug companyName');
    console.log(`\n✅ Updated stock:`, updated);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

const symbol = process.argv[2];
if (!symbol) {
  console.error('Usage: node scripts/update-single-mapping.js SYMBOL');
  process.exit(1);
}

updateMapping(symbol.toUpperCase())
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

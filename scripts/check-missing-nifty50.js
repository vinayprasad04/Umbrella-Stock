const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Expected Nifty 50 stocks from nifty-indices-data.ts
const EXPECTED_NIFTY_50 = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "HINDUNILVR", "ICICIBANK", "SBIN",
  "BHARTIARTL", "ITC", "HCLTECH", "KOTAKBANK", "LT", "ASIANPAINT", "AXISBANK",
  "MARUTI", "SUNPHARMA", "TITAN", "NTPC", "NESTLEIND", "WIPRO", "ULTRACEMCO",
  "BAJFINANCE", "POWERGRID", "ONGC", "M&M", "TATAMOTORS", "TECHM", "COALINDIA",
  "JSWSTEEL", "TATASTEEL", "BAJAJFINSV", "DRREDDY", "GRASIM", "HINDPETRO",
  "INDUSINDBK", "DIVISLAB", "BRITANNIA", "CIPLA", "EICHERMOT", "HEROMOTOCO",
  "ADANIPORTS", "APOLLOHOSP", "BPCL", "SHREECEM", "HINDALCO", "TATACONSUM",
  "UPL", "SBILIFE", "HDFCLIFE", "LTIM"
];

async function checkMissingStocks() {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('actualstockdetails');

    // Get stocks that have NIFTY_50 in their niftyIndices
    const nifty50InDb = await collection.find({
      'additionalInfo.niftyIndices': 'NIFTY_50'
    }).project({ symbol: 1 }).toArray();

    const nifty50Symbols = nifty50InDb.map(s => s.symbol);

    console.log('=== ANALYSIS ===\n');
    console.log(`Expected Nifty 50 stocks: ${EXPECTED_NIFTY_50.length}`);
    console.log(`Found in database: ${nifty50Symbols.length}\n`);

    // Find missing stocks (expected but not in DB)
    const missingFromDb = EXPECTED_NIFTY_50.filter(symbol => !nifty50Symbols.includes(symbol));

    console.log(`Missing from database (${missingFromDb.length} stocks):`);
    for (const symbol of missingFromDb) {
      // Check if the stock exists in DB at all
      const stockExists = await collection.findOne({ symbol: symbol });
      if (stockExists) {
        const hasNiftyIndices = stockExists.additionalInfo?.niftyIndices || [];
        console.log(`  - ${symbol} (EXISTS in DB but missing NIFTY_50 tag, has: [${hasNiftyIndices.join(', ')}])`);
      } else {
        console.log(`  - ${symbol} (NOT IN DATABASE AT ALL)`);
      }
    }

    // Find extra stocks (in DB but not expected)
    const extraInDb = nifty50Symbols.filter(symbol => !EXPECTED_NIFTY_50.includes(symbol));

    console.log(`\nExtra stocks in database (${extraInDb.length} stocks):`);
    extraInDb.forEach(symbol => {
      console.log(`  + ${symbol} (has NIFTY_50 tag but not in expected list)`);
    });

    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMissingStocks();

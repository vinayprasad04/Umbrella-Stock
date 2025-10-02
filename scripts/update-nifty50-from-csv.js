const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// All 50 stocks from MW-NIFTY-50-02-Oct-2025.csv
const CURRENT_NIFTY_50_STOCKS = [
  "TATAMOTORS", "SHRIRAMFIN", "KOTAKBANK", "TRENT", "ADANIENT",
  "SUNPHARMA", "AXISBANK", "JIOFIN", "DRREDDY", "ICICIBANK",
  "HDFCBANK", "ONGC", "ADANIPORTS", "GRASIM", "TECHM",
  "NESTLEIND", "M&M", "ETERNAL", "TATACONSUM", "TITAN",
  "WIPRO", "TCS", "ITC", "HDFCLIFE", "HINDUNILVR",
  "BEL", "LT", "APOLLOHOSP", "SBILIFE", "CIPLA",
  "HINDALCO", "RELIANCE", "HCLTECH", "INFY", "POWERGRID",
  "JSWSTEEL", "BAJAJFINSV", "INDIGO", "COALINDIA", "NTPC",
  "EICHERMOT", "MAXHEALTH", "MARUTI", "ASIANPAINT", "BHARTIARTL",
  "BAJAJ-AUTO", "TATASTEEL", "ULTRACEMCO", "SBIN", "BAJFINANCE"
];

async function updateNifty50() {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('actualstockdetails');

    console.log(`📊 Processing ${CURRENT_NIFTY_50_STOCKS.length} Nifty 50 stocks...\n`);

    let updated = 0;
    let notFound = 0;
    let alreadyHad = 0;
    let removed = 0;

    // Step 1: Remove NIFTY_50 from all stocks first
    console.log('Step 1: Removing NIFTY_50 tag from all stocks...');
    const removeResult = await collection.updateMany(
      { 'additionalInfo.niftyIndices': 'NIFTY_50' },
      { $pull: { 'additionalInfo.niftyIndices': 'NIFTY_50' } }
    );
    removed = removeResult.modifiedCount;
    console.log(`   Removed NIFTY_50 from ${removed} stocks\n`);

    // Step 2: Add NIFTY_50 to current 50 stocks
    console.log('Step 2: Adding NIFTY_50 to current 50 stocks...');

    for (const symbol of CURRENT_NIFTY_50_STOCKS) {
      const stock = await collection.findOne({ symbol: symbol });

      if (!stock) {
        console.log(`   ❌ ${symbol} - NOT FOUND in database`);
        notFound++;
        continue;
      }

      // Check if already has NIFTY_50 (shouldn't happen after Step 1, but just in case)
      const currentIndices = stock.additionalInfo?.niftyIndices || [];
      if (currentIndices.includes('NIFTY_50')) {
        console.log(`   ⚠️  ${symbol} - Already has NIFTY_50`);
        alreadyHad++;
        continue;
      }

      // Add NIFTY_50 to the stock
      await collection.updateOne(
        { symbol: symbol },
        { $addToSet: { 'additionalInfo.niftyIndices': 'NIFTY_50' } }
      );

      console.log(`   ✅ ${symbol} - Added NIFTY_50`);
      updated++;
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total stocks to process:    ${CURRENT_NIFTY_50_STOCKS.length}`);
    console.log(`Removed NIFTY_50 from:      ${removed} stocks`);
    console.log(`Successfully updated:       ${updated} stocks`);
    console.log(`Already had NIFTY_50:       ${alreadyHad} stocks`);
    console.log(`Not found in database:      ${notFound} stocks`);
    console.log('='.repeat(50));

    if (notFound > 0) {
      console.log('\n⚠️  Missing stocks that need to be added to database:');
      for (const symbol of CURRENT_NIFTY_50_STOCKS) {
        const stock = await collection.findOne({ symbol: symbol });
        if (!stock) {
          console.log(`   - ${symbol}`);
        }
      }
    }

    // Verify final count
    const finalCount = await collection.countDocuments({
      'additionalInfo.niftyIndices': 'NIFTY_50'
    });
    console.log(`\n✅ Final verification: ${finalCount} stocks have NIFTY_50 tag`);

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateNifty50();

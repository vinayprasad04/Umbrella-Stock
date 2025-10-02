const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Map CSV files to Nifty index enum values
const NIFTY_INDEX_FILES = [
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-50-02-Oct-2025.csv', index: 'NIFTY_50' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-100-02-Oct-2025.csv', index: 'NIFTY_100' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-200-02-Oct-2025.csv', index: 'NIFTY_200' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-500-02-Oct-2025.csv', index: 'NIFTY_500' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-NEXT-50-02-Oct-2025.csv', index: 'NIFTY_NEXT_50' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-BANK-02-Oct-2025.csv', index: 'NIFTY_BANK' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-FINANCIAL-SERVICES-02-Oct-2025.csv', index: 'NIFTY_FINANCIAL_SERVICES' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDCAP-SELECT-02-Oct-2025.csv', index: 'NIFTY_MIDCAP_SELECT' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDCAP-50-02-Oct-2025.csv', index: 'NIFTY_MIDCAP_50' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDCAP-100-02-Oct-2025.csv', index: 'NIFTY_MIDCAP_100' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDCAP-150-02-Oct-2025.csv', index: 'NIFTY_MIDCAP_150' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-SMALLCAP-50-02-Oct-2025.csv', index: 'NIFTY_SMALLCAP_50' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-SMALLCAP-100-02-Oct-2025.csv', index: 'NIFTY_SMALLCAP_100' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-SMALLCAP-250-02-Oct-2025.csv', index: 'NIFTY_SMALLCAP_250' },
  { file: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDSMALLCAP-400-02-Oct-2025.csv', index: 'NIFTY_MIDSMALLCAP_400' }
];

function parseCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const symbols = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Extract symbol from CSV (first column)
      const match = line.match(/^"([^"]+)"/);
      if (match && match[1]) {
        const symbol = match[1].trim();
        // Skip header rows (like "NIFTY 100", "NIFTY 200", etc.)
        if (!symbol.includes('NIFTY') && !symbol.includes('Symbol')) {
          symbols.push(symbol);
        }
      }
    }

    return symbols;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

async function importAllNiftyIndices() {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('actualstockdetails');

    const summary = {
      total: 0,
      byIndex: {}
    };

    console.log('🚀 Starting import of all Nifty indices...\n');

    for (const { file, index } of NIFTY_INDEX_FILES) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 Processing: ${index}`);
      console.log(`📁 File: ${path.basename(file)}`);
      console.log('='.repeat(60));

      if (!fs.existsSync(file)) {
        console.log(`⚠️  File not found, skipping...`);
        summary.byIndex[index] = { skipped: true };
        continue;
      }

      // Parse CSV to get symbols
      const symbols = parseCSV(file);
      console.log(`📋 Found ${symbols.length} stocks in CSV`);

      if (symbols.length === 0) {
        console.log(`⚠️  No symbols found, skipping...`);
        summary.byIndex[index] = { found: 0, updated: 0, notFound: 0 };
        continue;
      }

      // Step 1: Remove this index from all stocks
      console.log(`🧹 Removing ${index} from all stocks...`);
      const removeResult = await collection.updateMany(
        { 'additionalInfo.niftyIndices': index },
        { $pull: { 'additionalInfo.niftyIndices': index } }
      );
      console.log(`   Removed from ${removeResult.modifiedCount} stocks`);

      // Step 2: Add index to stocks in the CSV
      let updated = 0;
      let notFound = 0;

      for (const symbol of symbols) {
        const stock = await collection.findOne({ symbol: symbol });

        if (!stock) {
          notFound++;
          continue;
        }

        await collection.updateOne(
          { symbol: symbol },
          { $addToSet: { 'additionalInfo.niftyIndices': index } }
        );
        updated++;
      }

      console.log(`✅ Updated: ${updated} stocks`);
      console.log(`❌ Not found: ${notFound} stocks`);

      summary.byIndex[index] = {
        found: symbols.length,
        updated: updated,
        notFound: notFound
      };
      summary.total += updated;
    }

    // Final summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📈 FINAL SUMMARY');
    console.log('='.repeat(60));

    for (const [index, stats] of Object.entries(summary.byIndex)) {
      if (stats.skipped) {
        console.log(`${index}: SKIPPED (file not found)`);
      } else {
        console.log(`${index}: ${stats.updated}/${stats.found} updated (${stats.notFound} not found)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Total stocks updated: ${summary.total}`);
    console.log('='.repeat(60));

    // Verify counts
    console.log('\n📊 Verification - Stock counts by index:');
    for (const { index } of NIFTY_INDEX_FILES) {
      const count = await collection.countDocuments({
        'additionalInfo.niftyIndices': index
      });
      console.log(`   ${index}: ${count} stocks`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

importAllNiftyIndices();

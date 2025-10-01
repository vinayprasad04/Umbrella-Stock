const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// All CSV file mappings including new ones
const csvFiles = [
  // Main indices
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-50-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_50',
    name: 'Nifty 50'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-100-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_100',
    name: 'Nifty 100'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-200-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_200',
    name: 'Nifty 200'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-500-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_500',
    name: 'Nifty 500'
  },
  // Sectoral indices
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-BANK-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_BANK',
    name: 'Nifty Bank'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-FINANCIAL-SERVICES-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_FINANCIAL_SERVICES',
    name: 'Nifty Financial Services'
  },
  // Market cap based indices
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDCAP-SELECT-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_MIDCAP_SELECT',
    name: 'Nifty Midcap Select'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDCAP-50-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_MIDCAP_50',
    name: 'Nifty Midcap 50'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDCAP-100-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_MIDCAP_100',
    name: 'Nifty Midcap 100'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDCAP-150-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_MIDCAP_150',
    name: 'Nifty Midcap 150'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-SMALLCAP-50-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_SMALLCAP_50',
    name: 'Nifty Smallcap 50'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-SMALLCAP-100-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_SMALLCAP_100',
    name: 'Nifty Smallcap 100'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-SMALLCAP-250-30-Sep-2025.csv',
    niftyIndex: 'NIFTY_SMALLCAP_250',
    name: 'Nifty Smallcap 250'
  }
];

// Define schemas directly
const Schema = mongoose.Schema;

const ActualStockDetailSchema = new Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  companyName: {
    type: String,
    required: true,
    index: 'text'
  },
  // ... other fields remain the same ...
  additionalInfo: {
    description: { type: String },
    website: { type: String },
    sector: { type: String, index: true },
    industry: { type: String, index: true },
    managementTeam: [{ type: String }],
    niftyIndex: {
      type: String,
      enum: ['NIFTY_50', 'NIFTY_100', 'NIFTY_200', 'NIFTY_500', 'NOT_LISTED'],
      index: true
    },
    niftyIndices: [{
      type: String,
      enum: ['NIFTY_50', 'NIFTY_100', 'NIFTY_200', 'NIFTY_500', 'NIFTY_NEXT_50', 'NIFTY_BANK', 'NIFTY_FINANCIAL_SERVICES', 'NIFTY_MIDCAP_SELECT', 'NIFTY_MIDCAP_50', 'NIFTY_MIDCAP_100', 'NIFTY_MIDCAP_150', 'NIFTY_SMALLCAP_50', 'NIFTY_SMALLCAP_100', 'NIFTY_SMALLCAP_250'],
      index: true
    }]
  }
  // ... other fields
}, { timestamps: true });

const ActualStockDetail = mongoose.models.ActualStockDetail || mongoose.model('ActualStockDetail', ActualStockDetailSchema);

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/umbrella-stock';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Parse CSV file and extract stock symbols
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const stocks = [];

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      resolve([]);
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv({
        skipEmptyLines: true,
        skipLinesWithError: true
      }))
      .on('data', (row) => {
        // Try different possible column names for SYMBOL
        const symbolKeys = Object.keys(row).filter(key =>
          key.toLowerCase().includes('symbol') || key.includes('SYMBOL')
        );

        let symbol = null;
        if (symbolKeys.length > 0) {
          symbol = row[symbolKeys[0]];
        }

        if (symbol && !symbol.includes('NIFTY')) {
          // Clean the symbol (remove any extra characters/quotes but keep &, -, and alphanumeric)
          const cleanSymbol = symbol.replace(/[^A-Z0-9&-]/g, '').trim();
          if (cleanSymbol.length > 0) {
            stocks.push(cleanSymbol);
          }
        }
      })
      .on('end', () => {
        resolve([...new Set(stocks)]); // Remove duplicates
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Determine primary classification based on hierarchy
const getPrimaryClassification = (indices) => {
  const hierarchy = ['NIFTY_50', 'NIFTY_100', 'NIFTY_200', 'NIFTY_500'];
  for (const index of hierarchy) {
    if (indices.includes(index)) {
      return index;
    }
  }
  return 'NOT_LISTED';
};

// Import all Nifty indices
const importAllNiftyIndices = async () => {
  try {
    console.log('🚀 Starting comprehensive Nifty indices import...');
    await connectDB();

    // Step 1: Collect all stocks and their indices
    const stockIndicesMap = new Map(); // symbol -> Set of indices

    console.log('\n📊 Processing all CSV files...');
    for (const csvFile of csvFiles) {
      console.log(`\n📁 Processing ${csvFile.name}...`);

      try {
        const stocks = await parseCSV(csvFile.path);
        console.log(`   Found ${stocks.length} stocks`);

        for (const symbol of stocks) {
          if (!stockIndicesMap.has(symbol)) {
            stockIndicesMap.set(symbol, new Set());
          }
          stockIndicesMap.get(symbol).add(csvFile.niftyIndex);
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${csvFile.name}: ${error.message}`);
      }
    }

    console.log(`\n📈 Total unique stocks found: ${stockIndicesMap.size}`);

    // Step 2: Update database with multiple indices
    console.log('\n🔄 Updating database with multiple Nifty classifications...');

    let totalProcessed = 0;
    let totalUpdated = 0;

    for (const [symbol, indicesSet] of stockIndicesMap) {
      const indices = Array.from(indicesSet);
      const primaryIndex = getPrimaryClassification(indices);

      try {
        const result = await ActualStockDetail.updateOne(
          { symbol },
          {
            $set: {
              'additionalInfo.niftyIndex': primaryIndex,
              'additionalInfo.niftyIndices': indices,
              lastUpdated: new Date()
            }
          }
        );

        if (result.matchedCount > 0) {
          totalUpdated++;
        }
      } catch (error) {
        console.error(`   ❌ Error updating ${symbol}: ${error.message}`);
      }

      totalProcessed++;
      if (totalProcessed % 100 === 0) {
        console.log(`   ✅ Processed ${totalProcessed} stocks...`);
      }
    }

    console.log('\n📈 Import Complete!');
    console.log(`📊 Summary:`);
    console.log(`   Total stocks processed: ${totalProcessed}`);
    console.log(`   Stocks updated: ${totalUpdated}`);

    // Step 3: Generate statistics
    console.log('\n📊 Generating statistics...');

    for (const csvFile of csvFiles) {
      const count = await ActualStockDetail.countDocuments({
        'additionalInfo.niftyIndices': csvFile.niftyIndex
      });
      console.log(`   ${csvFile.name}: ${count} stocks`);
    }

    // Show some examples
    console.log('\n📋 Sample stocks with multiple indices:');
    const samples = await ActualStockDetail.find({
      'additionalInfo.niftyIndices': { $exists: true, $not: { $size: 0 } }
    })
    .limit(5)
    .select('symbol additionalInfo.niftyIndices');

    samples.forEach(stock => {
      console.log(`   ${stock.symbol}: [${stock.additionalInfo.niftyIndices.join(', ')}]`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
};

// Main execution
if (require.main === module) {
  importAllNiftyIndices();
}

module.exports = {
  importAllNiftyIndices,
  parseCSV,
  getPrimaryClassification
};
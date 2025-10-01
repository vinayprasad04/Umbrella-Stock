const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// CSV file mappings
const csvFiles = [
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
  }
];

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

        if (symbol && symbol !== 'NIFTY 50' && symbol !== 'NIFTY 100' && symbol !== 'NIFTY 200' && symbol !== 'NIFTY 500') {
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

// Check missing stocks
const checkMissingStocks = async () => {
  try {
    console.log('🚀 Starting missing stocks analysis...');
    await connectDB();

    const db = mongoose.connection.db;
    const equityStocksCollection = db.collection('equitystocks');
    const actualStockDetailsCollection = db.collection('actualstockdetails');

    // Get all existing symbols from both collections
    const existingEquitySymbols = await equityStocksCollection.distinct('symbol');
    const existingActualSymbols = await actualStockDetailsCollection.distinct('symbol');

    console.log(`📊 Existing symbols in EquityStocks: ${existingEquitySymbols.length}`);
    console.log(`📊 Existing symbols in ActualStockDetails: ${existingActualSymbols.length}`);

    // Collect all symbols from CSV files
    const allCsvSymbols = new Set();
    const csvSymbolsByFile = {};

    for (const csvFile of csvFiles) {
      console.log(`\n📁 Processing ${csvFile.name}...`);
      const stocks = await parseCSV(csvFile.path);
      console.log(`📋 Found ${stocks.length} stocks in ${csvFile.name}`);

      csvSymbolsByFile[csvFile.name] = stocks;
      stocks.forEach(symbol => allCsvSymbols.add(symbol));
    }

    console.log(`\n📈 Total unique symbols in CSV files: ${allCsvSymbols.size}`);

    // Find missing stocks
    const missingFromEquity = [];
    const missingFromActual = [];

    for (const symbol of allCsvSymbols) {
      if (!existingEquitySymbols.includes(symbol)) {
        missingFromEquity.push(symbol);
      }
      if (!existingActualSymbols.includes(symbol)) {
        missingFromActual.push(symbol);
      }
    }

    console.log(`\n🔍 Analysis Results:`);
    console.log(`   Missing from EquityStocks: ${missingFromEquity.length}`);
    console.log(`   Missing from ActualStockDetails: ${missingFromActual.length}`);

    if (missingFromEquity.length > 0) {
      console.log(`\n📋 Missing from EquityStocks (first 10):`);
      missingFromEquity.slice(0, 10).forEach(symbol => {
        console.log(`   - ${symbol}`);
      });
      if (missingFromEquity.length > 10) {
        console.log(`   ... and ${missingFromEquity.length - 10} more`);
      }
    }

    if (missingFromActual.length > 0) {
      console.log(`\n📋 Missing from ActualStockDetails (first 10):`);
      missingFromActual.slice(0, 10).forEach(symbol => {
        console.log(`   - ${symbol}`);
      });
      if (missingFromActual.length > 10) {
        console.log(`   ... and ${missingFromActual.length - 10} more`);
      }
    }

    // Check if any CSV symbols exist in collections but not in CSV
    const extraInEquity = existingEquitySymbols.filter(symbol => !allCsvSymbols.has(symbol));
    const extraInActual = existingActualSymbols.filter(symbol => !allCsvSymbols.has(symbol));

    console.log(`\n📊 Additional Analysis:`);
    console.log(`   Stocks in EquityStocks but not in CSV: ${extraInEquity.length}`);
    console.log(`   Stocks in ActualStockDetails but not in CSV: ${extraInActual.length}`);

    // Summary for each CSV file
    console.log(`\n📁 Breakdown by CSV file:`);
    for (const [fileName, symbols] of Object.entries(csvSymbolsByFile)) {
      const missingFromEquityFile = symbols.filter(symbol => !existingEquitySymbols.includes(symbol));
      const missingFromActualFile = symbols.filter(symbol => !existingActualSymbols.includes(symbol));

      console.log(`   ${fileName}:`);
      console.log(`     - Total symbols: ${symbols.length}`);
      console.log(`     - Missing from EquityStocks: ${missingFromEquityFile.length}`);
      console.log(`     - Missing from ActualStockDetails: ${missingFromActualFile.length}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');

    // Return missing stocks for use by add script
    return {
      missingFromEquity,
      missingFromActual,
      allCsvSymbols: Array.from(allCsvSymbols),
      csvSymbolsByFile
    };

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
};

// Main execution
if (require.main === module) {
  checkMissingStocks();
}

module.exports = {
  checkMissingStocks,
  parseCSV
};
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define schemas
const Schema = mongoose.Schema;

const EquityStockSchema = new Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  companyName: { type: String, required: true },
  series: { type: String, required: true },
  dateOfListing: { type: Date, required: true },
  paidUpValue: { type: Number, required: true },
  marketLot: { type: Number, required: true },
  isinNumber: { type: String, required: true, unique: true },
  faceValue: { type: Number, required: true },
  sector: { type: String, index: true },
  isActive: { type: Boolean, default: true },
  hasActualData: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

const ActualStockDetailSchema = new Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  companyName: { type: String, required: true },
  additionalInfo: {
    sector: { type: String, index: true },
    industry: { type: String, index: true },
    niftyIndices: [{ type: String }]
  }
}, { timestamps: true, strict: false });

const EquityStock = mongoose.models.EquityStock || mongoose.model('EquityStock', EquityStockSchema);
const ActualStockDetail = mongoose.models.ActualStockDetail || mongoose.model('ActualStockDetail', ActualStockDetailSchema);

// Map of index name to sector name
const INDEX_TO_SECTOR = {
  'NIFTY_AUTO': 'Automobile',
  'NIFTY_FINANCIAL_SERVICES_25_50': 'Financial Services',
  'NIFTY_FMCG': 'FMCG',
  'NIFTY_IT': 'IT',
  'NIFTY_MEDIA': 'Media',
  'NIFTY_METAL': 'Metals',
  'NIFTY_PHARMA': 'Pharma',
  'NIFTY_PSU_BANK': 'PSU Banks',
  'NIFTY_REALTY': 'Realty',
  'NIFTY_PRIVATE_BANK': 'Private Banks',
  'NIFTY_HEALTHCARE_INDEX': 'Healthcare',
  'NIFTY_CONSUMER_DURABLES': 'Consumer Durables',
  'NIFTY_OIL_GAS': 'Oil & Gas',
  'NIFTY_MIDSMALL_HEALTHCARE': 'Healthcare',
  'NIFTY_FINANCIAL_SERVICES_EX_BANK': 'Financial Services',
  'NIFTY_MIDSMALL_FINANCIAL_SERVICES': 'Financial Services',
  'NIFTY_MIDSMALL_IT_TELECOM': 'IT & Telecom',
  'NIFTY_BANK': 'Banks',
  'NIFTY_FINANCIAL_SERVICES': 'Financial Services'
};

// CSV file mappings
const csvFiles = [
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-AUTO-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_AUTO',
    sector: 'Automobile'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-FINANCIAL-SERVICES-25_50-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_FINANCIAL_SERVICES_25_50',
    sector: 'Financial Services'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-FMCG-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_FMCG',
    sector: 'FMCG'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-IT-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_IT',
    sector: 'IT'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MEDIA-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_MEDIA',
    sector: 'Media'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-METAL-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_METAL',
    sector: 'Metals'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-PHARMA-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_PHARMA',
    sector: 'Pharma'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-PSU-BANK-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_PSU_BANK',
    sector: 'PSU Banks'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-REALTY-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_REALTY',
    sector: 'Realty'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-PRIVATE-BANK-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_PRIVATE_BANK',
    sector: 'Private Banks'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-HEALTHCARE-INDEX-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_HEALTHCARE_INDEX',
    sector: 'Healthcare'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-CONSUMER-DURABLES-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_CONSUMER_DURABLES',
    sector: 'Consumer Durables'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-OIL-&-GAS-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_OIL_GAS',
    sector: 'Oil & Gas'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDSMALL-HEALTHCARE-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_MIDSMALL_HEALTHCARE',
    sector: 'Healthcare'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-FINANCIAL-SERVICES-EX-BANK-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_FINANCIAL_SERVICES_EX_BANK',
    sector: 'Financial Services'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDSMALL-FINANCIAL-SERVICES-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_MIDSMALL_FINANCIAL_SERVICES',
    sector: 'Financial Services'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDSMALL-IT-&-TELECOM-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_MIDSMALL_IT_TELECOM',
    sector: 'IT & Telecom'
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

// Parse CSV and extract symbols
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const stocks = [];

    fs.createReadStream(filePath)
      .pipe(csv({
        skipEmptyLines: true,
        skipLinesWithError: true
      }))
      .on('data', (row) => {
        const symbolKeys = Object.keys(row).filter(key =>
          key.toLowerCase().includes('symbol') || key.includes('SYMBOL')
        );

        let symbol = null;
        if (symbolKeys.length > 0) {
          symbol = row[symbolKeys[0]];
        }

        // Skip index rows
        const skipPatterns = [
          'NIFTY AUTO', 'NIFTY FINANCIAL', 'NIFTY FMCG', 'NIFTY IT',
          'NIFTY MEDIA', 'NIFTY METAL', 'NIFTY PHARMA', 'NIFTY PSU',
          'NIFTY REALTY', 'NIFTY PRIVATE', 'NIFTY HEALTHCARE',
          'NIFTY CONSUMER', 'NIFTY OIL', 'NIFTY MIDSMALL'
        ];

        if (symbol) {
          const shouldSkip = skipPatterns.some(pattern => symbol.includes(pattern));

          if (!shouldSkip) {
            const cleanSymbol = symbol.replace(/[^A-Z0-9&-]/g, '').trim();
            if (cleanSymbol.length > 0) {
              stocks.push(cleanSymbol);
            }
          }
        }
      })
      .on('end', () => {
        resolve([...new Set(stocks)]);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Determine primary sector for a stock based on its indices
const determinePrimarySector = (niftyIndices) => {
  if (!niftyIndices || niftyIndices.length === 0) return null;

  // Priority order for sector determination (most specific first)
  const priorityOrder = [
    'NIFTY_AUTO', 'NIFTY_PHARMA', 'NIFTY_IT', 'NIFTY_FMCG', 'NIFTY_MEDIA',
    'NIFTY_METAL', 'NIFTY_REALTY', 'NIFTY_OIL_GAS', 'NIFTY_CONSUMER_DURABLES',
    'NIFTY_HEALTHCARE_INDEX', 'NIFTY_PRIVATE_BANK', 'NIFTY_PSU_BANK',
    'NIFTY_BANK', 'NIFTY_FINANCIAL_SERVICES', 'NIFTY_MIDSMALL_IT_TELECOM'
  ];

  for (const index of priorityOrder) {
    if (niftyIndices.includes(index)) {
      return INDEX_TO_SECTOR[index];
    }
  }

  return null;
};

// Import sectors from CSV files
const importSectorsFromCSV = async () => {
  try {
    console.log('🚀 Starting sector import from CSV files...');
    await connectDB();

    let totalProcessed = 0;
    let actualStockDetailsUpdated = 0;
    let equityStocksUpdated = 0;
    const stockSectorMap = new Map();

    // Collect all stocks and their sectors from CSV files
    console.log('📊 Collecting stock-sector mappings...');
    for (const csvFile of csvFiles) {
      if (!fs.existsSync(csvFile.path)) {
        console.log(`⚠️  File not found: ${csvFile.path}`);
        continue;
      }

      const stocks = await parseCSV(csvFile.path);
      console.log(`📋 ${csvFile.sector}: ${stocks.length} stocks`);

      for (const symbol of stocks) {
        if (!stockSectorMap.has(symbol)) {
          stockSectorMap.set(symbol, []);
        }
        stockSectorMap.get(symbol).push({
          sector: csvFile.sector,
          index: csvFile.niftyIndex
        });
      }
    }

    console.log(`\n📈 Total unique stocks found: ${stockSectorMap.size}`);

    // Update actualstockdetails collection
    console.log('\n🔄 Updating actualstockdetails collection...');
    for (const [symbol, sectorData] of stockSectorMap) {
      const existingStock = await ActualStockDetail.findOne({ symbol });

      if (existingStock) {
        // Determine primary sector based on indices
        const primarySector = determinePrimarySector(existingStock.additionalInfo?.niftyIndices);
        const sectorToUse = primarySector || sectorData[0].sector;

        await ActualStockDetail.updateOne(
          { symbol },
          {
            $set: {
              'additionalInfo.sector': sectorToUse,
              lastUpdated: new Date()
            }
          }
        );
        actualStockDetailsUpdated++;

        if (actualStockDetailsUpdated % 20 === 0) {
          console.log(`✅ Updated ${actualStockDetailsUpdated} stocks in actualstockdetails...`);
        }
      }

      totalProcessed++;
    }

    // Update equitystocks collection
    console.log('\n🔄 Updating equitystocks collection...');
    for (const [symbol, sectorData] of stockSectorMap) {
      const existingStock = await EquityStock.findOne({ symbol });

      if (existingStock) {
        // Get sector from actualstockdetails or use first sector from CSV
        const actualStock = await ActualStockDetail.findOne({ symbol });
        const sectorToUse = actualStock?.additionalInfo?.sector || sectorData[0].sector;

        await EquityStock.updateOne(
          { symbol },
          {
            $set: {
              sector: sectorToUse,
              lastUpdated: new Date()
            }
          }
        );
        equityStocksUpdated++;

        if (equityStocksUpdated % 20 === 0) {
          console.log(`✅ Updated ${equityStocksUpdated} stocks in equitystocks...`);
        }
      }
    }

    console.log('\n📈 Import Complete!');
    console.log(`📊 Summary:`);
    console.log(`   Total stocks processed: ${totalProcessed}`);
    console.log(`   ActualStockDetails updated: ${actualStockDetailsUpdated}`);
    console.log(`   EquityStocks updated: ${equityStocksUpdated}`);

    // Show sector breakdown
    console.log('\n🔍 Sector breakdown in actualstockdetails:');
    const sectorCounts = await ActualStockDetail.aggregate([
      { $match: { 'additionalInfo.sector': { $exists: true, $ne: null } } },
      { $group: { _id: '$additionalInfo.sector', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    sectorCounts.forEach(item => {
      console.log(`   ${item._id}: ${item.count} stocks`);
    });

    console.log('\n🔍 Sector breakdown in equitystocks:');
    const equitySectorCounts = await EquityStock.aggregate([
      { $match: { sector: { $exists: true, $ne: null } } },
      { $group: { _id: '$sector', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    equitySectorCounts.forEach(item => {
      console.log(`   ${item._id}: ${item.count} stocks`);
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
  importSectorsFromCSV();
}

module.exports = { importSectorsFromCSV };

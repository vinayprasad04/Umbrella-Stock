const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define schemas directly
const Schema = mongoose.Schema;

const YearlyDataSchema = new Schema({
  year: { type: String, required: true },
  value: { type: Number, required: true }
}, { _id: false });

const QuarterlyDataSchema = new Schema({
  quarter: { type: String, required: true },
  value: { type: Number, required: true }
}, { _id: false });

const UploadedFileSchema = new Schema({
  fileName: { type: String, required: true },
  fileType: { type: String, enum: ['excel', 'pdf', 'csv'], required: true },
  fileSize: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  filePath: { type: String }
}, { _id: false });

// ActualStockDetail Schema
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
  meta: {
    faceValue: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    marketCapitalization: { type: Number, required: true },
    numberOfShares: { type: Number }
  },
  profitAndLoss: {
    sales: [YearlyDataSchema],
    rawMaterialCost: [YearlyDataSchema],
    changeInInventory: [YearlyDataSchema],
    powerAndFuel: [YearlyDataSchema],
    otherMfrExp: [YearlyDataSchema],
    employeeCost: [YearlyDataSchema],
    sellingAndAdmin: [YearlyDataSchema],
    otherExpenses: [YearlyDataSchema],
    otherIncome: [YearlyDataSchema],
    depreciation: [YearlyDataSchema],
    interest: [YearlyDataSchema],
    profitBeforeTax: [YearlyDataSchema],
    tax: [YearlyDataSchema],
    netProfit: [YearlyDataSchema],
    dividendAmount: [YearlyDataSchema]
  },
  quarterlyData: {
    sales: [QuarterlyDataSchema],
    expenses: [QuarterlyDataSchema],
    otherIncome: [QuarterlyDataSchema],
    depreciation: [QuarterlyDataSchema],
    interest: [QuarterlyDataSchema],
    profitBeforeTax: [QuarterlyDataSchema],
    tax: [QuarterlyDataSchema],
    netProfit: [QuarterlyDataSchema],
    operatingProfit: [QuarterlyDataSchema]
  },
  balanceSheet: {
    equityShareCapital: [YearlyDataSchema],
    reserves: [YearlyDataSchema],
    borrowings: [YearlyDataSchema],
    otherLiabilities: [YearlyDataSchema],
    total: [YearlyDataSchema],
    netBlock: [YearlyDataSchema],
    capitalWorkInProgress: [YearlyDataSchema],
    investments: [YearlyDataSchema],
    otherAssets: [YearlyDataSchema],
    receivables: [YearlyDataSchema],
    inventory: [YearlyDataSchema],
    cashAndBank: [YearlyDataSchema],
    numberOfEquityShares: [YearlyDataSchema],
    newBonusShares: [YearlyDataSchema],
    faceValue: [YearlyDataSchema],
    adjustedEquityShares: [YearlyDataSchema]
  },
  cashFlow: {
    cashFromOperatingActivity: [YearlyDataSchema],
    cashFromInvestingActivity: [YearlyDataSchema],
    cashFromFinancingActivity: [YearlyDataSchema],
    netCashFlow: [YearlyDataSchema]
  },
  priceData: [YearlyDataSchema],
  sheetData: [{
    sheetName: { type: String, required: true },
    headers: [{ type: String }],
    rows: [{ type: Schema.Types.Mixed }],
    range: { type: String },
    totalRows: { type: Number }
  }],
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
      enum: [
        'NIFTY_50', 'NIFTY_100', 'NIFTY_200', 'NIFTY_500', 'NIFTY_NEXT_50',
        'NIFTY_BANK', 'NIFTY_FINANCIAL_SERVICES',
        'NIFTY_MIDCAP_SELECT', 'NIFTY_MIDCAP_50', 'NIFTY_MIDCAP_100', 'NIFTY_MIDCAP_150',
        'NIFTY_SMALLCAP_50', 'NIFTY_SMALLCAP_100', 'NIFTY_SMALLCAP_250',
        'NIFTY_AUTO', 'NIFTY_FINANCIAL_SERVICES_25_50', 'NIFTY_FMCG', 'NIFTY_IT',
        'NIFTY_MEDIA', 'NIFTY_METAL', 'NIFTY_PHARMA', 'NIFTY_PSU_BANK',
        'NIFTY_REALTY', 'NIFTY_PRIVATE_BANK', 'NIFTY_HEALTHCARE_INDEX',
        'NIFTY_CONSUMER_DURABLES', 'NIFTY_OIL_GAS', 'NIFTY_MIDSMALL_HEALTHCARE',
        'NIFTY_FINANCIAL_SERVICES_EX_BANK', 'NIFTY_MIDSMALL_FINANCIAL_SERVICES',
        'NIFTY_MIDSMALL_IT_TELECOM'
      ],
      index: true
    }]
  },
  ratios: {
    type: Schema.Types.Mixed,
    default: undefined
  },
  dataQuality: {
    type: String,
    required: true,
    enum: ['PENDING_VERIFICATION', 'VERIFIED', 'EXCELLENT', 'GOOD'],
    default: 'PENDING_VERIFICATION',
    index: true
  },
  enteredBy: {
    type: String,
    required: true
  },
  uploadedFiles: [UploadedFileSchema],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

const ActualStockDetail = mongoose.models.ActualStockDetail || mongoose.model('ActualStockDetail', ActualStockDetailSchema);

// CSV file mappings for sectoral indices
const csvFiles = [
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-AUTO-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_AUTO',
    name: 'Nifty Auto'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-FINANCIAL-SERVICES-25_50-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_FINANCIAL_SERVICES_25_50',
    name: 'Nifty Financial Services 25/50'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-FMCG-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_FMCG',
    name: 'Nifty FMCG'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-IT-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_IT',
    name: 'Nifty IT'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MEDIA-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_MEDIA',
    name: 'Nifty Media'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-METAL-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_METAL',
    name: 'Nifty Metal'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-PHARMA-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_PHARMA',
    name: 'Nifty Pharma'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-PSU-BANK-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_PSU_BANK',
    name: 'Nifty PSU Bank'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-REALTY-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_REALTY',
    name: 'Nifty Realty'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-PRIVATE-BANK-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_PRIVATE_BANK',
    name: 'Nifty Private Bank'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-HEALTHCARE-INDEX-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_HEALTHCARE_INDEX',
    name: 'Nifty Healthcare Index'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-CONSUMER-DURABLES-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_CONSUMER_DURABLES',
    name: 'Nifty Consumer Durables'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-OIL-&-GAS-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_OIL_GAS',
    name: 'Nifty Oil & Gas'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDSMALL-HEALTHCARE-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_MIDSMALL_HEALTHCARE',
    name: 'Nifty MidSmall Healthcare'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-FINANCIAL-SERVICES-EX-BANK-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_FINANCIAL_SERVICES_EX_BANK',
    name: 'Nifty Financial Services Ex-Bank'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDSMALL-FINANCIAL-SERVICES-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_MIDSMALL_FINANCIAL_SERVICES',
    name: 'Nifty MidSmall Financial Services'
  },
  {
    path: 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-MIDSMALL-IT-&-TELECOM-01-Oct-2025.csv',
    niftyIndex: 'NIFTY_MIDSMALL_IT_TELECOM',
    name: 'Nifty MidSmall IT & Telecom'
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

        // Skip index rows - these are the index names themselves
        const skipPatterns = [
          'NIFTY AUTO', 'NIFTY FINANCIAL', 'NIFTY FMCG', 'NIFTY IT',
          'NIFTY MEDIA', 'NIFTY METAL', 'NIFTY PHARMA', 'NIFTY PSU',
          'NIFTY REALTY', 'NIFTY PRIVATE', 'NIFTY HEALTHCARE',
          'NIFTY CONSUMER', 'NIFTY OIL', 'NIFTY MIDSMALL'
        ];

        if (symbol) {
          const shouldSkip = skipPatterns.some(pattern => symbol.includes(pattern));

          if (!shouldSkip) {
            // Clean the symbol (remove any extra characters/quotes but keep &, -, and alphanumeric)
            const cleanSymbol = symbol.replace(/[^A-Z0-9&-]/g, '').trim();
            if (cleanSymbol.length > 0) {
              stocks.push(cleanSymbol);
            }
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

// Process all CSV files and add sectoral indices to existing stocks
const importSectoralNiftyIndices = async () => {
  try {
    console.log('🚀 Starting Sectoral Nifty Indices import...');
    await connectDB();

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalNotFound = 0;
    const allSectoralStocks = new Map(); // Map to store symbol -> list of sectoral indices

    // Collect all stocks from all CSV files
    console.log('📊 Collecting stocks from all sectoral CSV files...');
    for (const csvFile of csvFiles) {
      console.log(`\n📋 Processing ${csvFile.name}...`);

      // Check if file exists
      if (!fs.existsSync(csvFile.path)) {
        console.log(`⚠️  File not found: ${csvFile.path}`);
        continue;
      }

      const stocks = await parseCSV(csvFile.path);
      console.log(`   Found ${stocks.length} stocks in ${csvFile.name}`);

      for (const symbol of stocks) {
        // Add index to the stock's list of indices
        if (!allSectoralStocks.has(symbol)) {
          allSectoralStocks.set(symbol, []);
        }
        const indices = allSectoralStocks.get(symbol);
        if (!indices.includes(csvFile.niftyIndex)) {
          indices.push(csvFile.niftyIndex);
        }
      }
    }

    console.log(`\n📈 Total unique stocks found across sectoral indices: ${allSectoralStocks.size}`);

    // Now update the database - add sectoral indices to niftyIndices array
    console.log('\n🔄 Updating database with sectoral indices...');
    for (const [symbol, sectoralIndices] of allSectoralStocks) {
      const existingStock = await ActualStockDetail.findOne({ symbol });

      if (existingStock) {
        // Get existing niftyIndices or create new array
        const existingIndices = existingStock.additionalInfo?.niftyIndices || [];

        // Merge with new sectoral indices (avoid duplicates)
        const mergedIndices = [...new Set([...existingIndices, ...sectoralIndices])];

        // Update the stock
        await ActualStockDetail.updateOne(
          { symbol },
          {
            $set: {
              'additionalInfo.niftyIndices': mergedIndices,
              lastUpdated: new Date()
            }
          }
        );
        totalUpdated++;

        if (totalUpdated % 10 === 0) {
          console.log(`✅ Updated ${totalUpdated} stocks...`);
        }
      } else {
        console.log(`⚠️  Stock not found in database: ${symbol}`);
        totalNotFound++;
      }

      totalProcessed++;
    }

    console.log('\n📈 Import Complete!');
    console.log(`📊 Summary:`);
    console.log(`   Total stocks processed: ${totalProcessed}`);
    console.log(`   Stocks updated with sectoral indices: ${totalUpdated}`);
    console.log(`   Stocks not found in database: ${totalNotFound}`);

    // Show breakdown by sectoral index
    console.log('\n🔍 Sectoral Index breakdown:');
    for (const csvFile of csvFiles) {
      const count = await ActualStockDetail.countDocuments({
        'additionalInfo.niftyIndices': csvFile.niftyIndex
      });
      console.log(`   ${csvFile.name}: ${count} stocks`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
};

// Main execution
if (require.main === module) {
  importSectoralNiftyIndices();
}

module.exports = {
  importSectoralNiftyIndices,
  parseCSV
};

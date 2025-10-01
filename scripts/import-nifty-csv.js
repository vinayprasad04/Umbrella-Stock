const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define schemas directly since imports are complex
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

// EquityStock Schema
const EquityStockSchema = new Schema({
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
  series: {
    type: String,
    required: true,
    index: true
  },
  dateOfListing: {
    type: Date,
    required: true
  },
  paidUpValue: {
    type: Number,
    required: true
  },
  marketLot: {
    type: Number,
    required: true
  },
  isinNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  faceValue: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  hasActualData: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

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
    }
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

const EquityStock = mongoose.models.EquityStock || mongoose.model('EquityStock', EquityStockSchema);
const ActualStockDetail = mongoose.models.ActualStockDetail || mongoose.model('ActualStockDetail', ActualStockDetailSchema);

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
    const results = [];

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

// Create default data for new stocks
const createDefaultStockData = (symbol, niftyIndex) => {
  const defaultDate = new Date('2000-01-01');

  const equityStockData = {
    symbol: symbol,
    companyName: symbol + ' Limited', // Placeholder - should be updated manually
    series: 'EQ',
    dateOfListing: defaultDate,
    paidUpValue: 10,
    marketLot: 1,
    isinNumber: 'INE000000000', // Placeholder ISIN
    faceValue: 10,
    isActive: true,
    hasActualData: true,
    lastUpdated: new Date()
  };

  const actualStockDetailData = {
    symbol: symbol,
    companyName: symbol + ' Limited', // Placeholder - should be updated manually
    meta: {
      faceValue: 10,
      currentPrice: 100, // Default price
      marketCapitalization: 1000000,
      numberOfShares: 10000
    },
    profitAndLoss: {
      sales: [],
      rawMaterialCost: [],
      changeInInventory: [],
      powerAndFuel: [],
      otherMfrExp: [],
      employeeCost: [],
      sellingAndAdmin: [],
      otherExpenses: [],
      otherIncome: [],
      depreciation: [],
      interest: [],
      profitBeforeTax: [],
      tax: [],
      netProfit: [],
      dividendAmount: []
    },
    quarterlyData: {
      sales: [],
      expenses: [],
      otherIncome: [],
      depreciation: [],
      interest: [],
      profitBeforeTax: [],
      tax: [],
      netProfit: [],
      operatingProfit: []
    },
    balanceSheet: {
      equityShareCapital: [],
      reserves: [],
      borrowings: [],
      otherLiabilities: [],
      total: [],
      netBlock: [],
      capitalWorkInProgress: [],
      investments: [],
      otherAssets: [],
      receivables: [],
      inventory: [],
      cashAndBank: [],
      numberOfEquityShares: [],
      newBonusShares: [],
      faceValue: [],
      adjustedEquityShares: []
    },
    cashFlow: {
      cashFromOperatingActivity: [],
      cashFromInvestingActivity: [],
      cashFromFinancingActivity: [],
      netCashFlow: []
    },
    priceData: [],
    additionalInfo: {
      niftyIndex: niftyIndex,
      sector: 'Unknown',
      industry: 'Unknown'
    },
    dataQuality: 'PENDING_VERIFICATION',
    enteredBy: 'CSV_IMPORT_SCRIPT',
    isActive: true,
    lastUpdated: new Date()
  };

  return { equityStockData, actualStockDetailData };
};

// Helper function to determine if one classification is higher than another
const isHigherClassification = (newClassification, currentClassification) => {
  const hierarchy = {
    'NIFTY_50': 4,
    'NIFTY_100': 3,
    'NIFTY_200': 2,
    'NIFTY_500': 1
  };
  return hierarchy[newClassification] > hierarchy[currentClassification];
};

// Process all CSV files
const importNiftyCSVs = async () => {
  try {
    console.log('🚀 Starting Nifty CSV import...');
    await connectDB();

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalCreated = 0;
    const allNiftyStocks = new Map(); // Map to store symbol -> highest nifty index

    // First, reset all existing niftyIndex to NOT_LISTED
    console.log('📋 Resetting all stocks to NOT_LISTED...');
    await ActualStockDetail.updateMany(
      { isActive: true },
      { $set: { 'additionalInfo.niftyIndex': 'NOT_LISTED' } }
    );

    // Collect all stocks from all CSV files first to determine highest classification
    console.log('📊 Collecting stocks from all CSV files...');
    for (const csvFile of csvFiles) {
      const stocks = await parseCSV(csvFile.path);
      console.log(`📋 Found ${stocks.length} stocks in ${csvFile.name}`);

      for (const symbol of stocks) {
        // Store the highest classification (NIFTY_50 > NIFTY_100 > NIFTY_200 > NIFTY_500)
        const currentClassification = allNiftyStocks.get(symbol);
        if (!currentClassification || isHigherClassification(csvFile.niftyIndex, currentClassification)) {
          allNiftyStocks.set(symbol, csvFile.niftyIndex);
        }
      }
    }

    console.log(`📈 Total unique Nifty stocks found: ${allNiftyStocks.size}`);

    // Now update the database with the correct classifications
    console.log('\n🔄 Updating database with correct classifications...');
    for (const [symbol, niftyIndex] of allNiftyStocks) {
      // Check if stock exists in ActualStockDetail
      const existingActualStock = await ActualStockDetail.findOne({ symbol });

      if (existingActualStock) {
        // Update existing stock's niftyIndex
        await ActualStockDetail.updateOne(
          { symbol },
          {
            $set: {
              'additionalInfo.niftyIndex': niftyIndex,
              lastUpdated: new Date()
            }
          }
        );
        totalUpdated++;
      } else {
        // Create new stock in both collections
        const { equityStockData, actualStockDetailData } = createDefaultStockData(symbol, niftyIndex);

        // Check if stock exists in EquityStock, if not create it
        const existingEquityStock = await EquityStock.findOne({ symbol });
        if (!existingEquityStock) {
          try {
            // Make ISIN unique by appending symbol
            equityStockData.isinNumber = `INE${symbol.padEnd(6, '0').substring(0, 6)}01`;
            await EquityStock.create(equityStockData);
          } catch (error) {
            if (error.code === 11000) {
              // Duplicate ISIN, generate a unique one
              equityStockData.isinNumber = `INE${Date.now().toString().substring(-6)}01`;
              await EquityStock.create(equityStockData);
            } else {
              throw error;
            }
          }
        } else {
          // Update hasActualData to true if stock exists in EquityStock
          await EquityStock.updateOne(
            { symbol },
            {
              $set: {
                hasActualData: true,
                lastUpdated: new Date()
              }
            }
          );
        }

        // Create ActualStockDetail
        await ActualStockDetail.create(actualStockDetailData);
        totalCreated++;
      }

      totalProcessed++;
      if (totalProcessed % 50 === 0) {
        console.log(`✅ Processed ${totalProcessed} stocks...`);
      }
    }

    console.log('\n📈 Import Complete!');
    console.log(`📊 Summary:`);
    console.log(`   Total stocks processed: ${totalProcessed}`);
    console.log(`   Existing stocks updated: ${totalUpdated}`);
    console.log(`   New stocks created: ${totalCreated}`);
    console.log(`   Unique Nifty stocks found: ${allNiftyStocks.size}`);

    // Verification
    const niftyBreakdown = await ActualStockDetail.aggregate([
      { $group: { _id: '$additionalInfo.niftyIndex', count: { $sum: 1 } } }
    ]);

    console.log('\n🔍 Final Nifty Index breakdown:');
    niftyBreakdown.forEach(item => {
      console.log(`   ${item._id}: ${item.count} stocks`);
    });

    await mongoose.disconnect();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
};

// Main execution
if (require.main === module) {
  importNiftyCSVs();
}

module.exports = {
  importNiftyCSVs,
  parseCSV,
  createDefaultStockData
};
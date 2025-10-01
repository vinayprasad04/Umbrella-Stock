const mongoose = require('mongoose');

// Define schema directly since imports are complex
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
      enum: ['NIFTY_50', 'NIFTY_100', 'NIFTY_500', 'NOT_LISTED'],
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

const ActualStockDetail = mongoose.models.ActualStockDetail || mongoose.model('ActualStockDetail', ActualStockDetailSchema);

// Nifty indices data
const NIFTY_50_SYMBOLS = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "HINDUNILVR", "ICICIBANK", "SBIN",
  "BHARTIARTL", "ITC", "HCLTECH", "KOTAKBANK", "LT", "ASIANPAINT", "AXISBANK",
  "MARUTI", "SUNPHARMA", "TITAN", "NTPC", "NESTLEIND", "WIPRO", "ULTRACEMCO",
  "BAJFINANCE", "POWERGRID", "ONGC", "M&M", "TATAMOTORS", "TECHM", "COALINDIA",
  "JSWSTEEL", "TATASTEEL", "BAJAJFINSV", "DRREDDY", "GRASIM", "HINDPETRO",
  "INDUSINDBK", "DIVISLAB", "BRITANNIA", "CIPLA", "EICHERMOT", "HEROMOTOCO",
  "ADANIPORTS", "APOLLOHOSP", "BPCL", "SHREECEM", "HINDALCO", "TATACONSUM",
  "UPL", "SBILIFE", "HDFCLIFE", "LTIM"
];

const NIFTY_100_ADDITIONAL_SYMBOLS = [
  "ADANIENT", "GODREJCP", "DABUR", "BAJAJ-AUTO", "BERGEPAINT", "GLAND",
  "HAVELLS", "MARICO", "MOTHERSON", "PAGEIND", "PIDILITE", "SIEMENS",
  "VOLTAS", "AMBUJACEM", "BANDHANBNK", "BANKBARODA", "CANBK", "FEDERALBNK",
  "IDFCFIRSTB", "IOC", "PEL", "PNB", "RECLTD", "SAIL", "VEDL", "ZEEL",
  "AUBANK", "CHOLAFIN", "COLPAL", "CONCOR", "DLF", "GAIL", "GODREJPROP",
  "HDFCAMC", "ICICIPRULI", "LICHSGFIN", "LUPIN", "MCDOWELL-N", "MPHASIS",
  "NAUKRI", "NMDC", "OBEROIRLTY", "OFSS", "PETRONET", "PGHH", "PIIND",
  "PVR", "SRF", "TORNTPHARM", "TVSMOTOR"
];

const NIFTY_500_ADDITIONAL_SYMBOLS = [
  "AARTIIND", "ABB", "ABBOTINDIA", "ABCAPITAL", "ABFRL", "ACC", "APLAPOLLO",
  "AUROBINDO", "BALKRISIND", "BATAINDIA", "BEL", "BIOCON", "BOSCHLTD",
  "BSOFT", "CANBK", "CANFINHOME", "CHAMBLFERT", "COFORGE", "CROMPTON",
  "CUMMINSIND", "DELTACORP", "ESCORTS", "EXIDEIND", "FINEORG", "FLUOROCHEM",
  "GILLETTE", "GMRINFRA", "GPPL", "GRANULES", "HATHWAY", "HINDCOPPER",
  "HINDPETRO", "HONAUT", "IDEA", "IPCALAB", "IRCTC", "JBCHEPHARM", "JUBLFOOD",
  "KPITTECH", "LALPATHLAB", "LAURUSLABS", "MANAPPURAM", "MINDTREE", "MRPL",
  "NATIONALUM", "NAVINFLUOR", "NESTLEIND", "NLCINDIA", "NOCIL", "NYKAA",
  "PFIZER", "POLYMED", "POLYCAB", "PVRINOX", "RADICO", "RAMCOCEM", "RELAXO",
  "SANOFI", "SCHAEFFLER", "SEQUENT", "SHANKARA", "STAR", "SUNDRMFAST",
  "SYMPHONY", "TATAELXSI", "TATAINVEST", "TEAMLEASE", "THYROCARE", "TIINDIA",
  "TRENT", "TRITURBINE", "TTKPRESTIG", "UJJIVAN", "VGUARD", "VINATIORGA",
  "WHIRLPOOL", "YESBANK", "ZENSARTECH"
];

const getNiftyClassification = (symbol) => {
  if (NIFTY_50_SYMBOLS.includes(symbol)) {
    return 'NIFTY_50';
  } else if (NIFTY_100_ADDITIONAL_SYMBOLS.includes(symbol)) {
    return 'NIFTY_100';
  } else if (NIFTY_500_ADDITIONAL_SYMBOLS.includes(symbol)) {
    return 'NIFTY_500';
  }
  return 'NOT_LISTED';
};

require('dotenv').config({ path: '.env.local' });

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

const populateNiftyIndices = async () => {
  try {
    console.log('🚀 Starting Nifty indices population...');

    await connectDB();

    // Get all stocks from the database
    const allStocks = await ActualStockDetail.find({ isActive: true }).select('symbol additionalInfo');
    console.log(`📊 Found ${allStocks.length} stocks in database`);

    let updatedCount = 0;
    let nifty50Count = 0;
    let nifty100Count = 0;
    let nifty500Count = 0;
    let notListedCount = 0;

    // Process each stock
    for (const stock of allStocks) {
      const niftyClassification = getNiftyClassification(stock.symbol);

      // Update the stock's niftyIndex field
      await ActualStockDetail.updateOne(
        { _id: stock._id },
        {
          $set: {
            'additionalInfo.niftyIndex': niftyClassification
          }
        }
      );

      updatedCount++;

      // Count classifications
      switch (niftyClassification) {
        case 'NIFTY_50':
          nifty50Count++;
          break;
        case 'NIFTY_100':
          nifty100Count++;
          break;
        case 'NIFTY_500':
          nifty500Count++;
          break;
        case 'NOT_LISTED':
          notListedCount++;
          break;
      }

      if (updatedCount % 100 === 0) {
        console.log(`✅ Updated ${updatedCount} stocks...`);
      }
    }

    console.log('\n📈 Nifty Index Population Complete!');
    console.log(`📊 Summary:`);
    console.log(`   Total stocks updated: ${updatedCount}`);
    console.log(`   Nifty 50 stocks: ${nifty50Count}`);
    console.log(`   Nifty 100 stocks: ${nifty100Count}`);
    console.log(`   Nifty 500 stocks: ${nifty500Count}`);
    console.log(`   Not listed in Nifty: ${notListedCount}`);

    // Verify the update
    const nifty50Stocks = await ActualStockDetail.countDocuments({
      'additionalInfo.niftyIndex': 'NIFTY_50',
      isActive: true
    });
    const nifty100Stocks = await ActualStockDetail.countDocuments({
      'additionalInfo.niftyIndex': 'NIFTY_100',
      isActive: true
    });
    const nifty500Stocks = await ActualStockDetail.countDocuments({
      'additionalInfo.niftyIndex': 'NIFTY_500',
      isActive: true
    });

    console.log('\n🔍 Verification:');
    console.log(`   Nifty 50 stocks in DB: ${nifty50Stocks}`);
    console.log(`   Nifty 100 stocks in DB: ${nifty100Stocks}`);
    console.log(`   Nifty 500 stocks in DB: ${nifty500Stocks}`);

    await mongoose.disconnect();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error populating Nifty indices:', error);
    process.exit(1);
  }
};

// Add a function to update specific stocks with Nifty classification
const updateSpecificStocks = async (symbols, niftyType) => {
  try {
    console.log(`🎯 Updating ${symbols.length} stocks to ${niftyType}...`);

    const result = await ActualStockDetail.updateMany(
      {
        symbol: { $in: symbols },
        isActive: true
      },
      {
        $set: {
          'additionalInfo.niftyIndex': niftyType
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} stocks to ${niftyType}`);
    return result.modifiedCount;
  } catch (error) {
    console.error(`❌ Error updating stocks to ${niftyType}:`, error);
    return 0;
  }
};

// Function to populate from scratch using predefined lists
const populateFromLists = async () => {
  try {
    console.log('🚀 Starting Nifty indices population from predefined lists...');

    await connectDB();

    // First, set all stocks to NOT_LISTED
    await ActualStockDetail.updateMany(
      { isActive: true },
      { $set: { 'additionalInfo.niftyIndex': 'NOT_LISTED' } }
    );
    console.log('📋 Set all stocks to NOT_LISTED initially');

    // Update Nifty 50 stocks
    const nifty50Updated = await updateSpecificStocks(NIFTY_50_SYMBOLS, 'NIFTY_50');

    // Update Nifty 100 stocks (additional ones)
    const nifty100Updated = await updateSpecificStocks(NIFTY_100_ADDITIONAL_SYMBOLS, 'NIFTY_100');

    // Update Nifty 500 stocks (additional ones)
    const nifty500Updated = await updateSpecificStocks(NIFTY_500_ADDITIONAL_SYMBOLS, 'NIFTY_500');

    console.log('\n📈 Population from lists complete!');
    console.log(`📊 Summary:`);
    console.log(`   Nifty 50 stocks updated: ${nifty50Updated}`);
    console.log(`   Nifty 100 stocks updated: ${nifty100Updated}`);
    console.log(`   Nifty 500 stocks updated: ${nifty500Updated}`);

    await mongoose.disconnect();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error in populateFromLists:', error);
    process.exit(1);
  }
};

// Main execution
if (require.main === module) {
  const method = process.argv[2] || 'classify';

  if (method === 'lists') {
    populateFromLists();
  } else {
    populateNiftyIndices();
  }
}

module.exports = {
  populateNiftyIndices,
  populateFromLists,
  updateSpecificStocks
};
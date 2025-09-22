const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('../node_modules/mongoose');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const config = require('./config.js');

// EquityStock model
const EquityStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  companyName: { type: String, required: true },
  series: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  hasActualData: { type: Boolean, default: false },
  marketLot: { type: Number },
  faceValue: { type: Number }
});

const EquityStock = mongoose.model('EquityStock', EquityStockSchema);

class SmartBulkStockAutomation {
  constructor() {
    this.adminToken = config.adminToken;
    this.adminBaseUrl = config.adminBaseUrl;
    this.downloadPath = config.downloadPath;
    this.delayBetweenStocks = 2000; // 2 seconds for better performance
    this.batchSize = 25; // Smaller batches
    this.maxRetries = 2;
    this.stats = {
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Priority stocks - major companies likely to be on Screener.in
    this.priorityStocks = [
      'HDFCBANK', 'RELIANCE', 'TCS', 'INFY', 'ICICIBANK', 'BHARTIARTL',
      'ITC', 'SBIN', 'LT', 'KOTAKBANK', 'HCLTECH', 'ASIANPAINT', 'MARUTI',
      'AXISBANK', 'TITAN', 'NESTLEIND', 'ULTRACEMCO', 'BAJFINANCE',
      'SUNPHARMA', 'WIPRO', 'ADANIPORTS', 'COALINDIA', 'NTPC', 'POWERGRID',
      'HINDUNILVR', 'TATAMOTORS', 'TECHM', 'ONGC', 'DRREDDY', 'EICHERMOT',
      'JSWSTEEL', 'INDUSINDBK', 'BAJAJFINSV', 'GRASIM', 'HINDALCO',
      'BRITANNIA', 'CIPLA', 'HEROMOTOCO', 'APOLLOHOSP', 'BPCL'
    ];

    // Known working Nifty 500 stocks
    this.nifty500Stocks = [
      'ADANIENT', 'ADANIGREEN', 'ADANIPORTS', 'ATGL', 'ADANITRANS',
      'ABCAPITAL', 'ABFRL', 'ACC', 'AIAENG', 'APLAPOLLO', 'AUBANK',
      'AARTIIND', 'AAVAS', 'ABBOTINDIA', 'ACE', 'ACCELYA', 'ADFFOODS',
      'AEGISCHEM', 'AETHER', 'AFFLE', 'AJANTPHARM', 'AKZOINDIA',
      'ALEMBICLTD', 'ALKYLAMINE', 'ALLCARGO', 'ALKEM', 'AMARAJABAT',
      'AMBER', 'AMBUJACEM', 'APOLLOHOSP', 'APOLLOTYRE', 'APTUS', 'ACI',
      'ASAHIINDIA', 'ASHOKLEY', 'ASIANPAINT', 'ASTRAL', 'ATUL', 'AUBANK',
      'AUROPHARMA', 'AVANTIFEED', 'DMART', 'AXISBANK', 'BAJAJ-AUTO',
      'BAJAJCON', 'BAJAJELEC', 'BAJAJFINSV', 'BAJAJHLDNG', 'BAJFINANCE',
      'BALKRISH', 'BALMLAWRIE', 'BALRAMCHIN', 'BANDHANBNK', 'BANKBARODA',
      'BANKINDIA', 'MAHABANK', 'BATAINDIA', 'BEL', 'BEML', 'BERGEPAINT',
      'BHARATFORG', 'BHEL', 'BHARTIARTL', 'BIOCON', 'BIRLACORPN',
      'BSOFT', 'BLUEDART', 'BLUESTARCO', 'BBTC', 'BOSCHLTD', 'BPCL',
      'BRITANNIA', 'CADILAHC', 'CAMS', 'CANFINHOME', 'CANBK', 'CAPLIPOINT',
      'CARBORUNIV', 'CASTROLIND', 'CCL', 'CEATLTD', 'CELLO', 'CENTRALBK',
      'CENTURYPLY', 'CENTURYTEX', 'CERA', 'CHALET', 'CHAMBLFERT',
      'CHOLAHLDNG', 'CHOLAFIN', 'CIPLA', 'CUB', 'COALINDIA', 'COFORGE',
      'COLPAL', 'CONCOR', 'COROMANDEL', 'CREDITACC', 'CRISIL', 'CROMPTON',
      'CUMMINSIND', 'CYIENT', 'DABUR', 'DALBHARAT', 'DATAPATTNS',
      'DCBBANK', 'DCMSHRIRAM', 'DLF', 'DEEPAKNTR', 'DELTACORP',
      'DEVYANI', 'DHANI', 'DHANUKA', 'DBL', 'DISHTV', 'DIVISLAB',
      'DIXON', 'LALPATHLAB', 'DRREDDY', 'DUMMYEGGL', 'EASEMYTRIP',
      'EICHERMOT', 'EIDPARRY', 'EIHOTEL', 'EPL', 'EQUITAS', 'ERIS',
      'ESCORTS', 'EXIDEIND', 'FDC', 'NYKAA', 'FEDERALBNK', 'FORTIS',
      'FINEORG', 'FINCABLES', 'FINPIPE', 'FSL', 'FIVESTAR', 'FLUOROCHEM',
      'FORTIS', 'GAIL', 'GALAXYSURF', 'GARFIBRES', 'GICRE', 'GLAND',
      'GLAXO', 'GLENMARK', 'GMMPFAUDLR', 'GMRINFRA', 'GNFC', 'GODFRYPHLP',
      'GODREJCP', 'GODREJIND', 'GODREJPROP', 'GRANULES', 'GRAPHITE',
      'GRASIM', 'GREAVESCOT', 'GRINDWELL', 'GSFC', 'GSPL', 'GUJALKALI',
      'GUJGASLTD', 'GULFOILLUB', 'HAL', 'HATHWAY', 'HAVELLS', 'HCLTECH',
      'HDFCAMC', 'HDFCBANK', 'HDFCLIFE', 'HFCL', 'HGINFRA', 'HIMATSEIDE',
      'HINDALCO', 'HINDCOPPER', 'HINDPETRO', 'HINDUNILVR', 'HINDZINC',
      'HONAUT', 'HSCL', 'HUDCO', 'ICICIBANK', 'ICICIGI', 'ICICIPRULI',
      'IDFCFIRSTB', 'IEX', 'IFBIND', 'IIFL', 'INDHOTEL', 'IOC',
      'IPCALAB', 'IRB', 'IRCTC', 'ISEC', 'ITC', 'ITDCEM', 'ITI',
      'INDIACEM', 'INDIANB', 'INDIAMART', 'INDIGO', 'INDUSINDBK',
      'NAUKRI', 'INFY', 'INOXLEISUR', 'INTELLECT', 'IOB', 'IPCALAB',
      'IRCON', 'ISEC', 'ITC', 'JBCHEPHARM', 'JKCEMENT', 'JKLAKSHMI',
      'JKPAPER', 'JMFINANCIL', 'JSWENERGY', 'JSWSTEEL', 'JUBLFOOD',
      'JUSTDIAL', 'JYOTHYLAB', 'KPRMILL', 'KEI', 'KNRCON', 'KOLTEPATIL',
      'KOTAKBANK', 'KRBL', 'L&TFH', 'LAXMIMACH', 'LICHSGFIN', 'LTTS',
      'LTIM', 'LAURUSLABS', 'LICI', 'LALPATHLAB', 'LT', 'LUPIN',
      'LTI', 'LUXIND', 'MARICO', 'MARUTI', 'MCDOWELL-N', 'MCX',
      'MINDACORP', 'MINDTREE', 'MIDHANI', 'MOIL', 'MPHASIS', 'MRF',
      'MOTHERSON', 'MUTHOOTFIN', 'NATIONALUM', 'NAUKRI', 'NAVINFLUOR',
      'NBCC', 'NCC', 'NESTLEIND', 'NETWORK18', 'NHPC', 'NIITLTD',
      'NLCINDIA', 'NMDC', 'NOCIL', 'NTPC', 'NYKAA', 'OBEROIRLTY',
      'OFSS', 'OIL', 'ONGC', 'ORIENTELEC', 'PAGEIND', 'PERSISTENT',
      'PETRONET', 'PFIZER', 'PIDILITIND', 'PIIND', 'PNB', 'PNBHOUSING',
      'PNCINFRA', 'POWERGRID', 'POWERINDIA', 'PRAJIND', 'PRESTIGE',
      'PRSMJOHNSN', 'PTC', 'PVR', 'QUESS', 'RADICO', 'RAIN', 'RAJESHEXPO',
      'RALLIS', 'RAMCOCEM', 'RBLBANK', 'RECLTD', 'REDINGTON', 'RELAXO',
      'RELIANCE', 'RENUKA', 'RESPONSIND', 'RITES', 'ROSSARI', 'ROUTE',
      'RPOWER', 'RTNINDIA', 'RVNL', 'SAIL', 'SANOFI', 'SARLAPOLY',
      'SBICARD', 'SBILIFE', 'SBIN', 'SCHAEFFLER', 'SCHNEIDER', 'SCI',
      'SFL', 'SHILPAMED', 'SHOPERSTOP', 'SHREECEM', 'SHRIRAMFIN',
      'SIEMENS', 'SIS', 'SJVN', 'SKFINDIA', 'SOBHA', 'SOLARA',
      'SOLARINDS', 'SONACOMS', 'SPANDANA', 'SPARC', 'SPICEJET',
      'STAR', 'STARCEMENT', 'STLTECH', 'SUDARSCHEM', 'SUMICHEM',
      'SUNPHARMA', 'SUNTV', 'SUPRAJIT', 'SUPREMEIND', 'SURYAROSNI',
      'SUZLON', 'SWANENERGY', 'SYMPHONY', 'SYNGENE', 'TATACHEM',
      'TATACOMM', 'TATACONSUM', 'TATAELXSI', 'TATAMOTORS', 'TATAPOWER',
      'TATASTEEL', 'TCS', 'TECHM', 'TEJASNET', 'THERMAX', 'THYROCARE',
      'TIPSINDLTD', 'TITAN', 'TORNTPHARM', 'TORNTPOWER', 'TRENT',
      'TRIDENT', 'TRIVENI', 'TTK', 'TVSMOTOR', 'UBL', 'UCOBANK',
      'UPL', 'UJJIVAN', 'ULTRACEMCO', 'UNIONBANK', 'UNITECH',
      'UTIBANK', 'VAIBHAVGBL', 'VARROC', 'VBL', 'VEDL', 'VGUARD',
      'VINATIORGA', 'VIPIND', 'VOLTAS', 'VTL', 'WABCOINDIA', 'WELCORP',
      'WELSPUNIND', 'WESTLIFE', 'WHIRLPOOL', 'WIPRO', 'WOCKPHARMA',
      'YESBANK', 'ZEEL', 'ZENSARTECH', 'ZOMATO', 'ZYDUSLIFE'
    ];
  }

  async connectDB() {
    try {
      const mongoUri = process.env.MONGODB_CONNECTION_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_CONNECTION_URI not found in environment variables');
      }

      console.log('🔌 Connecting to MongoDB Atlas...');
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async getStocksByPriority(mode = 'priority') {
    try {
      console.log('📊 Fetching stocks from database...');

      let filterSymbols;
      if (mode === 'priority') {
        filterSymbols = this.priorityStocks;
        console.log('🎯 Using priority stocks (40 major companies)');
      } else if (mode === 'nifty500') {
        filterSymbols = this.nifty500Stocks;
        console.log('📈 Using Nifty 500 stocks');
      } else {
        // Get all stocks but prioritize by market cap proxy (marketLot * faceValue)
        const allStocks = await EquityStock.find({
          isActive: true,
          series: 'EQ',
          hasActualData: false
        }).select('symbol companyName marketLot faceValue').lean();

        // Sort by likely market cap (higher marketLot usually means larger company)
        return allStocks.sort((a, b) => (b.marketLot || 0) - (a.marketLot || 0));
      }

      const stocks = await EquityStock.find({
        isActive: true,
        series: 'EQ',
        hasActualData: false,
        symbol: { $in: filterSymbols }
      }).select('symbol companyName').lean();

      // Sort by priority order
      stocks.sort((a, b) => {
        const aIndex = filterSymbols.indexOf(a.symbol);
        const bIndex = filterSymbols.indexOf(b.symbol);
        return aIndex - bIndex;
      });

      console.log(`✅ Found ${stocks.length} stocks to process (${mode} mode)`);
      return stocks;
    } catch (error) {
      console.error('❌ Error fetching stocks:', error.message);
      throw error;
    }
  }

  async downloadExcelFile(symbol) {
    try {
      const exportUrl = `https://www.screener.in/company/${symbol}/export/`;

      const response = await axios.get(exportUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
          'Referer': `https://www.screener.in/company/${symbol}/`
        },
        timeout: 15000,
        maxRedirects: 3
      });

      if (response.data && response.data.length > 2000) { // Minimum Excel file size
        const fileName = `${symbol}.xlsx`;
        const filePath = path.join(this.downloadPath, fileName);
        fs.writeFileSync(filePath, response.data);

        console.log(`✅ Downloaded: ${fileName} (${(response.data.length/1024).toFixed(1)}KB)`);
        return filePath;
      } else {
        console.log(`⚠️ Invalid/small response for ${symbol}`);
        return null;
      }

    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`⚠️ ${symbol} not found on Screener.in (404)`);
      } else {
        console.log(`❌ Download failed for ${symbol}: ${error.message}`);
      }
      return null;
    }
  }

  async uploadToAdmin(symbol, filePath) {
    try {
      console.log(`📤 Uploading ${symbol}...`);

      const formData = new FormData();
      formData.append('files', fs.createReadStream(filePath));
      formData.append('symbol', symbol);

      const uploadUrl = `${this.adminBaseUrl}${symbol}/upload`;

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.adminToken}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000
      });

      if (response.data.success) {
        console.log(`✅ Uploaded ${symbol} successfully`);
        fs.unlinkSync(filePath); // Clean up
        return true;
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }

    } catch (error) {
      console.error(`❌ Upload failed for ${symbol}:`, error.message);
      return false;
    }
  }

  async processStock(stock) {
    const { symbol } = stock;
    console.log(`\n🔄 Processing ${symbol} (${this.stats.processed + 1}/${this.stats.total})...`);

    try {
      const filePath = await this.downloadExcelFile(symbol);
      if (!filePath) {
        this.stats.skipped++;
        return 'skipped';
      }

      const uploaded = await this.uploadToAdmin(symbol, filePath);
      if (uploaded) {
        this.stats.success++;
        return 'success';
      } else {
        this.stats.failed++;
        this.stats.errors.push(symbol);
        return 'failed';
      }

    } catch (error) {
      console.error(`❌ Error processing ${symbol}:`, error.message);
      this.stats.failed++;
      this.stats.errors.push(symbol);
      return 'failed';
    } finally {
      this.stats.processed++;
    }
  }

  async run(mode = 'priority') {
    try {
      await this.connectDB();

      if (!fs.existsSync(this.downloadPath)) {
        fs.mkdirSync(this.downloadPath, { recursive: true });
      }

      const stocks = await this.getStocksByPriority(mode);
      this.stats.total = stocks.length;

      if (stocks.length === 0) {
        console.log('ℹ️ No stocks found to process.');
        return;
      }

      console.log(`\n🚀 Starting smart bulk automation for ${stocks.length} stocks...`);
      console.log(`⏱️ Delay between stocks: ${this.delayBetweenStocks}ms`);

      for (let i = 0; i < stocks.length; i++) {
        const stock = stocks[i];
        await this.processStock(stock);

        // Progress update
        if ((this.stats.processed) % 5 === 0 || this.stats.processed === this.stats.total) {
          const percentage = ((this.stats.processed/this.stats.total)*100).toFixed(1);
          console.log(`\n📊 Progress: ${this.stats.processed}/${this.stats.total} (${percentage}%)`);
          console.log(`✅ Success: ${this.stats.success} | ❌ Failed: ${this.stats.failed} | ⚠️ Skipped: ${this.stats.skipped}`);
        }

        // Add delay except for last stock
        if (i < stocks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenStocks));
        }
      }

      // Final results
      console.log('\n🎉 SMART BULK AUTOMATION COMPLETE!');
      console.log('=====================================');
      console.log(`📊 Total stocks: ${this.stats.total}`);
      console.log(`✅ Successful: ${this.stats.success}`);
      console.log(`❌ Failed: ${this.stats.failed}`);
      console.log(`⚠️ Skipped: ${this.stats.skipped}`);
      console.log(`📈 Success rate: ${((this.stats.success/this.stats.total)*100).toFixed(1)}%`);

      if (this.stats.errors.length > 0) {
        console.log(`\n❌ Failed stocks: ${this.stats.errors.join(', ')}`);
      }

    } catch (error) {
      console.error('❌ Fatal error:', error.message);
    } finally {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Command line options
const args = process.argv.slice(2);
const mode = args.find(arg => ['priority', 'nifty500', 'all'].includes(arg)) || 'priority';

if (require.main === module) {
  const automation = new SmartBulkStockAutomation();
  console.log(`🎯 Running in ${mode} mode`);
  automation.run(mode);
}

module.exports = SmartBulkStockAutomation;
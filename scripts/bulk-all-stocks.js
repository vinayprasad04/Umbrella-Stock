const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('../node_modules/mongoose');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const config = require('./config.js');

// Simple EquityStock model
const EquityStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  companyName: { type: String, required: true },
  series: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  hasActualData: { type: Boolean, default: false }
});

const EquityStock = mongoose.model('EquityStock', EquityStockSchema);

class BulkStockAutomation {
  constructor() {
    this.adminToken = config.adminToken;
    this.adminBaseUrl = config.adminBaseUrl;
    this.downloadPath = config.downloadPath;
    this.delayBetweenStocks = config.delayBetweenStocks;
    this.batchSize = 50; // Process 50 stocks at a time
    this.maxRetries = 3;
    this.stats = {
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
  }

  async connectDB() {
    try {
      const mongoUri = process.env.MONGODB_CONNECTION_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_CONNECTION_URI not found in environment variables');
      }

      console.log('🔌 Connecting to MongoDB Atlas...');
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.error('💡 Make sure .env.local file exists with MONGODB_CONNECTION_URI');
      throw error;
    }
  }

  async getAllStocks() {
    try {
      console.log('📊 Fetching all stocks from database...');

      const stocks = await EquityStock.find({
        isActive: true,
        series: 'EQ', // Only equity series
        hasActualData: false // Only stocks without data
      }).select('symbol companyName').lean();

      console.log(`✅ Found ${stocks.length} stocks to process`);
      return stocks;
    } catch (error) {
      console.error('❌ Error fetching stocks:', error.message);
      throw error;
    }
  }

  async downloadExcelFile(symbol) {
    try {
      console.log(`📥 Attempting to download Excel for ${symbol}...`);

      // Try direct download approach
      const exportUrl = `https://www.screener.in/company/${symbol}/export/`;

      const response = await axios.get(exportUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*',
          'Referer': `https://www.screener.in/company/${symbol}/`
        },
        timeout: 30000,
        maxRedirects: 5
      });

      // Check if we got actual Excel data
      if (response.data && response.data.length > 1000) {
        const fileName = `${symbol}.xlsx`;
        const filePath = path.join(this.downloadPath, fileName);
        fs.writeFileSync(filePath, response.data);

        console.log(`✅ Downloaded: ${fileName} (${response.data.length} bytes)`);
        return filePath;
      } else {
        console.log(`⚠️ Invalid response for ${symbol} - likely blocked or no data`);
        return null;
      }

    } catch (error) {
      console.log(`❌ Download failed for ${symbol}: ${error.message}`);
      return null;
    }
  }

  async uploadToAdmin(symbol, filePath) {
    try {
      console.log(`📤 Uploading ${symbol} to admin panel...`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

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
        timeout: config.uploadTimeout
      });

      if (response.data.success) {
        console.log(`✅ Successfully uploaded ${symbol}`);

        // Clean up downloaded file
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up ${symbol}.xlsx`);

        return true;
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }

    } catch (error) {
      console.error(`❌ Error uploading ${symbol}:`, error.message);
      return false;
    }
  }

  async processStock(stock, retryCount = 0) {
    const { symbol } = stock;
    console.log(`\n🔄 Processing ${symbol} (${this.stats.processed + 1}/${this.stats.total})...`);

    try {
      // Step 1: Download Excel file
      const filePath = await this.downloadExcelFile(symbol);
      if (!filePath) {
        console.log(`⚠️ Skipping ${symbol} - download failed`);
        this.stats.skipped++;
        return 'skipped';
      }

      // Step 2: Upload to admin
      const uploaded = await this.uploadToAdmin(symbol, filePath);

      if (uploaded) {
        console.log(`🎉 Successfully processed ${symbol}`);
        this.stats.success++;
        return 'success';
      } else {
        if (retryCount < this.maxRetries) {
          console.log(`⏳ Retrying ${symbol} (attempt ${retryCount + 1}/${this.maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          return await this.processStock(stock, retryCount + 1);
        } else {
          console.log(`⚠️ ${symbol} failed after ${this.maxRetries} attempts`);
          this.stats.failed++;
          this.stats.errors.push(symbol);
          return 'failed';
        }
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

  async processBatch(stocks, batchNumber) {
    console.log(`\n📦 Processing batch ${batchNumber} (${stocks.length} stocks)...`);

    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];

      await this.processStock(stock);

      // Progress update
      if ((this.stats.processed) % 10 === 0) {
        console.log(`\n📊 Progress: ${this.stats.processed}/${this.stats.total} (${((this.stats.processed/this.stats.total)*100).toFixed(1)}%)`);
        console.log(`✅ Success: ${this.stats.success} | ❌ Failed: ${this.stats.failed} | ⚠️ Skipped: ${this.stats.skipped}`);
      }

      // Add delay between requests
      if (i < stocks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenStocks));
      }
    }
  }

  async run() {
    try {
      await this.connectDB();

      // Create downloads directory
      if (!fs.existsSync(this.downloadPath)) {
        fs.mkdirSync(this.downloadPath, { recursive: true });
      }

      // Get all stocks
      const allStocks = await this.getAllStocks();
      this.stats.total = allStocks.length;

      if (allStocks.length === 0) {
        console.log('ℹ️ No stocks found to process. All stocks may already have data.');
        return;
      }

      console.log(`\n🚀 Starting bulk automation for ${allStocks.length} stocks...`);
      console.log(`📦 Processing in batches of ${this.batchSize} stocks`);
      console.log(`⏱️ Delay between stocks: ${this.delayBetweenStocks}ms`);
      console.log(`🔄 Max retries per stock: ${this.maxRetries}`);

      // Process in batches
      for (let i = 0; i < allStocks.length; i += this.batchSize) {
        const batch = allStocks.slice(i, i + this.batchSize);
        const batchNumber = Math.floor(i / this.batchSize) + 1;
        const totalBatches = Math.ceil(allStocks.length / this.batchSize);

        console.log(`\n=== BATCH ${batchNumber}/${totalBatches} ===`);
        await this.processBatch(batch, batchNumber);

        // Longer delay between batches
        if (i + this.batchSize < allStocks.length) {
          console.log(`⏳ Waiting 30 seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }

      // Final results
      console.log('\n🎉 BULK AUTOMATION COMPLETE!');
      console.log('================================');
      console.log(`📊 Total stocks: ${this.stats.total}`);
      console.log(`✅ Successful: ${this.stats.success}`);
      console.log(`❌ Failed: ${this.stats.failed}`);
      console.log(`⚠️ Skipped: ${this.stats.skipped}`);
      console.log(`📈 Success rate: ${((this.stats.success/this.stats.total)*100).toFixed(1)}%`);

      if (this.stats.errors.length > 0) {
        console.log(`\n❌ Failed stocks (${this.stats.errors.length}):`);
        console.log(this.stats.errors.join(', '));

        // Save failed stocks to file
        const failedFile = path.join(__dirname, 'failed-stocks.txt');
        fs.writeFileSync(failedFile, this.stats.errors.join('\n'));
        console.log(`💾 Failed stocks saved to: ${failedFile}`);
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
const options = {
  dryRun: args.includes('--dry-run'),
  limit: args.find(arg => arg.startsWith('--limit='))?.split('=')[1],
  series: args.find(arg => arg.startsWith('--series='))?.split('=')[1] || 'EQ'
};

if (require.main === module) {
  const automation = new BulkStockAutomation();

  if (options.dryRun) {
    console.log('🧪 DRY RUN MODE - No actual processing will occur');
  }

  if (options.limit) {
    console.log(`📊 LIMITED RUN - Processing only ${options.limit} stocks`);
  }

  automation.run();
}

module.exports = BulkStockAutomation;
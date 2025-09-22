const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('../node_modules/mongoose');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const config = require('./config.js');

// Check if puppeteer is available
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.error('❌ Puppeteer not available. Install with: npm install puppeteer');
  process.exit(1);
}

// EquityStock model
const EquityStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  companyName: { type: String, required: true },
  series: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  hasActualData: { type: Boolean, default: false }
});

const EquityStock = mongoose.model('EquityStock', EquityStockSchema);

class BrowserBulkStockAutomation {
  constructor() {
    this.adminToken = config.adminToken;
    this.adminBaseUrl = config.adminBaseUrl;
    this.downloadPath = config.downloadPath;
    this.delayBetweenStocks = 5000; // 5 seconds to avoid rate limiting
    this.browser = null;
    this.page = null;
    this.stats = {
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Test with known working stocks first
    this.testStocks = [
      'RELIANCE', 'HDFCBANK', 'TCS', 'INFY', 'ICICIBANK',
      'BHARTIARTL', 'ITC', 'SBIN', 'LT', 'KOTAKBANK'
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

  async initBrowser() {
    try {
      console.log('🚀 Launching browser...');

      this.browser = await puppeteer.launch({
        headless: false, // Keep visible for debugging
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        defaultViewport: { width: 1366, height: 768 }
      });

      this.page = await this.browser.newPage();

      // Set user agent to look more like a real browser
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Set download behavior
      await this.page._client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: path.resolve(this.downloadPath)
      });

      console.log('✅ Browser initialized');
    } catch (error) {
      console.error('❌ Browser initialization failed:', error.message);
      throw error;
    }
  }

  async getTestStocks() {
    try {
      console.log('📊 Fetching test stocks from database...');

      const stocks = await EquityStock.find({
        isActive: true,
        series: 'EQ',
        hasActualData: false,
        symbol: { $in: this.testStocks }
      }).select('symbol companyName').lean();

      // Sort by test priority
      stocks.sort((a, b) => {
        const aIndex = this.testStocks.indexOf(a.symbol);
        const bIndex = this.testStocks.indexOf(b.symbol);
        return aIndex - bIndex;
      });

      console.log(`✅ Found ${stocks.length} test stocks to process`);
      return stocks;
    } catch (error) {
      console.error('❌ Error fetching stocks:', error.message);
      throw error;
    }
  }

  async downloadExcelFile(symbol) {
    try {
      console.log(`📥 Downloading Excel file for ${symbol}...`);

      // Navigate to the stock page
      const stockUrl = `https://www.screener.in/company/${symbol}/`;
      console.log(`🔗 Navigating to: ${stockUrl}`);

      await this.page.goto(stockUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait a moment for page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Look for export button with different possible selectors
      const exportSelectors = [
        'a[href*="export"]',
        '.export-excel',
        '.export-btn',
        'a:contains("Export")',
        'button:contains("Export")',
        '[data-bs-target*="export"]',
        '.btn:contains("Excel")'
      ];

      let exportButton = null;
      for (const selector of exportSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          exportButton = await this.page.$(selector);
          if (exportButton) {
            console.log(`✅ Found export button with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!exportButton) {
        // Try to find any link/button containing "export" or "excel"
        const exportElements = await this.page.$$eval('a, button', elements => {
          return elements
            .filter(el => {
              const text = el.textContent.toLowerCase();
              const href = el.href || '';
              return text.includes('export') || text.includes('excel') || href.includes('export');
            })
            .map(el => ({
              tag: el.tagName,
              text: el.textContent.trim(),
              href: el.href || '',
              className: el.className
            }));
        });

        if (exportElements.length > 0) {
          console.log(`🔍 Found potential export elements:`, exportElements);

          // Try clicking the first one that looks like an export
          exportButton = await this.page.$('a[href*="export"], button:contains("Export")');
        }
      }

      if (!exportButton) {
        console.log(`⚠️ No export button found for ${symbol}`);
        return null;
      }

      // Set up download waiting
      const downloadPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Download timeout'));
        }, 30000);

        this.page.on('response', async (response) => {
          const url = response.url();
          if (url.includes('export') && response.headers()['content-type']?.includes('spreadsheet')) {
            clearTimeout(timeout);

            try {
              const buffer = await response.buffer();
              const fileName = `${symbol}.xlsx`;
              const filePath = path.join(this.downloadPath, fileName);
              fs.writeFileSync(filePath, buffer);

              console.log(`✅ Downloaded: ${fileName} (${(buffer.length/1024).toFixed(1)}KB)`);
              resolve(filePath);
            } catch (error) {
              reject(error);
            }
          }
        });
      });

      // Click the export button
      console.log(`🖱️ Clicking export button...`);
      await exportButton.click();

      // Wait for download to complete
      const filePath = await downloadPromise;
      return filePath;

    } catch (error) {
      console.error(`❌ Error downloading ${symbol}:`, error.message);
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

  async run() {
    try {
      await this.connectDB();
      await this.initBrowser();

      if (!fs.existsSync(this.downloadPath)) {
        fs.mkdirSync(this.downloadPath, { recursive: true });
      }

      const stocks = await this.getTestStocks();
      this.stats.total = stocks.length;

      if (stocks.length === 0) {
        console.log('ℹ️ No test stocks found to process.');
        return;
      }

      console.log(`\n🚀 Starting browser-based automation for ${stocks.length} test stocks...`);
      console.log(`⏱️ Delay between stocks: ${this.delayBetweenStocks}ms`);

      for (let i = 0; i < stocks.length; i++) {
        const stock = stocks[i];
        await this.processStock(stock);

        // Progress update
        const percentage = ((this.stats.processed/this.stats.total)*100).toFixed(1);
        console.log(`\n📊 Progress: ${this.stats.processed}/${this.stats.total} (${percentage}%)`);
        console.log(`✅ Success: ${this.stats.success} | ❌ Failed: ${this.stats.failed} | ⚠️ Skipped: ${this.stats.skipped}`);

        // Add delay except for last stock
        if (i < stocks.length - 1) {
          console.log(`⏳ Waiting ${this.delayBetweenStocks/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenStocks));
        }
      }

      // Final results
      console.log('\n🎉 BROWSER AUTOMATION TEST COMPLETE!');
      console.log('====================================');
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
      if (this.browser) {
        await this.browser.close();
        console.log('🔌 Browser closed');
      }
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

if (require.main === module) {
  const automation = new BrowserBulkStockAutomation();
  automation.run();
}

module.exports = BrowserBulkStockAutomation;
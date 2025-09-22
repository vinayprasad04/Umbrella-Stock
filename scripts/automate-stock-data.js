const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration
const CONFIG = {
  screenerBaseUrl: 'https://www.screener.in/company/',
  adminBaseUrl: 'http://localhost:3000/admin/stocks/',
  downloadPath: path.join(__dirname, 'downloads'),
  adminToken: 'YOUR_ADMIN_JWT_TOKEN', // Get this from your admin login
  delayBetweenStocks: 3000 // 3 seconds delay between each stock
};

// List of stock symbols to process
const STOCK_SYMBOLS = [
  'HDFCBANK',
  'RELIANCE',
  'TCS',
  'INFY',
  'ICICIBANK',
  // Add more stock symbols here
];

class StockDataAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Initializing browser...');

    // Create downloads directory if it doesn't exist
    if (!fs.existsSync(CONFIG.downloadPath)) {
      fs.mkdirSync(CONFIG.downloadPath, { recursive: true });
    }

    // Launch browser with download settings
    this.browser = await chromium.launch({
      headless: false, // Set to true for production
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1366, height: 768 });

    console.log('✅ Browser initialized');
  }

  async downloadExcelFile(symbol) {
    try {
      console.log(`📥 Downloading Excel file for ${symbol}...`);

      const screenerUrl = `${CONFIG.screenerBaseUrl}${symbol}/`;
      await this.page.goto(screenerUrl, { waitUntil: 'networkidle' });

      // Wait for the Export to Excel button and click it
      await this.page.waitForSelector('a[href*="export"]', { timeout: 10000 });

      // Get the download URL
      const downloadUrl = await this.page.getAttribute('a[href*="export"]', 'href');

      // Download the file directly
      const response = await this.page.goto(downloadUrl);
      const buffer = await response.body();

      // Save the file with stock symbol name
      const fileName = `${symbol}.xlsx`;
      const filePath = path.join(CONFIG.downloadPath, fileName);
      fs.writeFileSync(filePath, buffer);

      console.log(`✅ Downloaded: ${fileName}`);
      return filePath;

    } catch (error) {
      console.error(`❌ Error downloading ${symbol}:`, error.message);
      return null;
    }
  }

  async uploadToAdmin(symbol, filePath) {
    try {
      console.log(`📤 Uploading ${symbol} to admin panel...`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('symbol', symbol);

      // Upload to admin endpoint
      const uploadUrl = `${CONFIG.adminBaseUrl}${symbol}/upload`;

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${CONFIG.adminToken}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
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

  async processStock(symbol) {
    console.log(`\n🔄 Processing ${symbol}...`);

    try {
      // Step 1: Download Excel file
      const filePath = await this.downloadExcelFile(symbol);
      if (!filePath) {
        console.log(`⚠️ Skipping ${symbol} - download failed`);
        return false;
      }

      // Step 2: Upload to admin
      const uploaded = await this.uploadToAdmin(symbol, filePath);

      if (uploaded) {
        console.log(`🎉 Successfully processed ${symbol}`);
        return true;
      } else {
        console.log(`⚠️ ${symbol} processed with errors`);
        return false;
      }

    } catch (error) {
      console.error(`❌ Error processing ${symbol}:`, error.message);
      return false;
    }
  }

  async processAllStocks() {
    console.log(`\n📊 Starting automation for ${STOCK_SYMBOLS.length} stocks...\n`);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < STOCK_SYMBOLS.length; i++) {
      const symbol = STOCK_SYMBOLS[i];

      try {
        const success = await this.processStock(symbol);

        if (success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(symbol);
        }

        // Add delay between requests to be respectful
        if (i < STOCK_SYMBOLS.length - 1) {
          console.log(`⏳ Waiting ${CONFIG.delayBetweenStocks/1000}s before next stock...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenStocks));
        }

      } catch (error) {
        console.error(`❌ Fatal error processing ${symbol}:`, error.message);
        results.failed++;
        results.errors.push(symbol);
      }
    }

    return results;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  async run() {
    try {
      await this.init();
      const results = await this.processAllStocks();

      console.log('\n📈 AUTOMATION COMPLETE!');
      console.log('========================');
      console.log(`✅ Success: ${results.success}`);
      console.log(`❌ Failed: ${results.failed}`);

      if (results.errors.length > 0) {
        console.log(`⚠️ Failed stocks: ${results.errors.join(', ')}`);
      }

    } catch (error) {
      console.error('❌ Fatal error:', error.message);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the automation
if (require.main === module) {
  const automation = new StockDataAutomation();
  automation.run();
}

module.exports = StockDataAutomation;
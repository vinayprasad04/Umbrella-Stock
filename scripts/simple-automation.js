const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const puppeteer = require('puppeteer-core');

// Configuration
const CONFIG = {
  screenerBaseUrl: 'https://www.screener.in/api/company/',
  adminBaseUrl: 'http://localhost:3000/admin/stocks/',
  downloadPath: path.join(__dirname, 'downloads'),
  adminToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJkOThkY2JiM2I3MjE3ZDYzNDcwMjEiLCJlbWFpbCI6InZpbmF5LnFzc0BnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU4MzcwNDEyLCJleHAiOjE3NTgzNzEzMTJ9.x4mgZzgLgfagbua_uOX1tFDNO37CH4sZrtIA7LBYTSI',
  delayBetweenStocks: 3000 // 3 seconds delay between each stock
};

// List of stock symbols to process
const STOCK_SYMBOLS = [
  'HDFCBANK',
  'RELIANCE',
  'TCS',
  'INFY',
  'ICICIBANK',
  'BHARTIARTL',
  'ITC',
  'SBIN',
  'LT',
  'KOTAKBANK'
];

class SimpleStockAutomation {
  constructor() {
    // Create downloads directory if it doesn't exist
    if (!fs.existsSync(CONFIG.downloadPath)) {
      fs.mkdirSync(CONFIG.downloadPath, { recursive: true });
    }
  }

  async downloadExcelFile(symbol) {
    try {
      console.log(`📥 Downloading Excel file for ${symbol}...`);

      // Try to download directly from screener export URL
      const exportUrl = `https://www.screener.in/company/${symbol}/export/`;

      const response = await axios.get(exportUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });

      // Save the file with stock symbol name
      const fileName = `${symbol}.xlsx`;
      const filePath = path.join(CONFIG.downloadPath, fileName);
      fs.writeFileSync(filePath, response.data);

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
        maxBodyLength: Infinity,
        timeout: 60000
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

  async run() {
    console.log(`\n📊 Starting simple automation for ${STOCK_SYMBOLS.length} stocks...\n`);

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

    console.log('\n📈 AUTOMATION COMPLETE!');
    console.log('========================');
    console.log(`✅ Success: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log(`⚠️ Failed stocks: ${results.errors.join(', ')}`);
    }

    return results;
  }
}

// Run the automation
if (require.main === module) {
  const automation = new SimpleStockAutomation();
  automation.run();
}

module.exports = SimpleStockAutomation;
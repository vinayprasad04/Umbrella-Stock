const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration from config.js
const config = require('./config.js');

class StockAutomation {
  constructor() {
    this.stockSymbols = config.stockSymbols;
    this.adminToken = config.adminToken;
    this.adminBaseUrl = config.adminBaseUrl;
    this.downloadPath = config.downloadPath;
    this.delayBetweenStocks = config.delayBetweenStocks;
  }

  async uploadToAdmin(symbol, filePath) {
    try {
      console.log(`📤 Uploading ${symbol} to admin panel...`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('files', fs.createReadStream(filePath));
      formData.append('symbol', symbol);

      // Upload to admin endpoint
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
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Response: ${JSON.stringify(error.response.data)}`);
      }
      return false;
    }
  }

  async processStock(symbol, filePath) {
    console.log(`\n🔄 Processing ${symbol}...`);

    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found for ${symbol}: ${filePath}`);
        return false;
      }

      // Upload to admin
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
    console.log(`\n📊 Starting automation for manual upload...`);
    console.log(`📁 Please download Excel files manually and place them in: ${this.downloadPath}`);
    console.log(`📋 Expected files: ${this.stockSymbols.map(s => s + '.xlsx').join(', ')}`);
    console.log(`\nPress Enter to continue when files are ready...`);

    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    // Create downloads directory if it doesn't exist
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < this.stockSymbols.length; i++) {
      const symbol = this.stockSymbols[i];
      const filePath = path.join(this.downloadPath, `${symbol}.xlsx`);

      try {
        const success = await this.processStock(symbol, filePath);

        if (success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(symbol);
        }

        // Add delay between requests to be respectful
        if (i < this.stockSymbols.length - 1) {
          console.log(`⏳ Waiting ${this.delayBetweenStocks/1000}s before next stock...`);
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenStocks));
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
  const automation = new StockAutomation();
  automation.run();
}

module.exports = StockAutomation;
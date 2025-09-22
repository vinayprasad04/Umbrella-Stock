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
  hasActualData: { type: Boolean, default: false }
});

const EquityStock = mongoose.model('EquityStock', EquityStockSchema);

class UploadAnyFiles {
  constructor() {
    this.adminToken = config.adminToken;
    this.adminBaseUrl = config.adminBaseUrl;
    this.downloadPath = config.downloadPath;
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      notFound: 0,
      errors: []
    };
  }

  async connectDB() {
    try {
      const mongoUri = process.env.MONGODB_CONNECTION_URI;
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async findStockSymbol(fileName) {
    try {
      // Remove .xlsx extension and clean up the name
      const companyName = fileName.replace('.xlsx', '').trim();

      // Try to find by exact company name match
      let stock = await EquityStock.findOne({
        companyName: { $regex: new RegExp('^' + companyName + '$', 'i') },
        isActive: true,
        series: 'EQ'
      }).select('symbol companyName');

      if (stock) {
        return stock;
      }

      // Try partial match
      stock = await EquityStock.findOne({
        companyName: { $regex: new RegExp(companyName, 'i') },
        isActive: true,
        series: 'EQ'
      }).select('symbol companyName');

      if (stock) {
        return stock;
      }

      // Try searching by words in the name
      const words = companyName.split(/\s+/).filter(word => word.length > 2);
      if (words.length > 0) {
        const regex = words.map(word => `(?=.*${word})`).join('');
        stock = await EquityStock.findOne({
          companyName: { $regex: new RegExp(regex, 'i') },
          isActive: true,
          series: 'EQ'
        }).select('symbol companyName');

        if (stock) {
          return stock;
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ Error finding stock for ${fileName}:`, error.message);
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
        console.log(`✅ Successfully uploaded ${symbol}`);
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

  async processFile(fileName) {
    try {
      const filePath = path.join(this.downloadPath, fileName);

      console.log(`\n🔄 Processing: ${fileName}`);

      // Find the stock symbol for this company name
      const stock = await this.findStockSymbol(fileName);

      if (!stock) {
        console.log(`⚠️ Could not find stock symbol for: ${fileName}`);
        this.stats.notFound++;

        // Move to not-found folder instead of deleting
        const notFoundDir = path.join(this.downloadPath, 'not-found');
        if (!fs.existsSync(notFoundDir)) {
          fs.mkdirSync(notFoundDir);
        }

        const newPath = path.join(notFoundDir, fileName);
        fs.renameSync(filePath, newPath);
        console.log(`📁 Moved to: not-found/${fileName}`);

        return 'not-found';
      }

      console.log(`🎯 Found match: ${fileName} → ${stock.symbol} (${stock.companyName})`);

      // Upload to admin
      const uploaded = await this.uploadToAdmin(stock.symbol, filePath);

      if (uploaded) {
        this.stats.success++;
        return 'success';
      } else {
        this.stats.failed++;
        this.stats.errors.push(`${fileName} (${stock.symbol})`);
        return 'failed';
      }

    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error.message);
      this.stats.failed++;
      this.stats.errors.push(fileName);
      return 'failed';
    }
  }

  async run() {
    try {
      await this.connectDB();

      // Get all Excel files in downloads folder
      if (!fs.existsSync(this.downloadPath)) {
        console.log('❌ Downloads folder not found');
        return;
      }

      const files = fs.readdirSync(this.downloadPath)
        .filter(file => file.endsWith('.xlsx'))
        .sort();

      if (files.length === 0) {
        console.log('❌ No Excel files found in downloads folder');
        return;
      }

      this.stats.total = files.length;

      console.log(`\n🚀 Found ${files.length} Excel files to process`);
      console.log('🔍 Matching company names to stock symbols...\n');

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        await this.processFile(fileName);

        // Progress update
        if ((i + 1) % 5 === 0 || i === files.length - 1) {
          const percentage = (((i + 1) / files.length) * 100).toFixed(1);
          console.log(`\n📊 Progress: ${i + 1}/${files.length} (${percentage}%)`);
          console.log(`✅ Success: ${this.stats.success} | ❌ Failed: ${this.stats.failed} | ⚠️ Not Found: ${this.stats.notFound}`);
        }

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Final results
      console.log('\n🎉 UPLOAD COMPLETE!');
      console.log('===================');
      console.log(`📊 Total files: ${this.stats.total}`);
      console.log(`✅ Successfully uploaded: ${this.stats.success}`);
      console.log(`❌ Failed uploads: ${this.stats.failed}`);
      console.log(`⚠️ Stock symbols not found: ${this.stats.notFound}`);
      console.log(`📈 Success rate: ${((this.stats.success / this.stats.total) * 100).toFixed(1)}%`);

      if (this.stats.errors.length > 0) {
        console.log(`\n❌ Failed files: ${this.stats.errors.join(', ')}`);
      }

      if (this.stats.notFound > 0) {
        console.log(`\n⚠️ Files moved to not-found folder: ${this.stats.notFound}`);
        console.log('💡 These companies might not be in your database or have different names');
      }

    } catch (error) {
      console.error('❌ Fatal error:', error.message);
    } finally {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

if (require.main === module) {
  const uploader = new UploadAnyFiles();
  uploader.run();
}

module.exports = UploadAnyFiles;
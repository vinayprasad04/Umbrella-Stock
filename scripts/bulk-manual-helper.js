const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('../node_modules/mongoose');
const fs = require('fs');

// EquityStock model
const EquityStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  companyName: { type: String, required: true },
  series: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  hasActualData: { type: Boolean, default: false }
});

const EquityStock = mongoose.model('EquityStock', EquityStockSchema);

class BulkManualHelper {
  constructor() {
    this.batchSize = 50; // Process 50 stocks at a time
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

  async getAllStocksNeedingData() {
    try {
      console.log('📊 Fetching all stocks without data...');

      const stocks = await EquityStock.find({
        isActive: true,
        series: 'EQ',
        hasActualData: false
      }).select('symbol companyName').lean();

      console.log(`✅ Found ${stocks.length} stocks needing data`);
      return stocks;
    } catch (error) {
      console.error('❌ Error fetching stocks:', error.message);
      throw error;
    }
  }

  async generateBatches() {
    try {
      await this.connectDB();

      const allStocks = await this.getAllStocksNeedingData();

      if (allStocks.length === 0) {
        console.log('ℹ️ No stocks found needing data');
        return;
      }

      console.log(`\n📦 Creating batches of ${this.batchSize} stocks each...`);

      // Create batches
      const batches = [];
      for (let i = 0; i < allStocks.length; i += this.batchSize) {
        batches.push(allStocks.slice(i, i + this.batchSize));
      }

      console.log(`📊 Total: ${allStocks.length} stocks in ${batches.length} batches`);

      // Create batch files
      const batchDir = path.join(__dirname, 'batches');
      if (!fs.existsSync(batchDir)) {
        fs.mkdirSync(batchDir);
      }

      const allUrls = [];

      batches.forEach((batch, index) => {
        const batchNumber = index + 1;
        const fileName = `batch-${batchNumber}.txt`;
        const filePath = path.join(batchDir, fileName);

        const urls = batch.map(stock => `https://www.screener.in/company/${stock.symbol}/`);
        const content = [
          `# Batch ${batchNumber} of ${batches.length}`,
          `# ${batch.length} stocks`,
          `# Instructions:`,
          `# 1. Open each URL`,
          `# 2. Click "Export to Excel"`,
          `# 3. Save as {SYMBOL}.xlsx in downloads folder`,
          `# 4. Run: npm run automate-all when batch is complete`,
          ``,
          ...urls,
          ``,
          `# Stock symbols for this batch:`,
          ...batch.map(stock => `# ${stock.symbol} - ${stock.companyName}`)
        ].join('\n');

        fs.writeFileSync(filePath, content);
        console.log(`📄 Created: ${fileName} (${batch.length} stocks)`);

        allUrls.push(...urls);
      });

      // Create master list
      const masterFile = path.join(batchDir, 'all-urls.txt');
      fs.writeFileSync(masterFile, [
        `# ALL STOCK URLS (${allStocks.length} total)`,
        `# For bulk opening in browser`,
        ``,
        ...allUrls
      ].join('\n'));

      // Create batch runner HTML
      const htmlContent = this.generateBatchHTML(batches);
      fs.writeFileSync(path.join(batchDir, 'batch-runner.html'), htmlContent);

      // Create Windows batch file for opening URLs
      const batContent = this.generateWindowsBatch(batches);
      fs.writeFileSync(path.join(batchDir, 'open-batch.bat'), batContent);

      console.log('\n✅ Batch files created successfully!');
      console.log('\n📁 Files created:');
      console.log(`   batches/batch-1.txt to batches/batch-${batches.length}.txt`);
      console.log(`   batches/all-urls.txt (master list)`);
      console.log(`   batches/batch-runner.html (web interface)`);
      console.log(`   batches/open-batch.bat (Windows automation)`);

      console.log('\n🚀 Usage Options:');
      console.log('1. Manual: Open batch-1.txt and visit each URL');
      console.log('2. Semi-Auto: Run open-batch.bat to open URLs automatically');
      console.log('3. Web Interface: Open batch-runner.html in browser');
      console.log('4. After downloading: npm run automate-all');

      console.log('\n📊 Summary:');
      console.log(`Total stocks: ${allStocks.length}`);
      console.log(`Batch size: ${this.batchSize}`);
      console.log(`Number of batches: ${batches.length}`);
      console.log(`Estimated time per batch: ${Math.ceil(this.batchSize * 0.5)} minutes (30 sec per stock)`);
      console.log(`Total estimated time: ${Math.ceil(allStocks.length * 0.5 / 60)} hours`);

    } catch (error) {
      console.error('❌ Error generating batches:', error.message);
    } finally {
      await mongoose.disconnect();
    }
  }

  generateBatchHTML(batches) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Stock Data Batch Download Helper</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .batch { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .batch h3 { margin: 0 0 10px 0; color: #333; }
        .stats { background: #f5f5f5; padding: 10px; border-radius: 3px; margin: 10px 0; }
        button { background: #007cba; color: white; border: none; padding: 8px 15px; margin: 5px; border-radius: 3px; cursor: pointer; }
        button:hover { background: #005a82; }
        .url-list { max-height: 200px; overflow-y: auto; border: 1px solid #eee; padding: 10px; margin: 10px 0; }
        .completed { background: #d4edda; border-color: #c3e6cb; }
    </style>
</head>
<body>
    <h1>📊 Stock Data Batch Download Helper</h1>
    <div class="stats">
        <strong>Total Stocks:</strong> ${batches.reduce((sum, batch) => sum + batch.length, 0)} |
        <strong>Batches:</strong> ${batches.length} |
        <strong>Avg per batch:</strong> ${Math.round(batches.reduce((sum, batch) => sum + batch.length, 0) / batches.length)}
    </div>

    <h2>📋 Instructions</h2>
    <ol>
        <li>Click "Open All URLs" for a batch</li>
        <li>Go through each opened tab and click "Export to Excel"</li>
        <li>Save files as {SYMBOL}.xlsx in downloads folder</li>
        <li>Run <code>npm run automate-all</code> when batch is complete</li>
        <li>Mark batch as completed below</li>
    </ol>

    ${batches.map((batch, index) => `
    <div class="batch" id="batch-${index + 1}">
        <h3>📦 Batch ${index + 1} of ${batches.length} (${batch.length} stocks)</h3>
        <button onclick="openBatchUrls(${index + 1})">🔗 Open All URLs</button>
        <button onclick="markCompleted(${index + 1})">✅ Mark Completed</button>
        <button onclick="showUrls(${index + 1})">👁️ Show URLs</button>

        <div id="urls-${index + 1}" class="url-list" style="display: none;">
            ${batch.map(stock => `<div><a href="https://www.screener.in/company/${stock.symbol}/" target="_blank">${stock.symbol}</a> - ${stock.companyName}</div>`).join('')}
        </div>
    </div>
    `).join('')}

    <script>
        function openBatchUrls(batchNum) {
            const batch = ${JSON.stringify(batches)};
            const stocks = batch[batchNum - 1];

            if (confirm(\`Open \${stocks.length} URLs in new tabs?\`)) {
                stocks.forEach((stock, index) => {
                    setTimeout(() => {
                        window.open(\`https://www.screener.in/company/\${stock.symbol}/\`, '_blank');
                    }, index * 500); // 500ms delay between openings
                });
            }
        }

        function markCompleted(batchNum) {
            const batchDiv = document.getElementById(\`batch-\${batchNum}\`);
            batchDiv.classList.add('completed');

            // Save to localStorage
            const completed = JSON.parse(localStorage.getItem('completedBatches') || '[]');
            if (!completed.includes(batchNum)) {
                completed.push(batchNum);
                localStorage.setItem('completedBatches', JSON.stringify(completed));
            }
        }

        function showUrls(batchNum) {
            const urlsDiv = document.getElementById(\`urls-\${batchNum}\`);
            urlsDiv.style.display = urlsDiv.style.display === 'none' ? 'block' : 'none';
        }

        // Load completed batches from localStorage
        window.onload = function() {
            const completed = JSON.parse(localStorage.getItem('completedBatches') || '[]');
            completed.forEach(batchNum => {
                const batchDiv = document.getElementById(\`batch-\${batchNum}\`);
                if (batchDiv) batchDiv.classList.add('completed');
            });
        }
    </script>
</body>
</html>`;
  }

  generateWindowsBatch(batches) {
    return `@echo off
echo =====================================
echo Stock Data Batch URL Opener
echo =====================================
echo.
echo This will open URLs in batches for manual download
echo.

:menu
echo Choose a batch to open:
${batches.map((batch, index) => `echo ${index + 1}. Batch ${index + 1} (${batch.length} stocks)`).join('\n')}
echo 0. Exit
echo.
set /p choice="Enter your choice (0-${batches.length}): "

${batches.map((batch, index) => `
if "%choice%"=="${index + 1}" (
    echo Opening Batch ${index + 1} URLs...
${batch.map(stock => `    start "" "https://www.screener.in/company/${stock.symbol}/"`).join('\n')}
    echo.
    echo Opened ${batch.length} URLs for Batch ${index + 1}
    echo Please download Excel files and save as {SYMBOL}.xlsx
    echo Then run: npm run automate-all
    echo.
    pause
    goto menu
)`).join('')}

if "%choice%"=="0" goto end

echo Invalid choice. Please try again.
goto menu

:end
echo Goodbye!
pause`;
  }
}

if (require.main === module) {
  const helper = new BulkManualHelper();
  helper.generateBatches();
}

module.exports = BulkManualHelper;
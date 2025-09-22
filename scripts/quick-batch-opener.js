const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class QuickBatchOpener {
  constructor() {
    this.batchSize = 10; // Open 10 URLs at a time for manageable tabs
  }

  async openBatch(batchNumber = 1, startFrom = 0) {
    try {
      // Read batch file
      const batchFile = path.join(__dirname, 'batches', `batch-${batchNumber}.txt`);
      if (!fs.existsSync(batchFile)) {
        console.error(`❌ Batch file not found: ${batchFile}`);
        console.log('💡 Run: npm run bulk-manual first to generate batch files');
        return;
      }

      const batchContent = fs.readFileSync(batchFile, 'utf8');
      const allUrls = batchContent
        .split('\n')
        .filter(line => line.startsWith('https://'));

      // Get URLs for this mini-batch
      const urls = allUrls.slice(startFrom, startFrom + this.batchSize);
      const totalUrls = allUrls.length;

      if (urls.length === 0) {
        console.log('✅ All URLs in this batch have been processed!');
        return;
      }

      console.log(`\n🚀 Opening Batch ${batchNumber} - URLs ${startFrom + 1} to ${startFrom + urls.length} of ${totalUrls}`);
      console.log(`📊 Opening ${urls.length} URLs in browser tabs`);

      // Extract stock symbols for display
      const stocks = urls.map(url => {
        const match = url.match(/\/company\/([^\/]+)\//);
        return match ? match[1] : 'Unknown';
      });

      console.log(`📈 Stocks: ${stocks.join(', ')}`);

      // Open URLs in browser with delay
      console.log('\n🔗 Opening URLs...');

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const stock = stocks[i];

        console.log(`${i + 1}. Opening ${stock}...`);

        // Open URL in default browser
        exec(`start "" "${url}"`, (error) => {
          if (error) {
            console.error(`❌ Error opening ${stock}:`, error.message);
          }
        });

        // Small delay between opening tabs
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('\n✅ All URLs opened in browser tabs!');
      console.log('\n📋 Next Steps:');
      console.log('1. Go through each tab and click "Export to Excel"');
      console.log('2. Save files as {SYMBOL}.xlsx in downloads folder');
      console.log('3. When done with this mini-batch, run one of:');
      console.log(`   npm run quick-batch ${batchNumber} ${startFrom + this.batchSize}  # Next ${this.batchSize} URLs`);
      console.log(`   npm run automate-all  # Upload downloaded files`);

      // Show progress
      const remaining = totalUrls - (startFrom + urls.length);
      if (remaining > 0) {
        console.log(`\n📊 Progress: ${startFrom + urls.length}/${totalUrls} completed (${remaining} remaining)`);
      } else {
        console.log(`\n🎉 Batch ${batchNumber} complete! Run: npm run automate-all`);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  showBatchInfo() {
    try {
      const batchesDir = path.join(__dirname, 'batches');
      if (!fs.existsSync(batchesDir)) {
        console.log('❌ No batches directory found. Run: npm run bulk-manual first');
        return;
      }

      const batchFiles = fs.readdirSync(batchesDir)
        .filter(file => file.startsWith('batch-') && file.endsWith('.txt'))
        .sort();

      console.log('\n📦 Available Batches:');
      console.log('===================');

      batchFiles.forEach(file => {
        const batchNumber = file.match(/batch-(\d+)\.txt/)[1];
        const content = fs.readFileSync(path.join(batchesDir, file), 'utf8');
        const urlCount = content.split('\n').filter(line => line.startsWith('https://')).length;

        console.log(`Batch ${batchNumber}: ${urlCount} stocks`);
      });

      console.log('\n🚀 Usage:');
      console.log('npm run quick-batch 1     # Start batch 1 from beginning');
      console.log('npm run quick-batch 1 10  # Start batch 1 from stock 10');
      console.log('npm run quick-batch 2     # Start batch 2');
    } catch (error) {
      console.error('❌ Error reading batch info:', error.message);
    }
  }
}

// Command line usage
const args = process.argv.slice(2);

if (args.length === 0) {
  const opener = new QuickBatchOpener();
  opener.showBatchInfo();
} else {
  const batchNumber = parseInt(args[0]) || 1;
  const startFrom = parseInt(args[1]) || 0;

  const opener = new QuickBatchOpener();
  opener.openBatch(batchNumber, startFrom);
}

module.exports = QuickBatchOpener;
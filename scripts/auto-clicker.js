const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AutoClickerHelper {
  constructor() {
    this.downloadPath = './downloads';
    this.delayBetweenClicks = 3000; // 3 seconds between each stock
    this.maxConcurrentTabs = 5; // Process 5 stocks at a time
  }

  async run(batchNumber = 1) {
    try {
      // Read batch file
      const batchFile = path.join(__dirname, 'batches', `batch-${batchNumber}.txt`);
      if (!fs.existsSync(batchFile)) {
        console.error(`❌ Batch file not found: ${batchFile}`);
        return;
      }

      const batchContent = fs.readFileSync(batchFile, 'utf8');
      const urls = batchContent
        .split('\n')
        .filter(line => line.startsWith('https://'))
        .slice(0, 10); // Start with first 10 for testing

      console.log(`🚀 Starting auto-clicker for Batch ${batchNumber}`);
      console.log(`📊 Processing ${urls.length} stocks`);

      // Create downloads directory
      if (!fs.existsSync(this.downloadPath)) {
        fs.mkdirSync(this.downloadPath, { recursive: true });
      }

      // Launch browser
      const browser = await puppeteer.launch({
        headless: false, // Keep visible so you can see progress
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=1366,768'
        ]
      });

      // Process stocks in batches to avoid overwhelming
      for (let i = 0; i < urls.length; i += this.maxConcurrentTabs) {
        const batchUrls = urls.slice(i, i + this.maxConcurrentTabs);
        console.log(`\n📦 Processing mini-batch ${Math.floor(i/this.maxConcurrentTabs) + 1}: ${batchUrls.length} stocks`);

        await this.processMiniB(browser, batchUrls, i);

        // Wait between mini-batches
        if (i + this.maxConcurrentTabs < urls.length) {
          console.log('⏳ Waiting 10 seconds before next mini-batch...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }

      await browser.close();
      console.log('\n🎉 Auto-clicking complete!');
      console.log('📁 Check downloads folder for Excel files');
      console.log('🚀 Run: npm run automate-all to upload files');

    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async processMiniB(browser, urls, startIndex) {
    const pages = [];

    try {
      // Open all URLs in separate tabs
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const stockSymbol = this.extractSymbolFromUrl(url);

        console.log(`🔗 Opening ${stockSymbol}... (${startIndex + i + 1})`);

        const page = await browser.newPage();

        // Set download behavior for this page
        await page._client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: path.resolve(this.downloadPath)
        });

        // Go to the page
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        pages.push({ page, stockSymbol, url });

        // Small delay between opening tabs
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Now try to find and click export buttons on each page
      for (let i = 0; i < pages.length; i++) {
        const { page, stockSymbol } = pages[i];

        try {
          console.log(`🖱️ Looking for export button on ${stockSymbol}...`);

          // Wait for page to be fully loaded
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Try multiple selectors for export button
          const exportSelectors = [
            'a[href*="export"]',
            'button:contains("Export")',
            'a:contains("Export to Excel")',
            'a:contains("Export")',
            '.export-btn',
            '.btn:contains("Excel")',
            '[data-toggle*="export"]'
          ];

          let clicked = false;

          for (const selector of exportSelectors) {
            try {
              const element = await page.$(selector);
              if (element) {
                console.log(`✅ Found export button for ${stockSymbol} with selector: ${selector}`);

                await element.click();
                console.log(`🎯 Clicked export for ${stockSymbol}`);
                clicked = true;
                break;
              }
            } catch (error) {
              // Continue to next selector
            }
          }

          if (!clicked) {
            // Manual approach - log what we found
            const allButtons = await page.$$eval('a, button', elements => {
              return elements
                .filter(el => {
                  const text = el.textContent.toLowerCase();
                  const href = el.href || '';
                  return text.includes('export') || text.includes('excel') || text.includes('download') || href.includes('export');
                })
                .map(el => ({
                  text: el.textContent.trim(),
                  href: el.href || '',
                  tagName: el.tagName
                }));
            });

            if (allButtons.length > 0) {
              console.log(`🔍 ${stockSymbol} - Found potential buttons:`, allButtons);
              console.log(`⚠️ ${stockSymbol} - Manual click needed on this tab`);
            } else {
              console.log(`❌ ${stockSymbol} - No export button found`);
            }
          }

        } catch (error) {
          console.error(`❌ Error processing ${stockSymbol}:`, error.message);
        }

        // Small delay between processing each stock
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenClicks));
      }

      console.log('\n⏳ Waiting 30 seconds for downloads to complete...');
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Close all pages in this mini-batch
      for (const { page } of pages) {
        await page.close();
      }

    } catch (error) {
      console.error('❌ Error in mini-batch:', error.message);
    }
  }

  extractSymbolFromUrl(url) {
    const match = url.match(/\/company\/([^\/]+)\//);
    return match ? match[1] : 'Unknown';
  }
}

// Command line usage
const args = process.argv.slice(2);
const batchNumber = parseInt(args[0]) || 1;

if (require.main === module) {
  console.log(`🤖 Auto-Clicker for Batch ${batchNumber}`);
  console.log('This will:');
  console.log('1. Open multiple stock pages in browser tabs');
  console.log('2. Try to automatically click "Export to Excel" buttons');
  console.log('3. For stocks where auto-click fails, you\'ll need to manually click');
  console.log('4. Downloaded files will be saved to downloads folder');
  console.log('\nPress Enter to start...');

  process.stdin.once('data', () => {
    const autoClicker = new AutoClickerHelper();
    autoClicker.run(batchNumber);
  });
}

module.exports = AutoClickerHelper;
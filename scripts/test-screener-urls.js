const axios = require('axios');

// Test different URL patterns for stocks
const testStocks = ['BPCL', 'RELIANCE', 'HDFCBANK', 'TCS', 'COALINDIA', 'NTPC'];

async function testScreenerURL(symbol) {
  const patterns = [
    `https://www.screener.in/company/${symbol}/`,
    `https://www.screener.in/company/${symbol}/consolidated/`,
    `https://www.screener.in/company/${symbol}/standalone/`,
  ];

  const exportPatterns = [
    `https://www.screener.in/company/${symbol}/export/`,
    `https://www.screener.in/api/company/${symbol}/export/`,
    `https://www.screener.in/company/${symbol}/consolidated/export/`,
    `https://www.screener.in/company/${symbol}/standalone/export/`,
  ];

  console.log(`\n🧪 Testing ${symbol}:`);

  // Test main page patterns
  for (const url of patterns) {
    try {
      const response = await axios.head(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.status === 200) {
        console.log(`✅ Page exists: ${url}`);

        // Test corresponding export URLs
        const exportUrl = url.replace(/\/$/, '') + '/export/';
        try {
          const exportResponse = await axios.head(exportUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (exportResponse.status === 200) {
            console.log(`✅ Export works: ${exportUrl}`);
            return { pageUrl: url, exportUrl: exportUrl, works: true };
          }
        } catch (exportError) {
          console.log(`❌ Export failed: ${exportUrl} (${exportError.response?.status || exportError.message})`);
        }
      }
    } catch (error) {
      console.log(`❌ Page failed: ${url} (${error.response?.status || error.message})`);
    }
  }

  return { works: false };
}

async function testAllStocks() {
  console.log('🔍 Testing Screener.in URL patterns...\n');

  const results = {};

  for (const symbol of testStocks) {
    try {
      const result = await testScreenerURL(symbol);
      results[symbol] = result;

      // Add delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error testing ${symbol}:`, error.message);
      results[symbol] = { works: false, error: error.message };
    }
  }

  console.log('\n📊 Summary:');
  console.log('==========');

  Object.entries(results).forEach(([symbol, result]) => {
    if (result.works) {
      console.log(`✅ ${symbol}: ${result.exportUrl}`);
    } else {
      console.log(`❌ ${symbol}: Not working`);
    }
  });

  // Create a working URLs file
  const workingStocks = Object.entries(results)
    .filter(([symbol, result]) => result.works)
    .map(([symbol, result]) => ({ symbol, pageUrl: result.pageUrl, exportUrl: result.exportUrl }));

  if (workingStocks.length > 0) {
    const fs = require('fs');
    fs.writeFileSync('working-screener-urls.json', JSON.stringify(workingStocks, null, 2));
    console.log(`\n💾 Saved ${workingStocks.length} working URLs to working-screener-urls.json`);
  }
}

if (require.main === module) {
  testAllStocks();
}

module.exports = { testScreenerURL };
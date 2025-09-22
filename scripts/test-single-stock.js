const StockDataAutomation = require('./automate-stock-data');

async function testSingleStock() {
  const automation = new StockDataAutomation();

  // Override config for testing
  automation.stockSymbols = ['HDFCBANK']; // Test with just one stock

  console.log('🧪 Testing automation with single stock: HDFCBANK');
  await automation.run();
}

testSingleStock();
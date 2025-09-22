const StockAutomation = require('./final-automation.js');

class CustomStockAutomation extends StockAutomation {
  constructor(customStocks = []) {
    super();
    // Override stock symbols if provided
    if (customStocks.length > 0) {
      this.stockSymbols = customStocks;
    }
  }
}

// Example usage:
if (require.main === module) {
  // Define your custom stock list here
  const myStocks = [
    'HDFCBANK',
    'RELIANCE',
    'TCS',
    'ADANIPORTS',
    'BAJAJFINSV'
    // Add your desired stocks
  ];

  console.log(`🎯 Running automation for custom stocks: ${myStocks.join(', ')}`);

  const automation = new CustomStockAutomation(myStocks);
  automation.run();
}

module.exports = CustomStockAutomation;
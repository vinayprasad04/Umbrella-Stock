const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkCollectionsRelationship() {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/umbrella-stock';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    const db = mongoose.connection.db;
    const equityStocksCollection = db.collection('equitystocks');
    const actualStockDetailsCollection = db.collection('actualstockdetails');

    // Check counts
    const equityStocksCount = await equityStocksCollection.countDocuments({});
    const actualStockDetailsCount = await actualStockDetailsCollection.countDocuments({});

    console.log('📊 Collection Counts:');
    console.log(`   EquityStocks: ${equityStocksCount}`);
    console.log(`   ActualStockDetails: ${actualStockDetailsCount}`);

    // Check active stocks
    const activeEquityStocks = await equityStocksCollection.countDocuments({ isActive: true });
    const activeActualStockDetails = await actualStockDetailsCollection.countDocuments({ isActive: true });

    console.log('\n📈 Active Records:');
    console.log(`   Active EquityStocks: ${activeEquityStocks}`);
    console.log(`   Active ActualStockDetails: ${activeActualStockDetails}`);

    // Sample from EquityStocks
    const equityStocksSamples = await equityStocksCollection.find({}).limit(3).toArray();
    console.log('\n📋 EquityStocks Sample:');
    equityStocksSamples.forEach((stock, i) => {
      console.log(`   ${i+1}. ${stock.symbol} - ${stock.companyName} (hasActualData: ${stock.hasActualData})`);
    });

    // Sample from ActualStockDetails
    const actualStockDetailsSamples = await actualStockDetailsCollection.find({}).limit(3).toArray();
    console.log('\n📋 ActualStockDetails Sample:');
    actualStockDetailsSamples.forEach((stock, i) => {
      console.log(`   ${i+1}. ${stock.symbol} - ${stock.companyName} (niftyIndex: ${stock.additionalInfo?.niftyIndex})`);
    });

    // Check overlap
    const equitySymbols = await equityStocksCollection.distinct('symbol');
    const actualSymbols = await actualStockDetailsCollection.distinct('symbol');

    const overlap = equitySymbols.filter(symbol => actualSymbols.includes(symbol));
    const onlyInEquity = equitySymbols.filter(symbol => !actualSymbols.includes(symbol));
    const onlyInActual = actualSymbols.filter(symbol => !equitySymbols.includes(symbol));

    console.log('\n🔍 Symbol Overlap Analysis:');
    console.log(`   Symbols in both collections: ${overlap.length}`);
    console.log(`   Only in EquityStocks: ${onlyInEquity.length}`);
    console.log(`   Only in ActualStockDetails: ${onlyInActual.length}`);

    // Check some specific Nifty 50 stocks
    const nifty50TestSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC'];
    console.log('\n🎯 Nifty 50 Test Stocks Analysis:');

    for (const symbol of nifty50TestSymbols) {
      const inEquity = await equityStocksCollection.findOne({ symbol });
      const inActual = await actualStockDetailsCollection.findOne({ symbol });

      console.log(`   ${symbol}:`);
      console.log(`     - In EquityStocks: ${inEquity ? 'YES' : 'NO'} ${inEquity ? `(hasActualData: ${inEquity.hasActualData})` : ''}`);
      console.log(`     - In ActualStockDetails: ${inActual ? 'YES' : 'NO'} ${inActual ? `(niftyIndex: ${inActual.additionalInfo?.niftyIndex})` : ''}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCollectionsRelationship();
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkNiftyData() {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/umbrella-stock';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('actualstockdetails');

    // Check total documents
    const total = await collection.countDocuments({});
    console.log('📊 Total ActualStockDetails:', total);

    // Check if niftyIndex field exists
    const withNifty = await collection.countDocuments({'additionalInfo.niftyIndex': {$exists: true}});
    console.log('🎯 With niftyIndex field:', withNifty);

    // Check niftyIndex values
    const niftyBreakdown = await collection.aggregate([
      {$group: {_id: '$additionalInfo.niftyIndex', count: {$sum: 1}}}
    ]).toArray();
    console.log('📈 Nifty Index breakdown:', niftyBreakdown);

    // Sample documents
    const samples = await collection.find({}).limit(3).toArray();
    console.log('\n📋 Sample documents structure:');
    samples.forEach((doc, i) => {
      console.log(`Sample ${i+1}: symbol=${doc.symbol}, niftyIndex=${doc.additionalInfo?.niftyIndex || 'undefined'}`);
    });

    // Check if we have any known Nifty 50 stocks
    const knownNifty50 = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC'];
    const nifty50Stocks = await collection.find({
      symbol: {$in: knownNifty50}
    }).toArray();

    console.log('\n🔍 Known Nifty 50 stocks in database:');
    nifty50Stocks.forEach(stock => {
      console.log(`${stock.symbol}: niftyIndex = ${stock.additionalInfo?.niftyIndex || 'NOT SET'}`);
    });

    await mongoose.disconnect();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkNiftyData();
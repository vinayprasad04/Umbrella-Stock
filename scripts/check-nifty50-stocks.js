const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkNifty50() {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('actualstockdetails');

    // Count stocks with NIFTY_50 in niftyIndices array
    const nifty50Count = await collection.countDocuments({
      'additionalInfo.niftyIndices': 'NIFTY_50'
    });

    console.log('\nStocks with NIFTY_50 in niftyIndices:', nifty50Count);

    // Get all stocks with NIFTY_50
    const nifty50Stocks = await collection.find({
      'additionalInfo.niftyIndices': 'NIFTY_50'
    }).project({ symbol: 1, companyName: 1, 'additionalInfo.niftyIndices': 1 }).sort({ symbol: 1 }).toArray();

    console.log('\nNifty 50 stocks found in database:');
    nifty50Stocks.forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.symbol}`);
    });

    // Also check if there are stocks with isActive = false
    const inactiveNifty50 = await collection.countDocuments({
      'additionalInfo.niftyIndices': 'NIFTY_50',
      'isActive': false
    });

    console.log('\nInactive Nifty 50 stocks:', inactiveNifty50);

    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkNifty50();

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_URI;
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testNiftyFilters = async () => {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    const collection = db.collection('actualstockdetails');

    console.log('🧪 Testing Nifty filter logic...\n');

    // Test individual classifications (current state)
    const nifty50Only = await collection.countDocuments({ 'additionalInfo.niftyIndex': 'NIFTY_50' });
    const nifty100Only = await collection.countDocuments({ 'additionalInfo.niftyIndex': 'NIFTY_100' });
    const nifty200Only = await collection.countDocuments({ 'additionalInfo.niftyIndex': 'NIFTY_200' });
    const nifty500Only = await collection.countDocuments({ 'additionalInfo.niftyIndex': 'NIFTY_500' });

    console.log('📊 Current individual classifications:');
    console.log(`   NIFTY_50 only: ${nifty50Only}`);
    console.log(`   NIFTY_100 only: ${nifty100Only}`);
    console.log(`   NIFTY_200 only: ${nifty200Only}`);
    console.log(`   NIFTY_500 only: ${nifty500Only}`);

    // Test cumulative logic (what API will return)
    const nifty50Cumulative = await collection.countDocuments({
      'additionalInfo.niftyIndex': 'NIFTY_50'
    });

    const nifty100Cumulative = await collection.countDocuments({
      'additionalInfo.niftyIndex': { $in: ['NIFTY_50', 'NIFTY_100'] }
    });

    const nifty200Cumulative = await collection.countDocuments({
      'additionalInfo.niftyIndex': { $in: ['NIFTY_50', 'NIFTY_100', 'NIFTY_200'] }
    });

    const nifty500Cumulative = await collection.countDocuments({
      'additionalInfo.niftyIndex': { $in: ['NIFTY_50', 'NIFTY_100', 'NIFTY_200', 'NIFTY_500'] }
    });

    console.log('\n🎯 Cumulative results (what users will see):');
    console.log(`   Nifty 50 filter: ${nifty50Cumulative} stocks`);
    console.log(`   Nifty 100 filter: ${nifty100Cumulative} stocks`);
    console.log(`   Nifty 200 filter: ${nifty200Cumulative} stocks`);
    console.log(`   Nifty 500 filter: ${nifty500Cumulative} stocks`);

    console.log('\n✅ Expected results:');
    console.log('   Nifty 50 filter: 50 stocks');
    console.log('   Nifty 100 filter: 100 stocks (50+50)');
    console.log('   Nifty 200 filter: 200 stocks (50+50+100)');
    console.log('   Nifty 500 filter: 500 stocks (50+50+100+300)');

    // Verification
    const isCorrect =
      nifty50Cumulative === 50 &&
      nifty100Cumulative === 100 &&
      nifty200Cumulative === 200 &&
      nifty500Cumulative === 500;

    console.log(`\n${isCorrect ? '✅' : '❌'} Filter logic is ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
};

testNiftyFilters();
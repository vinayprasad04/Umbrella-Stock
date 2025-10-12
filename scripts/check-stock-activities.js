const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const StockActivitySchema = new mongoose.Schema({}, { strict: false });
const StockActivity = mongoose.model('StockActivity', StockActivitySchema);

async function checkActivities() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_URI);
    console.log('✅ Connected to MongoDB\n');

    const symbol = process.argv[2] || 'HDFCBANK';

    // Check total activities
    const total = await StockActivity.countDocuments({ stockSymbol: symbol });
    console.log(`📊 Total activities for ${symbol}:`, total);

    // Check by type
    const byType = await StockActivity.aggregate([
      { $match: { stockSymbol: symbol } },
      { $group: { _id: '$activityType', count: { $sum: 1 } } }
    ]);
    console.log('\n📊 By activity type:', byType);

    // Sample activities
    const samples = await StockActivity.find({ stockSymbol: symbol }).limit(5).lean();
    console.log('\n📄 Sample activities:');
    samples.forEach((s, i) => {
      console.log(`\n${i + 1}. Type: ${s.activityType}`);
      console.log(`   Headline: ${s.headline}`);
      console.log(`   Published: ${s.publishedAt}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkActivities();

/**
 * Check News Statistics
 * Shows which stocks have news and which don't
 */

const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_CONNECTION_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_CONNECTION_URI not defined');
  process.exit(1);
}

async function checkStats() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Stock News Statistics');
  console.log('='.repeat(60) + '\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get total active stocks
    const totalStocks = await db.collection('equitystocks').countDocuments({ isActive: true });
    console.log(`📈 Total Active Stocks: ${totalStocks}`);

    // Get stocks with news
    const stocksWithNews = await db.collection('stockactivities').distinct('stockSymbol');
    console.log(`✅ Stocks WITH News: ${stocksWithNews.length}`);
    console.log(`❌ Stocks WITHOUT News: ${totalStocks - stocksWithNews.length}\n`);

    // Get total news count
    const totalNews = await db.collection('stockactivities').countDocuments();
    console.log(`📰 Total News Articles: ${totalNews}\n`);

    // Get top stocks by news count
    console.log('🔝 Top 20 Stocks by News Count:');
    console.log('-'.repeat(60));

    const topStocks = await db.collection('stockactivities').aggregate([
      {
        $group: {
          _id: '$stockSymbol',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]).toArray();

    topStocks.forEach((stock, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${stock._id.padEnd(15, ' ')} - ${stock.count} articles`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Success Rate: ${((stocksWithNews.length / totalStocks) * 100).toFixed(2)}%`);
    console.log(`📰 Average Articles per Stock: ${(totalNews / stocksWithNews.length).toFixed(2)}`);
    console.log('='.repeat(60) + '\n');

    // Show sample of stocks with news
    console.log('📋 Sample Stocks WITH News:');
    console.log(stocksWithNews.slice(0, 20).join(', '));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB\n');
  }
}

checkStats()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

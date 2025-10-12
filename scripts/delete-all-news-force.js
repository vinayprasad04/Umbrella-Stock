/**
 * Force Delete All Stock News/Activities (No Confirmation)
 *
 * This script removes all news and activities from the StockActivity collection
 * without asking for confirmation. Use with caution!
 *
 * ⚠️ WARNING: This will delete ALL news data permanently without confirmation!
 *
 * Usage: node scripts/delete-all-news-force.js
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_CONNECTION_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_CONNECTION_URI is not defined in .env.local');
  process.exit(1);
}

// Define Schema
const StockActivitySchema = new mongoose.Schema({
  stockSymbol: { type: String, required: true, uppercase: true, index: true },
  activityType: { type: String, required: true, index: true },
  headline: { type: String, required: true },
  summary: { type: String },
  publishedAt: { type: Date, required: true, index: true },
  source: { type: String },
  sourceUrl: { type: String }
}, { timestamps: true });

const StockActivity = mongoose.models.StockActivity || mongoose.model('StockActivity', StockActivitySchema);

async function deleteAllNews() {
  console.log('\n🗑️  DELETING ALL NEWS DATA (NO CONFIRMATION)\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get current count
    const currentCount = await StockActivity.countDocuments();
    console.log(`📊 Current news count: ${currentCount.toLocaleString()} articles\n`);

    if (currentCount === 0) {
      console.log('✨ No news data found. Database is already clean!\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Get count by source
    const sources = await StockActivity.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('📰 News by source (before deletion):');
    sources.forEach(src => {
      const sourceName = src._id || 'Unknown';
      console.log(`   - ${sourceName}: ${src.count.toLocaleString()} articles`);
    });

    // Delete all news
    console.log('\n🗑️  Deleting all news data...');
    const result = await StockActivity.deleteMany({});

    console.log('\n✅ Successfully deleted all news data!');
    console.log(`📊 Total articles deleted: ${result.deletedCount.toLocaleString()}\n`);

    // Verify deletion
    const remainingCount = await StockActivity.countDocuments();
    if (remainingCount === 0) {
      console.log('✨ Database is now clean. You can start fresh with:');
      console.log('   npm run sync-activities\n');
    } else {
      console.log(`⚠️  Warning: ${remainingCount} articles still remain in database.\n`);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

// Run the deletion
deleteAllNews()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

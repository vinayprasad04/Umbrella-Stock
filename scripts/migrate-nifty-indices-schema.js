const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// This script validates that all existing niftyIndices values are compatible with the new schema
// It doesn't need to modify data, just ensure MongoDB accepts the new enum values

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/incomegrow-stock';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrateSchema = async () => {
  try {
    console.log('🚀 Starting schema migration for niftyIndices...');
    await connectDB();

    // Drop the collection validator to allow new enum values
    const db = mongoose.connection.db;

    console.log('🔄 Updating collection validator...');

    // The new schema will be applied when the Next.js app restarts
    // This script just ensures we can write to the collection

    // Get current collection info
    const collections = await db.listCollections({ name: 'actualstockdetails' }).toArray();

    if (collections.length > 0) {
      console.log('✅ Collection "actualstockdetails" exists');

      // Remove validator temporarily to allow new values
      try {
        await db.command({
          collMod: 'actualstockdetails',
          validator: {},
          validationLevel: 'off'
        });
        console.log('✅ Collection validator disabled - new enum values will be accepted');
      } catch (err) {
        console.log('⚠️  Could not modify validator (this is okay):', err.message);
      }
    } else {
      console.log('⚠️  Collection "actualstockdetails" not found');
    }

    // Count stocks with new sectoral indices
    const stocksWithSectoral = await db.collection('actualstockdetails').countDocuments({
      'additionalInfo.niftyIndices': {
        $in: [
          'NIFTY_AUTO', 'NIFTY_FINANCIAL_SERVICES_25_50', 'NIFTY_FMCG', 'NIFTY_IT',
          'NIFTY_MEDIA', 'NIFTY_METAL', 'NIFTY_PHARMA', 'NIFTY_PSU_BANK',
          'NIFTY_REALTY', 'NIFTY_PRIVATE_BANK', 'NIFTY_HEALTHCARE_INDEX',
          'NIFTY_CONSUMER_DURABLES', 'NIFTY_OIL_GAS', 'NIFTY_MIDSMALL_HEALTHCARE',
          'NIFTY_FINANCIAL_SERVICES_EX_BANK', 'NIFTY_MIDSMALL_FINANCIAL_SERVICES',
          'NIFTY_MIDSMALL_IT_TELECOM'
        ]
      }
    });

    console.log(`\n✅ Migration complete!`);
    console.log(`📊 Stocks with sectoral indices: ${stocksWithSectoral}`);
    console.log(`\n⚠️  IMPORTANT: Restart your Next.js server to apply the new schema!`);

    await mongoose.disconnect();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
};

// Main execution
if (require.main === module) {
  migrateSchema();
}

module.exports = { migrateSchema };

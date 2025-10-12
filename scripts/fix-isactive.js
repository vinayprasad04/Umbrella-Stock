const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function fixIsActive() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_URI);
    console.log('✅ Connected to MongoDB\n');

    const StockActivity = mongoose.model('StockActivity', new mongoose.Schema({}, { strict: false }));

    // Update corporate actions to set isActive = true
    const result = await StockActivity.updateMany(
      {
        activityType: { $in: ['dividend', 'announcement', 'legal-order'] },
        $or: [
          { isActive: { $exists: false } },
          { isActive: null },
          { isActive: false }
        ]
      },
      { $set: { isActive: true } }
    );

    console.log(`✅ Updated ${result.modifiedCount} corporate actions to isActive: true`);

    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixIsActive();

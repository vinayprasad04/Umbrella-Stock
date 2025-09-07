import { connectToDatabase } from '@/lib/db';

/**
 * API endpoint for bulk updating mutual fund data
 * Method: POST
 * Body: { funds: Array of fund objects }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { funds } = req.body;

    // Validate input
    if (!funds || !Array.isArray(funds) || funds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid funds data provided'
      });
    }

    console.log(`📥 Received ${funds.length} funds for bulk update`);

    // Connect to database
    const { db } = await connectToDatabase();
    const collection = db.collection('mutualfunds');

    // Clear existing data first
    console.log('🗑️ Clearing existing mutual fund data...');
    const deleteResult = await collection.deleteMany({});
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing records`);

    // Insert new data in batches to avoid memory issues
    const BATCH_SIZE = 1000;
    let totalInserted = 0;
    let totalErrors = 0;

    console.log(`💾 Inserting ${funds.length} funds in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < funds.length; i += BATCH_SIZE) {
      const batch = funds.slice(i, i + BATCH_SIZE);
      
      try {
        // Validate each fund in the batch
        const validFunds = batch.filter(fund => {
          return fund.schemeCode && 
                 fund.schemeName && 
                 fund.nav !== null && 
                 fund.nav !== undefined &&
                 !isNaN(fund.nav);
        });

        if (validFunds.length > 0) {
          const result = await collection.insertMany(validFunds, { 
            ordered: false // Continue on individual errors
          });
          totalInserted += result.insertedCount;
        }

        const batchErrors = batch.length - validFunds.length;
        totalErrors += batchErrors;

        if (batchErrors > 0) {
          console.warn(`⚠️ Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batchErrors} invalid funds skipped`);
        }

      } catch (error) {
        console.error(`❌ Error in batch ${Math.floor(i/BATCH_SIZE) + 1}:`, error.message);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
          const duplicates = error.result?.writeErrors?.length || 0;
          totalInserted += batch.length - duplicates;
          totalErrors += duplicates;
          console.log(`⚠️ ${duplicates} duplicate keys in batch, continuing...`);
        } else {
          totalErrors += batch.length;
        }
      }

      // Log progress
      const progress = Math.min(i + BATCH_SIZE, funds.length);
      console.log(`⏳ Progress: ${progress}/${funds.length} (${(progress/funds.length*100).toFixed(1)}%)`);
    }

    // Update sync status
    try {
      await db.collection('sync_status').replaceOne(
        { type: 'mutual_funds_bulk' },
        {
          type: 'mutual_funds_bulk',
          lastSyncDate: new Date().toISOString(),
          fundCount: totalInserted,
          status: 'success',
          updatedAt: new Date()
        },
        { upsert: true }
      );
    } catch (error) {
      console.warn('⚠️ Could not update sync status:', error.message);
    }

    console.log(`✅ Bulk update completed: ${totalInserted} inserted, ${totalErrors} errors`);

    return res.status(200).json({
      success: true,
      message: 'Bulk update completed successfully',
      data: {
        totalReceived: funds.length,
        totalInserted: totalInserted,
        totalErrors: totalErrors
      }
    });

  } catch (error) {
    console.error('❌ Bulk update failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during bulk update',
      details: error.message
    });
  }
}

// Increase the payload size limit for bulk operations
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow up to 10MB for large datasets
    },
  },
};
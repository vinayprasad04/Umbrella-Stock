import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualStockDetail from '@/lib/models/ActualStockDetail';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    await connectDB();

    // Count documents with 'Unknown' sector
    const count = await ActualStockDetail.countDocuments({ 'additionalInfo.sector': 'Unknown' });
    console.log(`Found ${count} documents with 'Unknown' sector`);

    if (count === 0) {
      return res.status(200).json({
        success: true,
        message: 'No documents to update',
        count: 0
      });
    }

    // Update all 'Unknown' to 'Other'
    const result = await ActualStockDetail.updateMany(
      { 'additionalInfo.sector': 'Unknown' },
      { $set: { 'additionalInfo.sector': 'Other' } }
    );

    return res.status(200).json({
      success: true,
      message: 'Sector update completed successfully',
      found: count,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating sectors:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating sectors',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

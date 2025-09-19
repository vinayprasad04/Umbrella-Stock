import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualStockDetail from '@/lib/models/ActualStockDetail';
import { APIResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  await connectDB();

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Symbol is required',
    });
  }

  try {
    // Find stock detail with verified status and ratios
    const stockDetail: any = await ActualStockDetail.findOne({
      symbol: symbol.toUpperCase(),
      isActive: true,
      dataQuality: { $in: ['VERIFIED', 'EXCELLENT', 'GOOD'] }, // Only verified stocks
      ratios: { $exists: true, $ne: null } // Only if ratios exist
    }).select('symbol companyName ratios dataQuality').lean();

    if (!stockDetail || !stockDetail.ratios) {
      return res.status(404).json({
        success: false,
        error: 'No ratios found for this verified stock',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        symbol: stockDetail.symbol,
        companyName: stockDetail.companyName,
        ratios: stockDetail.ratios,
        dataQuality: stockDetail.dataQuality
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching stock ratios:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
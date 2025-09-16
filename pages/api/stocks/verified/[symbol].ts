import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualStockDetail from '@/lib/models/ActualStockDetail';
import { APIResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    await connectDB();
    
    const { symbol } = req.query;
    
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Stock symbol is required',
      });
    }

    // Find verified stock data only - return exact same structure as admin API
    const parsedStockDetail = await ActualStockDetail.findOne({
      symbol: symbol.toUpperCase(),
      dataQuality: 'VERIFIED',
      isActive: true
    }).lean();
    
    if (!parsedStockDetail) {
      return res.status(404).json({
        success: false,
        error: 'Verified stock data not found',
      });
    }

    // Return the exact same structure as admin API
    res.status(200).json({
      success: true,
      data: {
        parsedStockDetail: parsedStockDetail,
        isVerified: true,
        hasComprehensiveData: true
      },
    });
  } catch (error) {
    console.error('Error fetching verified stock details:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualStockDetail from '@/lib/models/ActualStockDetail';
import EquityStock from '@/lib/models/EquityStock';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  if (req.method !== 'DELETE') {
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

  console.log('🗑️ Delete Excel data request for symbol:', symbol.toUpperCase());

  // Verify JWT token
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const decoded = AuthUtils.verifyAccessToken(token);

    if (!decoded || !['ADMIN', 'DATA_ENTRY'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await connectDB();

    // Find and update the record to remove Excel data and uploaded files
    const updateResult = await ActualStockDetail.findOneAndUpdate(
      {
        symbol: symbol.toUpperCase(),
        isActive: true
      },
      {
        $unset: {
          meta: 1,
          profitAndLoss: 1,
          quarterlyData: 1,
          balanceSheet: 1,
          cashFlow: 1,
          priceData: 1,
          uploadedFiles: 1
        },
        $set: {
          lastUpdated: new Date()
        }
      },
      { new: true }
    );

    if (!updateResult) {
      return res.status(404).json({
        success: false,
        error: 'Stock record not found',
      });
    }

    console.log('✅ Excel data deleted successfully for symbol:', symbol.toUpperCase());

    // Update the EquityStock record to mark it as no longer having actual data
    await EquityStock.findOneAndUpdate(
      { symbol: symbol.toUpperCase(), isActive: true },
      {
        hasActualData: false,
        lastUpdated: new Date()
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Excel data deleted successfully',
      data: {
        symbol: updateResult.symbol,
        companyName: updateResult.companyName
      }
    });

  } catch (error: any) {
    console.error('❌ Error deleting Excel data:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to delete Excel data',
    });
  }
}
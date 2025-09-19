import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualStockDetail from '@/lib/models/ActualStockDetail';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<{
    modifiedCount: number;
    matchedCount: number;
  }>>
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const decoded = AuthUtils.verifyAccessToken(token);

    if (!decoded || !['ADMIN', 'DATA_ENTRY'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await connectDB();

    const { symbols, dataQuality } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'symbols array is required',
      });
    }

    if (!dataQuality || !['VERIFIED', 'PENDING_VERIFICATION', 'EXCELLENT', 'GOOD'].includes(dataQuality)) {
      return res.status(400).json({
        success: false,
        error: 'Valid dataQuality is required (VERIFIED, PENDING_VERIFICATION, EXCELLENT, GOOD)',
      });
    }

    try {
      const updateResult = await ActualStockDetail.updateMany(
        { symbol: { $in: symbols }, isActive: true },
        {
          $set: {
            dataQuality: dataQuality,
            lastUpdated: new Date(),
            enteredBy: decoded.email || 'Admin'
          }
        }
      );

      console.log(`📈 Bulk update result: ${updateResult.modifiedCount}/${updateResult.matchedCount} stocks updated to ${dataQuality}`);

      return res.status(200).json({
        success: true,
        data: {
          modifiedCount: updateResult.modifiedCount,
          matchedCount: updateResult.matchedCount
        },
        message: `Successfully updated ${updateResult.modifiedCount} stock(s) to ${dataQuality}`
      });

    } catch (error: any) {
      console.error('❌ Error in bulk update:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update stock statuses'
      });
    }

  } catch (error: any) {
    console.error('❌ Error in bulk update handler:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
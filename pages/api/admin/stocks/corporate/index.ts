import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth';
import StockActivity from '@/lib/models/StockActivity';

/**
 * GET /api/admin/stocks/corporate
 * Fetch corporate actions (dividends, announcements, legal orders) for a stock
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Verify authentication and admin role
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decodedToken = AuthUtils.verifyAccessToken(token);
    if (!decodedToken || !['ADMIN', 'DATA_ENTRY'].includes(decodedToken.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await connectDB();

    const { symbol, limit = '100' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ success: false, error: 'Symbol is required' });
    }

    // Fetch corporate actions (dividends, announcements, legal orders)
    const actions = await StockActivity.find({
      stockSymbol: symbol.toUpperCase(),
      activityType: { $in: ['dividend', 'announcement', 'legal-order'] }
    })
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit as string))
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        actions,
        total: actions.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching corporate actions:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}

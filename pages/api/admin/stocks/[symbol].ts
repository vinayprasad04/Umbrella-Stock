import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth';
import EquityStock from '@/lib/models/EquityStock';

/**
 * GET /api/admin/stocks/[symbol]
 * Fetch a single stock's information
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

    const { symbol } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ success: false, error: 'Symbol is required' });
    }

    const stock = await EquityStock.findOne({ symbol: symbol.toUpperCase() }).lean();

    if (!stock) {
      return res.status(404).json({ success: false, error: 'Stock not found' });
    }

    return res.status(200).json({
      success: true,
      data: stock
    });
  } catch (error: any) {
    console.error('Error fetching stock:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}

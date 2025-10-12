import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth';
import StockActivity from '@/lib/models/StockActivity';

/**
 * GET /api/admin/stocks/corporate
 * Fetch corporate actions (dividends, announcements, legal orders) for a stock
 *
 * POST /api/admin/stocks/corporate
 * Create a new corporate action
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
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

    // Handle POST - Create new corporate action
    if (req.method === 'POST') {
      const { stockSymbol, activityType, headline, summary, publishedAt, source, sourceUrl, imageUrl, metadata } = req.body;

      if (!stockSymbol || !activityType || !headline) {
        return res.status(400).json({ success: false, error: 'Stock symbol, activity type, and headline are required' });
      }

      const validTypes = ['news-article', 'news-video', 'dividend', 'announcement', 'legal-order'];
      if (!validTypes.includes(activityType)) {
        return res.status(400).json({ success: false, error: 'Invalid activity type' });
      }

      const newAction = await StockActivity.create({
        stockSymbol: stockSymbol.toUpperCase(),
        activityType,
        headline,
        summary,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        source,
        sourceUrl,
        imageUrl,
        metadata,
        isActive: true
      });

      return res.status(201).json({
        success: true,
        data: newAction,
        message: 'Corporate action created successfully'
      });
    }

    // Handle GET - Fetch corporate actions
    const { symbol, limit = '100' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ success: false, error: 'Symbol is required' });
    }

    // Fetch corporate actions (news, dividends, announcements, legal orders)
    const actions = await StockActivity.find({
      stockSymbol: symbol.toUpperCase(),
      activityType: { $in: ['news-article', 'news-video', 'dividend', 'announcement', 'legal-order'] }
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

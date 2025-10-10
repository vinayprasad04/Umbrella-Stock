import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import StockActivity from '@/lib/models/StockActivity';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  // Verify admin authentication
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
      error: 'Admin access required',
    });
  }

  await connectDB();

  if (req.method === 'GET') {
    // Get all news with pagination and filters
    try {
      const {
        page = '1',
        limit = '20',
        symbol,
        type,
        search
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const query: any = {};

      if (symbol) {
        query.stockSymbol = (symbol as string).toUpperCase();
      }

      if (type) {
        query.activityType = type;
      }

      if (search) {
        query.$or = [
          { headline: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } },
          { stockSymbol: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (pageNum - 1) * limitNum;

      const [activities, total] = await Promise.all([
        StockActivity.find(query)
          .sort({ publishedAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        StockActivity.countDocuments(query)
      ]);

      return res.status(200).json({
        success: true,
        data: {
          activities,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch news'
      });
    }
  }

  if (req.method === 'POST') {
    // Create new news article
    try {
      const {
        stockSymbol,
        activityType,
        headline,
        summary,
        publishedAt,
        source,
        sourceUrl,
        imageUrl,
        tags
      } = req.body;

      // Validate required fields
      if (!stockSymbol || !activityType || !headline || !publishedAt) {
        return res.status(400).json({
          success: false,
          error: 'Required fields: stockSymbol, activityType, headline, publishedAt'
        });
      }

      const activity = await StockActivity.create({
        stockSymbol: stockSymbol.toUpperCase(),
        activityType,
        headline,
        summary,
        publishedAt: new Date(publishedAt),
        source,
        sourceUrl,
        imageUrl,
        tags: tags || [],
        isActive: true,
        feedType: activityType
      });

      return res.status(201).json({
        success: true,
        data: activity,
        message: 'News article created successfully'
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate news article (same stock, headline, and date)'
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create news article'
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}

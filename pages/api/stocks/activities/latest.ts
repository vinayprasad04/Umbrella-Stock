import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import StockActivity, { ActivityType } from '@/lib/models/StockActivity';
import { APIResponse } from '@/types';

/**
 * Get latest activities across all stocks
 * Useful for showing a news feed on homepage
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<{
    activities: any[];
    total: number;
    page: number;
    limit: number;
  }>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const {
      page = '1',
      limit = '20',
      type,
      symbols
    } = req.query;

    await connectDB();

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Build query
    const query: any = {
      isActive: true
    };

    // Filter by activity type if provided
    if (type) {
      query.activityType = type as ActivityType;
    }

    // Filter by specific symbols if provided
    if (symbols) {
      const symbolArray = typeof symbols === 'string'
        ? symbols.split(',').map(s => s.toUpperCase())
        : symbols;
      query.stockSymbol = { $in: symbolArray };
    }

    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;

    // Fetch activities with pagination
    const [activities, total] = await Promise.all([
      StockActivity.find(query)
        .sort({ publishedAt: -1, priority: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-__v')
        .lean(),
      StockActivity.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        activities,
        total,
        page: pageNum,
        limit: limitNum
      }
    });

  } catch (error: any) {
    console.error('Fetch latest activities error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch activities',
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import StockActivity, { ActivityType } from '@/lib/models/StockActivity';
import { APIResponse } from '@/types';

interface ActivityQueryParams {
  page: number;
  limit: number;
  type?: ActivityType;
  startDate?: Date;
  endDate?: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<{
    activities: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { symbol } = req.query;
    const {
      page = '1',
      limit = '20',
      type,
      startDate,
      endDate
    } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Stock symbol is required',
      });
    }

    await connectDB();

    const params: ActivityQueryParams = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      type: type as ActivityType,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    // Build query
    const query: any = {
      stockSymbol: symbol.toUpperCase(),
      isActive: true
    };

    // Filter by activity type if provided
    if (params.type) {
      query.activityType = params.type;
    }

    // Filter by date range if provided
    if (params.startDate || params.endDate) {
      query.publishedAt = {};
      if (params.startDate) {
        query.publishedAt.$gte = params.startDate;
      }
      if (params.endDate) {
        query.publishedAt.$lte = params.endDate;
      }
    }

    // Calculate pagination
    const skip = (params.page - 1) * params.limit;

    // Fetch activities with pagination
    const [activities, total] = await Promise.all([
      StockActivity.find(query)
        .sort({ publishedAt: -1, priority: -1 })
        .skip(skip)
        .limit(params.limit)
        .select('-__v')
        .lean(),
      StockActivity.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / params.limit);
    const hasMore = params.page < totalPages;

    return res.status(200).json({
      success: true,
      data: {
        activities,
        total,
        page: params.page,
        limit: params.limit,
        totalPages,
        hasMore
      }
    });

  } catch (error: any) {
    console.error('Fetch activities error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch activities',
    });
  }
}

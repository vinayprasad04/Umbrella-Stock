import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/lib/models/ActivityLog';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

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
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const decoded = AuthUtils.verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    await connectDB();

    const { limit, category } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 50;

    // Build filter
    const filter: any = { userId: decoded.userId };
    if (category) {
      filter.category = category;
    }

    // Fetch activity logs for the current user
    const activities = await ActivityLog.find(filter)
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    const formattedActivities = activities.map(activity => ({
      id: activity._id.toString(),
      action: activity.action,
      category: activity.category,
      details: activity.details,
      admin: activity.adminId ? {
        name: (activity.adminId as any).name,
        email: (activity.adminId as any).email
      } : null,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      createdAt: activity.createdAt.toISOString()
    }));

    return res.status(200).json({
      success: true,
      data: {
        activities: formattedActivities,
        total: formattedActivities.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error in user activity history API:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

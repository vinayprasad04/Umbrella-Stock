import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/lib/models/ActivityLog';
import User from '@/lib/models/User';
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

    if (!decoded || decoded.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    await connectDB();

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    // Fetch activity logs for the user
    const activities = await ActivityLog.find({ userId })
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Get user info
    const user = await User.findById(userId).select('name email').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

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
        user: {
          name: user.name,
          email: user.email
        },
        activities: formattedActivities,
        total: formattedActivities.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error in activity history API:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  if (req.method !== 'POST') {
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

    // Find all users with active premium subscription but isPremium is false
    const usersToSync = await User.find({
      $or: [
        { isPremium: { $ne: true } },
        { isPremium: { $exists: false } }
      ],
      'subscription.plan': 'premium',
      'subscription.status': 'active'
    });

    console.log(`Found ${usersToSync.length} users to sync`);

    let syncedCount = 0;
    const syncedUsers = [];

    for (const user of usersToSync) {
      user.isPremium = true;
      user.markModified('isPremium');
      await user.save();

      syncedCount++;
      syncedUsers.push({
        id: user._id,
        email: user.email,
        name: user.name
      });

      console.log(`Synced user: ${user.email}`);
    }

    return res.status(200).json({
      success: true,
      message: `Synced ${syncedCount} users`,
      data: {
        syncedCount,
        users: syncedUsers
      }
    });

  } catch (error: any) {
    console.error('❌ Error in sync premium status API:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

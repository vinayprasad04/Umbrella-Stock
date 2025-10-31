import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';
import { ActivityLogger } from '@/lib/activityLogger';

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

    const { userId, action } = req.body;

    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        error: 'User ID and action are required',
      });
    }

    if (action !== 'deactivate' && action !== 'cancel') {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use "deactivate" or "cancel"',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.subscription) {
      return res.status(400).json({
        success: false,
        error: 'User does not have a subscription',
      });
    }

    // Check if this is a paid subscription
    const isPaidSubscription = user.isPremium && user.subscription.plan === 'premium';

    // Store before state for logging
    const beforeState = {
      isPremium: user.isPremium,
      subscriptionStatus: user.subscription.status,
      subscriptionPlan: user.subscription.plan
    };

    // Update subscription status
    user.subscription.status = action === 'deactivate' ? 'expired' : 'cancelled';

    // Remove premium status (for both paid and edge cases where isPremium wasn't set)
    user.isPremium = false;

    // Mark fields as modified
    user.markModified('isPremium');
    user.markModified('subscription');

    await user.save();

    console.log('[Admin] After cancel - isPremium:', user.isPremium, 'subscription status:', user.subscription.status);

    // Store after state for logging
    const afterState = {
      isPremium: user.isPremium,
      subscriptionStatus: user.subscription.status,
      subscriptionPlan: user.subscription.plan
    };

    // Log activity
    await ActivityLogger.logSubscriptionChange(
      user._id,
      decoded.userId,
      isPaidSubscription ? 'subscription_cancelled_paid' : 'subscription_cancelled_free',
      beforeState,
      afterState,
      {
        action,
        adminEmail: decoded.email,
        reason: 'Admin cancelled subscription'
      }
    );

    console.log('[Admin] Subscription cancelled:', {
      userId: user._id,
      adminId: decoded.userId,
      action,
      wasPaidSubscription: isPaidSubscription,
      isPremium: user.isPremium,
      newStatus: user.subscription.status
    });

    return res.status(200).json({
      success: true,
      message: isPaidSubscription
        ? 'Paid subscription cancelled successfully'
        : 'Subscription cancelled successfully',
      data: {
        userId: user._id,
        role: user.role,
        isPremium: user.isPremium,
        subscription: user.subscription
      }
    });

  } catch (error: any) {
    console.error('❌ Error in subscription management API:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

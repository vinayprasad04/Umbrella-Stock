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

    const { userId, durationDays } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const duration = durationDays || 365; // Default 1 year

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Store before state for logging
    const beforeState = {
      isPremium: user.isPremium,
      subscriptionStatus: user.subscription?.status,
      subscriptionPlan: user.subscription?.plan,
      subscriptionEndDate: user.subscription?.endDate
    };

    const startDate = new Date();
    const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

    // Set premium status first
    user.isPremium = true;

    // Create or update subscription
    user.subscription = {
      plan: 'premium',
      status: 'active',
      startDate: startDate,
      endDate: endDate,
      paymentId: user.subscription?.paymentId,
      orderId: user.subscription?.orderId,
      amount: user.subscription?.amount || 9900,
      autoRenew: false
    };

    // Mark fields as modified to ensure they're saved
    user.markModified('isPremium');
    user.markModified('subscription');

    await user.save();

    console.log('[Admin] After save - isPremium:', user.isPremium, 'subscription:', user.subscription);

    // Store after state for logging
    const afterState = {
      isPremium: user.isPremium,
      subscriptionStatus: user.subscription.status,
      subscriptionPlan: user.subscription.plan,
      subscriptionEndDate: user.subscription.endDate
    };

    // Log activity
    await ActivityLogger.logSubscriptionChange(
      user._id,
      decoded.userId,
      'subscription_reactivated_by_admin',
      beforeState,
      afterState,
      {
        adminEmail: decoded.email,
        durationDays: duration,
        reason: 'Admin manually reactivated subscription'
      }
    );

    console.log('[Admin] Subscription reactivated:', {
      userId: user._id,
      adminId: decoded.userId,
      duration: `${duration} days`,
      endDate: endDate.toISOString()
    });

    return res.status(200).json({
      success: true,
      message: `Subscription reactivated for ${duration} days`,
      data: {
        userId: user._id,
        isPremium: user.isPremium,
        subscription: user.subscription
      }
    });

  } catch (error: any) {
    console.error('❌ Error in reactivate subscription API:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

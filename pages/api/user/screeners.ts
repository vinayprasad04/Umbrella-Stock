import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import SavedScreener from '@/models/SavedScreener';
import User from '@/lib/models/User';
import { AuthUtils } from '@/lib/auth';

// Screener limits based on user type
const SCREENER_LIMITS = {
  FREE: 2,
  PREMIUM: 10,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const decoded = AuthUtils.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    const userId = decoded.userId;

    if (req.method === 'GET') {
      // Get all saved screeners for the user
      const screeners = await SavedScreener.find({ userId })
        .sort({ updatedAt: -1 })
        .select('_id title description filters createdAt updatedAt');

      // Get user's premium status for limit information
      const user = await User.findById(userId).select('isPremium subscription');
      const isPremiumUser = user?.isPremium ||
                           (user?.subscription?.plan === 'premium' &&
                            user?.subscription?.status === 'active');
      const limit = isPremiumUser ? SCREENER_LIMITS.PREMIUM : SCREENER_LIMITS.FREE;

      return res.status(200).json({
        success: true,
        data: screeners,
        limit: limit,
        current: screeners.length,
        isPremium: isPremiumUser,
      });
    } else if (req.method === 'POST') {
      // Create a new saved screener
      const { title, description, filters } = req.body;

      if (!title || !description || !filters) {
        return res.status(400).json({
          success: false,
          error: 'Title, description, and filters are required',
        });
      }

      if (title.length > 30) {
        return res.status(400).json({
          success: false,
          error: 'Title must be 30 characters or less',
        });
      }

      // Check user's premium status
      const user = await User.findById(userId).select('isPremium subscription');

      // Determine if user is premium
      const isPremiumUser = user?.isPremium ||
                           (user?.subscription?.plan === 'premium' &&
                            user?.subscription?.status === 'active');

      // Get current screener count
      const currentCount = await SavedScreener.countDocuments({ userId });

      // Determine limit based on user type
      const limit = isPremiumUser ? SCREENER_LIMITS.PREMIUM : SCREENER_LIMITS.FREE;

      // Check if user has reached their limit
      if (currentCount >= limit) {
        return res.status(403).json({
          success: false,
          error: isPremiumUser
            ? `You have reached the maximum limit of ${limit} scanner pages for premium users.`
            : `You have reached the maximum limit of ${limit} scanner pages for free users. Upgrade to premium to create up to ${SCREENER_LIMITS.PREMIUM} scanner pages.`,
          limit: limit,
          current: currentCount,
          isPremium: isPremiumUser,
        });
      }

      const screener = await SavedScreener.create({
        userId,
        title,
        description,
        filters,
      });

      return res.status(201).json({
        success: true,
        data: screener,
        limit: limit,
        current: currentCount + 1,
        isPremium: isPremiumUser,
      });
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }
  } catch (error: any) {
    console.error('Screeners API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

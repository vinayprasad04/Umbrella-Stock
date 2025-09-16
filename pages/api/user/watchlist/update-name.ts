import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import UserPreferences from '@/lib/models/UserPreferences';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
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

    if (req.method !== 'PUT') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }

    const { watchlistId, name } = req.body;

    if (!watchlistId || !name || watchlistId < 1 || watchlistId > 5) {
      return res.status(400).json({
        success: false,
        error: 'Valid watchlistId (1-5) and name are required',
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Watchlist name must be 50 characters or less',
      });
    }

    console.log('📝 Updating watchlist name:', { watchlistId, name, userId: decoded.userId });

    // Update or create user preferences
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId: decoded.userId },
      {
        userId: decoded.userId,
        email: decoded.email,
        [`watchlistNames.${watchlistId.toString()}`]: name,
        updatedAt: new Date()
      },
      {
        upsert: true,
        new: true
      }
    );

    console.log('✅ Watchlist name updated successfully');

    return res.status(200).json({
      success: true,
      message: 'Watchlist name updated successfully',
      data: {
        watchlistId,
        name,
        allNames: preferences.watchlistNames
      }
    });

  } catch (error: any) {
    console.error('❌ Update watchlist name API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
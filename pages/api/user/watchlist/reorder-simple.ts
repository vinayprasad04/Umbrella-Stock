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

    const { symbolOrder, watchlistId = 1 }: { symbolOrder: string[], watchlistId?: number } = req.body;

    if (!symbolOrder || !Array.isArray(symbolOrder)) {
      return res.status(400).json({
        success: false,
        error: 'symbolOrder array is required',
      });
    }

    console.log('💾 Saving watchlist order for user:', decoded.userId, 'tab:', watchlistId);
    console.log('💾 Order:', symbolOrder);

    // Get current preferences
    let preferences = await UserPreferences.findOne({ userId: decoded.userId });
    
    if (!preferences) {
      // Create new preferences document
      preferences = new UserPreferences({
        userId: decoded.userId,
        email: decoded.email,
        watchlistOrder: symbolOrder, // For backward compatibility
        watchlistNames: new Map([
          ['1', 'Watchlist 1'],
          ['2', 'Watchlist 2'],
          ['3', 'Watchlist 3'],
          ['4', 'Watchlist 4'],
          ['5', 'Watchlist 5']
        ])
      });
    } else {
      // Update existing preferences
      preferences.watchlistOrder = symbolOrder; // For backward compatibility
      preferences.updatedAt = new Date();
    }
    
    await preferences.save();

    console.log('✅ Order saved successfully:', preferences.watchlistOrder);

    return res.status(200).json({
      success: true,
      message: 'Watchlist order updated successfully',
      data: {
        order: preferences.watchlistOrder
      }
    });

  } catch (error: any) {
    console.error('❌ Simple Reorder API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
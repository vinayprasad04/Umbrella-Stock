import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Watchlist from '@/lib/models/Watchlist';
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

  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'Symbol is required',
    });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(200).json({
      success: true,
      data: { inWatchlist: false },
    });
  }

  try {
    const decoded = AuthUtils.verifyAccessToken(token);

    if (!decoded) {
      return res.status(200).json({
        success: true,
        data: { inWatchlist: false },
      });
    }

    await connectDB();

    const watchlistItem = await Watchlist.findOne({
      email: decoded.email,
      symbol: symbol.toString().toUpperCase(),
      isActive: true
    });

    return res.status(200).json({
      success: true,
      data: {
        inWatchlist: !!watchlistItem,
        watchlistItem: watchlistItem || null
      },
    });

  } catch (error: any) {
    console.error('❌ Error checking watchlist:', error);
    return res.status(200).json({
      success: true,
      data: { inWatchlist: false },
    });
  }
}
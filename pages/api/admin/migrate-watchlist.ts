import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Watchlist from '@/lib/models/Watchlist';
import EquityStock from '@/lib/models/EquityStock';
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
    // Verify JWT token - admin only
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

    // Find all watchlist entries without type field or with null type
    const watchlistEntries = await Watchlist.find({
      $or: [
        { type: { $exists: false } },
        { type: null }
      ],
      isActive: true
    });

    console.log(`Found ${watchlistEntries.length} watchlist entries without type field`);

    let updatedCount = 0;
    const allStockSymbols = new Set();

    // Get all active stock symbols
    const stocks = await EquityStock.find({ isActive: true }).select('symbol');
    stocks.forEach(stock => allStockSymbols.add(stock.symbol.toUpperCase()));

    // Update each entry
    for (const entry of watchlistEntries) {
      const symbol = entry.symbol.toUpperCase();
      const isStock = allStockSymbols.has(symbol);
      const type = isStock ? 'STOCK' : 'MUTUAL_FUND';

      await Watchlist.findByIdAndUpdate(entry._id, { type });
      updatedCount++;

      console.log(`Updated ${symbol}: ${type}`);
    }

    return res.status(200).json({
      success: true,
      data: {
        totalFound: watchlistEntries.length,
        updated: updatedCount
      },
      message: `Successfully migrated ${updatedCount} watchlist entries`
    });

  } catch (error: any) {
    console.error('❌ Error migrating watchlist:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to migrate watchlist entries'
    });
  }
}
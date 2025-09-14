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

    switch (req.method) {
      case 'GET':
        return handleGetWatchlist(req, res, decoded);
      case 'POST':
        return handleAddToWatchlist(req, res, decoded);
      case 'DELETE':
        return handleRemoveFromWatchlist(req, res, decoded);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
        });
    }
  } catch (error: any) {
    console.error('❌ Watchlist API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

async function handleGetWatchlist(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>,
  decoded: any
) {
  try {
    const watchlistItems = await Watchlist.find({
      email: decoded.email,
      isActive: true
    })
    .sort({ addedAt: -1 })
    .lean();

    return res.status(200).json({
      success: true,
      data: {
        watchlist: watchlistItems,
        total: watchlistItems.length
      },
      message: 'Watchlist retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting watchlist:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve watchlist',
    });
  }
}

async function handleAddToWatchlist(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>,
  decoded: any
) {
  const { symbol, companyName, type = 'STOCK' } = req.body;

  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'Symbol is required',
    });
  }

  try {
    let finalCompanyName = companyName;

    // For stocks, validate they exist and get company name
    if (type === 'STOCK') {
      const stock = await EquityStock.findOne({
        symbol: symbol.toUpperCase(),
        isActive: true
      });

      if (!stock) {
        return res.status(404).json({
          success: false,
          error: 'Stock not found',
        });
      }

      finalCompanyName = stock.companyName;
    } else if (type === 'MUTUAL_FUND' && !companyName) {
      return res.status(400).json({
        success: false,
        error: 'Company name is required for mutual funds',
      });
    }

    // Check if already in watchlist
    const existingWatchlist = await Watchlist.findOne({
      email: decoded.email,
      symbol: symbol.toUpperCase(),
      isActive: true
    });

    if (existingWatchlist) {
      return res.status(400).json({
        success: false,
        error: `${type === 'STOCK' ? 'Stock' : 'Mutual fund'} already in watchlist`,
      });
    }

    // Add to watchlist
    const watchlistItem = await Watchlist.create({
      userId: decoded.userId,
      email: decoded.email,
      symbol: symbol.toUpperCase(),
      companyName: finalCompanyName,
      type: type,
      addedAt: new Date(),
      isActive: true
    });

    return res.status(201).json({
      success: true,
      data: watchlistItem,
      message: `${type === 'STOCK' ? 'Stock' : 'Mutual fund'} added to watchlist successfully`
    });
  } catch (error: any) {
    console.error('❌ Error adding to watchlist:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: `${type === 'STOCK' ? 'Stock' : 'Mutual fund'} already in watchlist`,
      });
    }

    return res.status(500).json({
      success: false,
      error: `Failed to add ${type === 'STOCK' ? 'stock' : 'mutual fund'} to watchlist`,
    });
  }
}

async function handleRemoveFromWatchlist(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>,
  decoded: any
) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'Symbol is required',
    });
  }

  try {
    const result = await Watchlist.findOneAndUpdate(
      {
        email: decoded.email,
        symbol: symbol.toString().toUpperCase(),
        isActive: true
      },
      {
        isActive: false
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found in watchlist',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Stock removed from watchlist successfully'
    });
  } catch (error) {
    console.error('❌ Error removing from watchlist:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove stock from watchlist',
    });
  }
}
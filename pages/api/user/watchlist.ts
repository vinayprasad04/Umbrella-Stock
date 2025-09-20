import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Watchlist from '@/lib/models/Watchlist';
import EquityStock from '@/lib/models/EquityStock';
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
    const { watchlistId = 1 } = req.query;
    const tabId = parseInt(watchlistId.toString()) || 1;

    // Get watchlist items for specific tab
    const watchlistItems = await Watchlist.find({
      userId: decoded.userId,
      isActive: true,
      watchlistId: tabId
    }).lean();

    console.log('🔍 Found watchlist items:', watchlistItems.map(item => item.symbol));

    // Sort by the order field for this specific tab
    const sortedItems = [...watchlistItems].sort((a: any, b: any) => {
      // Sort by order field, then by addedAt for items without order
      const aOrder = a.order !== undefined && a.order !== null ? a.order : 999999;
      const bOrder = b.order !== undefined && b.order !== null ? b.order : 999999;

      console.log(`🔄 Sorting: ${a.symbol}(order: ${a.order}) vs ${b.symbol}(order: ${b.order})`);

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // If same order or both don't have order, sort by date (newest first)
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });

    console.log('✅ Final sorted items:', sortedItems.map(item => item.symbol));

    // Get all watchlists count for limits
    const allWatchlistItems = await Watchlist.find({
      userId: decoded.userId,
      isActive: true
    }).lean();

    // Get tab counts
    const tabCounts: { [key: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      tabCounts[i] = allWatchlistItems.filter((item: any) => item.watchlistId === i).length;
    }

    // Get user preferences for watchlist names
    const userPreferences: any = await UserPreferences.findOne({
      userId: decoded.userId
    }).lean();

    // Get watchlist names - convert Map to object
    const watchlistNamesMap = userPreferences?.watchlistNames;
    const watchlistNames: { [key: number]: string } = {};
    
    if (watchlistNamesMap instanceof Map) {
      // Convert Map to object
      watchlistNamesMap.forEach((value, key) => {
        watchlistNames[parseInt(key)] = value;
      });
    } else if (watchlistNamesMap && typeof watchlistNamesMap === 'object') {
      // Handle case where it's already an object
      Object.keys(watchlistNamesMap).forEach(key => {
        watchlistNames[parseInt(key)] = (watchlistNamesMap as any)[key];
      });
    }
    
    // Fill in defaults for missing entries
    for (let i = 1; i <= 5; i++) {
      if (!watchlistNames[i]) {
        watchlistNames[i] = `Watchlist ${i}`;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        watchlist: sortedItems,
        total: sortedItems.length,
        currentTab: tabId,
        tabCounts,
        totalItems: allWatchlistItems.length,
        watchlistNames
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
  const { symbol, companyName, type = 'STOCK', watchlistId } = req.body;

  console.log('📥 Watchlist add request:', { symbol, companyName, type, watchlistId, userId: decoded.userId });

  if (!symbol) {
    console.log('❌ Symbol is required');
    return res.status(400).json({
      success: false,
      error: 'Symbol is required',
    });
  }

  try {
    // Check total items limit (100 max)
    const totalItems = await Watchlist.countDocuments({
      userId: decoded.userId,
      isActive: true
    });

    if (totalItems >= 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum number of watchlist items reached (100). Please remove some items first.',
      });
    }

    // Determine which tab to use
    let targetWatchlistId = watchlistId || 1;
    
    // If no specific tab provided, find the first available tab with space
    if (!watchlistId) {
      for (let i = 1; i <= 5; i++) {
        const tabCount = await Watchlist.countDocuments({
          userId: decoded.userId,
          isActive: true,
          watchlistId: i
        });
        
        if (tabCount < 20) {
          targetWatchlistId = i;
          break;
        }
      }
      
      // If all tabs are full, return error
      if (targetWatchlistId === 1) {
        const firstTabCount = await Watchlist.countDocuments({
          userId: decoded.userId,
          isActive: true,
          watchlistId: 1
        });
        
        if (firstTabCount >= 20) {
          return res.status(400).json({
            success: false,
            error: 'All watchlist tabs are full (20 items each). Please remove some items first.',
          });
        }
      }
    } else {
      // Check if specified tab has space
      const tabCount = await Watchlist.countDocuments({
        userId: decoded.userId,
        isActive: true,
        watchlistId: targetWatchlistId
      });
      
      if (tabCount >= 20) {
        return res.status(400).json({
          success: false,
          error: `Watchlist tab ${targetWatchlistId} is full (20 items max). Choose another tab or remove some items.`,
        });
      }
    }

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

    // Check if already in ANY watchlist tab (active records)
    const existingActiveWatchlist = await Watchlist.findOne({
      userId: decoded.userId,
      symbol: symbol.toUpperCase(),
      isActive: true
    });

    if (existingActiveWatchlist) {
      return res.status(400).json({
        success: false,
        error: `${type === 'STOCK' ? 'Stock' : 'Mutual fund'} already in watchlist tab ${existingActiveWatchlist.watchlistId}`,
      });
    }

    // Check for inactive records in the target tab that might cause unique constraint issues
    const inactiveRecord = await Watchlist.findOne({
      userId: decoded.userId,
      symbol: symbol.toUpperCase(),
      watchlistId: targetWatchlistId,
      isActive: false
    });

    if (inactiveRecord) {
      console.log('🔄 Found inactive record, reactivating instead of creating new:', inactiveRecord._id);
      // Reactivate the existing record instead of creating a new one
      inactiveRecord.isActive = true;
      inactiveRecord.addedAt = new Date();
      inactiveRecord.companyName = finalCompanyName;
      inactiveRecord.type = type;

      // Get the current maximum order for this specific tab
      const maxOrderItem: any = await Watchlist.findOne({
        userId: decoded.userId,
        isActive: true,
        watchlistId: targetWatchlistId
      }).sort({ order: -1 }).lean();

      inactiveRecord.order = (maxOrderItem?.order || 0) + 1;

      await inactiveRecord.save();

      console.log('✅ Reactivated existing watchlist item:', inactiveRecord._id);

      return res.status(201).json({
        success: true,
        data: {
          ...inactiveRecord.toObject(),
          addedToTab: targetWatchlistId
        },
        message: `${type === 'STOCK' ? 'Stock' : 'Mutual fund'} added to watchlist tab ${targetWatchlistId} successfully`
      });
    }

    // Get the current maximum order for this specific tab
    const maxOrderItem: any = await Watchlist.findOne({
      userId: decoded.userId,
      isActive: true,
      watchlistId: targetWatchlistId
    }).sort({ order: -1 }).lean();

    const nextOrder = (maxOrderItem?.order || 0) + 1;

    // Add to watchlist
    console.log('💾 Creating watchlist item:', {
      userId: decoded.userId,
      symbol: symbol.toUpperCase(),
      companyName: finalCompanyName,
      type: type,
      watchlistId: targetWatchlistId,
      order: nextOrder
    });

    const watchlistItem = await Watchlist.create({
      userId: decoded.userId,
      email: decoded.email,
      symbol: symbol.toUpperCase(),
      companyName: finalCompanyName,
      type: type,
      addedAt: new Date(),
      isActive: true,
      order: nextOrder,
      watchlistId: targetWatchlistId
    });

    console.log('✅ Watchlist item created successfully:', watchlistItem._id);

    return res.status(201).json({
      success: true,
      data: {
        ...watchlistItem.toObject(),
        addedToTab: targetWatchlistId
      },
      message: `${type === 'STOCK' ? 'Stock' : 'Mutual fund'} added to watchlist tab ${targetWatchlistId} successfully`
    });
  } catch (error: any) {
    console.error('❌ Error adding to watchlist:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: `${type === 'STOCK' ? 'Stock' : 'Mutual fund'} already in watchlist`,
      });
    }

    return res.status(500).json({
      success: false,
      error: `Failed to add ${type === 'STOCK' ? 'stock' : 'mutual fund'} to watchlist: ${error.message}`,
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
        userId: decoded.userId,
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
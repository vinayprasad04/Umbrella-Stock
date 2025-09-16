import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Watchlist from '@/lib/models/Watchlist';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';
import mongoose from 'mongoose';

interface ReorderItem {
  id: string;
  order: number;
}

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

    const { items, watchlistId = 1 }: { items: ReorderItem[], watchlistId?: number } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required',
      });
    }

    // Update the order for each watchlist item
    console.log('Reordering items for user:', decoded.userId, 'tab:', watchlistId);
    console.log('Items to reorder:', items);

    const updatePromises = items.map(async (item) => {
      console.log(`Attempting to update item:`, { 
        id: item.id, 
        order: item.order, 
        userId: decoded.userId,
        watchlistId: watchlistId
      });
      
      const result = await Watchlist.findOneAndUpdate(
        { 
          _id: new mongoose.Types.ObjectId(item.id), 
          userId: decoded.userId,
          watchlistId: watchlistId
        },
        { 
          $set: { 
            order: item.order,
            lastUpdated: new Date()
          }
        },
        { new: true }
      );
      
      console.log(`Update result for ${item.id}:`, {
        found: !!result,
        newOrder: result?.order,
        symbol: result?.symbol
      });
      
      return result;
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r !== null).length;
    console.log('Reorder completed, updated items:', successCount, 'out of', items.length);

    if (successCount !== items.length) {
      console.error('Some items failed to update:', {
        expected: items.length,
        actual: successCount,
        failed: items.length - successCount
      });
    }

    // Verify the updates by fetching the items again
    const verifyItems = await Watchlist.find({
      userId: decoded.userId,
      isActive: true,
      watchlistId: watchlistId
    }).select('_id symbol order').sort({ order: 1 }).lean();
    
    console.log('Current order after update:', verifyItems.map((item: any) => ({
      id: item._id?.toString(),
      symbol: item.symbol,
      order: item.order
    })));

    return res.status(200).json({
      success: true,
      message: 'Watchlist order updated successfully',
      data: {
        updatedCount: successCount,
        currentOrder: verifyItems.map((item: any) => ({
          id: item._id?.toString(),
          order: item.order
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Watchlist Reorder API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
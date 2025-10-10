import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import StockActivity from '@/lib/models/StockActivity';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';
import mongoose from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid news ID'
    });
  }

  // Verify admin authentication
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const decoded = AuthUtils.verifyAccessToken(token);
  if (!decoded || !['ADMIN', 'DATA_ENTRY'].includes(decoded.role)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  await connectDB();

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid news ID format'
    });
  }

  if (req.method === 'GET') {
    // Get single news article
    try {
      const activity = await StockActivity.findById(id);

      if (!activity) {
        return res.status(404).json({
          success: false,
          error: 'News article not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: activity
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch news article'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update news article
    try {
      const {
        stockSymbol,
        activityType,
        headline,
        summary,
        publishedAt,
        source,
        sourceUrl,
        imageUrl,
        tags,
        isActive
      } = req.body;

      const updateData: any = {};

      if (stockSymbol) updateData.stockSymbol = stockSymbol.toUpperCase();
      if (activityType) updateData.activityType = activityType;
      if (headline) updateData.headline = headline;
      if (summary !== undefined) updateData.summary = summary;
      if (publishedAt) updateData.publishedAt = new Date(publishedAt);
      if (source !== undefined) updateData.source = source;
      if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (tags !== undefined) updateData.tags = tags;
      if (isActive !== undefined) updateData.isActive = isActive;

      const activity = await StockActivity.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!activity) {
        return res.status(404).json({
          success: false,
          error: 'News article not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: activity,
        message: 'News article updated successfully'
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate news article (same stock, headline, and date)'
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update news article'
      });
    }
  }

  if (req.method === 'DELETE') {
    // Delete news article
    try {
      const activity = await StockActivity.findByIdAndDelete(id);

      if (!activity) {
        return res.status(404).json({
          success: false,
          error: 'News article not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'News article deleted successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete news article'
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}

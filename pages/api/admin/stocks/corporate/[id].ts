import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth';
import StockActivity from '@/lib/models/StockActivity';

/**
 * PUT /api/admin/stocks/corporate/[id]
 * Update a corporate action by ID
 *
 * DELETE /api/admin/stocks/corporate/[id]
 * Delete a corporate action by ID
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE' && req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Verify authentication and admin role
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decodedToken = AuthUtils.verifyAccessToken(token);
    if (!decodedToken || !['ADMIN', 'DATA_ENTRY'].includes(decodedToken.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await connectDB();

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: 'ID is required' });
    }

    // Handle UPDATE
    if (req.method === 'PUT') {
      const { headline, summary, publishedAt, source, sourceUrl, imageUrl, metadata } = req.body;

      if (!headline) {
        return res.status(400).json({ success: false, error: 'Headline is required' });
      }

      const updatedAction = await StockActivity.findByIdAndUpdate(
        id,
        {
          headline,
          summary,
          publishedAt: publishedAt ? new Date(publishedAt) : undefined,
          source,
          sourceUrl,
          imageUrl,
          metadata,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!updatedAction) {
        return res.status(404).json({ success: false, error: 'Corporate action not found' });
      }

      return res.status(200).json({
        success: true,
        data: updatedAction,
        message: 'Corporate action updated successfully'
      });
    }

    // Handle DELETE
    const deletedAction = await StockActivity.findByIdAndDelete(id);

    if (!deletedAction) {
      return res.status(404).json({ success: false, error: 'Corporate action not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Corporate action deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in corporate action operation:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}

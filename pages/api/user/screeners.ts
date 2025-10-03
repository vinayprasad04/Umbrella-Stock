import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import SavedScreener from '@/models/SavedScreener';
import { AuthUtils } from '@/lib/auth';

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

      return res.status(200).json({
        success: true,
        data: screeners,
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

      const screener = await SavedScreener.create({
        userId,
        title,
        description,
        filters,
      });

      return res.status(201).json({
        success: true,
        data: screener,
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

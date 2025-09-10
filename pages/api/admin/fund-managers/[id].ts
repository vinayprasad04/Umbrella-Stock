import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import FundManager from '@/lib/models/FundManager';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

interface UpdateFundManagerRequest {
  name?: string;
  experience?: string;
  education?: string;
  fundsManaged?: string[];
  isActive?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  const { id } = req.query;

  // Verify authentication
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
      error: 'Access denied',
    });
  }

  await connectDB();

  if (req.method === 'GET') {
    // Get single fund manager
    try {
      const fundManager = await FundManager.findById(id).lean();
      
      if (!fundManager) {
        return res.status(404).json({
          success: false,
          error: 'Fund manager not found'
        });
      }

      res.status(200).json({
        success: true,
        data: fundManager,
        message: 'Fund manager retrieved successfully'
      });

    } catch (error: any) {
      console.error('❌ Error fetching fund manager:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch fund manager'
      });
    }
  }

  else if (req.method === 'PATCH') {
    // Update fund manager
    try {
      const updateData: UpdateFundManagerRequest = req.body;
      
      // Get user info for tracking
      const user = await User.findById(decoded.userId);
      const userName = user?.name || decoded.email;

      // Find and update fund manager
      const updatedFundManager = await FundManager.findByIdAndUpdate(
        id,
        {
          ...updateData,
          lastUpdatedBy: userName
        },
        { 
          new: true,
          runValidators: true
        }
      );

      if (!updatedFundManager) {
        return res.status(404).json({
          success: false,
          error: 'Fund manager not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedFundManager,
        message: 'Fund manager updated successfully'
      });

    } catch (error: any) {
      console.error('❌ Error updating fund manager:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Fund manager with this name already exists'
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: Object.values(error.errors).map((err: any) => err.message).join(', ')
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to update fund manager'
      });
    }
  }

  else if (req.method === 'DELETE') {
    // Delete (soft delete) fund manager
    try {
      // Get user info for tracking
      const user = await User.findById(decoded.userId);
      const userName = user?.name || decoded.email;

      const deletedFundManager = await FundManager.findByIdAndUpdate(
        id,
        {
          isActive: false,
          lastUpdatedBy: userName
        },
        { new: true }
      );

      if (!deletedFundManager) {
        return res.status(404).json({
          success: false,
          error: 'Fund manager not found'
        });
      }

      res.status(200).json({
        success: true,
        data: deletedFundManager,
        message: 'Fund manager deleted successfully'
      });

    } catch (error: any) {
      console.error('❌ Error deleting fund manager:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete fund manager'
      });
    }
  }

  else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }
}
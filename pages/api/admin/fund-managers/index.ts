import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import FundManager, { IFundManager } from '@/lib/models/FundManager';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

interface FundManagerRequest {
  name: string;
  experience: string;
  education: string;
  fundsManaged: string[];
}

interface FundManagersData {
  fundManagers: IFundManager[];
  total: number;
  page: number;
  limit: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
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
    // Get fund managers with pagination and filtering
    try {
      const {
        page = '1',
        limit = '20',
        search = '',
        isActive = 'true'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter
      const filter: any = {};
      
      if (isActive !== 'all') {
        filter.isActive = isActive === 'true';
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { experience: { $regex: search, $options: 'i' } },
          { education: { $regex: search, $options: 'i' } }
        ];
      }

      // Get total count
      const total = await FundManager.countDocuments(filter);

      // Get fund managers
      const fundManagers = await FundManager.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      res.status(200).json({
        success: true,
        data: {
          fundManagers,
          total,
          page: pageNum,
          limit: limitNum
        },
        message: 'Fund managers retrieved successfully'
      });

    } catch (error: any) {
      console.error('❌ Error fetching fund managers:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch fund managers'
      });
    }
  }

  else if (req.method === 'POST') {
    // Create new fund manager
    try {
      const fundManagerData: FundManagerRequest = req.body;
      
      // Get user info for tracking
      const user = await User.findById(decoded.userId);
      const userName = user?.name || decoded.email;

      // Validate required fields
      if (!fundManagerData.name?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Fund manager name is required'
        });
      }

      if (!fundManagerData.experience?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Experience is required'
        });
      }

      if (!fundManagerData.education?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Education is required'
        });
      }

      // Create fund manager
      const newFundManager = new FundManager({
        ...fundManagerData,
        createdBy: userName,
        lastUpdatedBy: userName,
        isActive: true
      });

      const result = await newFundManager.save();

      res.status(201).json({
        success: true,
        data: result,
        message: 'Fund manager created successfully'
      });

    } catch (error: any) {
      console.error('❌ Error creating fund manager:', error);
      
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
        error: 'Failed to create fund manager'
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
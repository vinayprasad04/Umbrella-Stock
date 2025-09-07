import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualMutualFundDetails from '@/lib/models/ActualMutualFundDetails';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import jwt from 'jsonwebtoken';

interface ActualFundManager {
  name: string;
  experience: number;
  background: string;
}

interface ActualHolding {
  name: string;
  percentage: number;
  sector: string;
}

interface ActualSectorAllocation {
  sector: string;
  percentage: number;
}

interface FundDetailsRequest {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  actualFundManagers: ActualFundManager[];
  actualTopHoldings: ActualHolding[];
  actualSectorAllocation: ActualSectorAllocation[];
  dataSource: string;
  dataQuality: 'VERIFIED' | 'PENDING_VERIFICATION' | 'EXCELLENT' | 'GOOD';
  notes?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  const { schemeCode } = req.query;

  if (req.method === 'GET') {
    // Get existing fund details
    try {
      // Verify JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      if (!decoded || !['ADMIN', 'DATA_ENTRY'].includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      await connectDB();
      
      const actualDetails = await ActualMutualFundDetails.findOne({
        schemeCode: parseInt(schemeCode as string),
        isActive: true
      }).lean();

      res.status(200).json({
        success: true,
        data: actualDetails,
        message: actualDetails ? 'Fund details found' : 'No fund details found'
      });

    } catch (error: any) {
      console.error('❌ Error fetching fund details:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch fund details'
      });
    }
  }

  else if (req.method === 'POST') {
    // Save or update fund details
    try {
      // Verify JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      if (!decoded || !['ADMIN', 'DATA_ENTRY'].includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      await connectDB();
      
      const fundData: FundDetailsRequest = req.body;

      // Get user info for tracking
      const user = await User.findById(decoded.userId);
      const userName = user?.name || decoded.email;

      // Validate required fields
      if (!fundData.dataSource.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Data source is required'
        });
      }

      if (fundData.actualFundManagers.length === 0 || !fundData.actualFundManagers[0].name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'At least one fund manager is required'
        });
      }

      // Check if fund details already exist
      const existingDetails = await ActualMutualFundDetails.findOne({
        schemeCode: parseInt(schemeCode as string),
        isActive: true
      });

      let result;
      
      if (existingDetails) {
        // Update existing
        result = await ActualMutualFundDetails.findByIdAndUpdate(
          existingDetails._id,
          {
            ...fundData,
            schemeCode: parseInt(schemeCode as string),
            lastUpdated: new Date(),
            enteredBy: userName,
            updatedBy: userName
          },
          { new: true, runValidators: true }
        );
      } else {
        // Create new
        result = await ActualMutualFundDetails.create({
          ...fundData,
          schemeCode: parseInt(schemeCode as string),
          enteredBy: userName,
          isActive: true,
          enteredAt: new Date()
        });
      }

      // Update user activity tracking
      if (user) {
        if (existingDetails) {
          user.totalMfDataVerified = (user.totalMfDataVerified || 0) + 1;
        } else {
          user.totalMfDataEntered = (user.totalMfDataEntered || 0) + 1;
        }
        user.lastActivity = new Date();
        await user.save();
      }

      res.status(200).json({
        success: true,
        data: result,
        message: existingDetails ? 'Fund details updated successfully' : 'Fund details saved successfully'
      });

    } catch (error: any) {
      console.error('❌ Error saving fund details:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: Object.values(error.errors).map((err: any) => err.message).join(', ')
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to save fund details'
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
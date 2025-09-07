import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import MutualFund from '@/lib/models/MutualFund';
import ActualMutualFundDetails from '@/lib/models/ActualMutualFundDetails';
import { APIResponse } from '@/types';
import jwt from 'jsonwebtoken';

interface MutualFundListItem {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  category: string;
  hasActualData: boolean;
  dataQuality?: string;
  lastUpdated?: string;
  enteredBy?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<{
    funds: MutualFundListItem[];
    total: number;
    page: number;
    limit: number;
    filters: {
      totalFunds: number;
      fundsWithActualData: number;
      fundsWithoutActualData: number;
    };
  }>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

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
    
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || '';
    const fundHouse = req.query.fundHouse as string || '';
    const hasActualData = req.query.hasActualData as string || '';
    const sortBy = req.query.sortBy as string || 'schemeName';
    const sortOrder = req.query.sortOrder as string || 'asc';
    
    // Build filter
    const filter: any = { isActive: true };
    
    if (search) {
      filter.$or = [
        { schemeName: { $regex: search, $options: 'i' } },
        { fundHouse: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (fundHouse) {
      filter.fundHouse = { $regex: fundHouse, $options: 'i' };
    }
    
    // Get all mutual funds with pagination
    const skip = (page - 1) * limit;
    
    const funds = await MutualFund.find(filter)
      .select('schemeCode schemeName fundHouse category')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get actual data status for these funds
    const schemeCodes = funds.map(f => f.schemeCode);
    const actualData = await ActualMutualFundDetails.find({
      schemeCode: { $in: schemeCodes },
      isActive: true
    }).select('schemeCode dataQuality lastUpdated enteredBy').lean();
    
    // Create lookup map
    const actualDataMap = new Map();
    actualData.forEach(data => {
      actualDataMap.set(data.schemeCode, data);
    });
    
    // Combine data
    const result: MutualFundListItem[] = funds.map(fund => {
      const actual = actualDataMap.get(fund.schemeCode);
      return {
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        fundHouse: fund.fundHouse,
        category: fund.category || 'Unknown',
        hasActualData: !!actual,
        dataQuality: actual?.dataQuality,
        lastUpdated: actual?.lastUpdated?.toISOString(),
        enteredBy: actual?.enteredBy
      };
    });
    
    // Apply hasActualData filter after combining data
    let filteredResult = result;
    if (hasActualData === 'true') {
      filteredResult = result.filter(f => f.hasActualData);
    } else if (hasActualData === 'false') {
      filteredResult = result.filter(f => !f.hasActualData);
    }
    
    // Get total counts for filters
    const totalFunds = await MutualFund.countDocuments({ isActive: true });
    const fundsWithActualData = await ActualMutualFundDetails.countDocuments({ isActive: true });
    const fundsWithoutActualData = totalFunds - fundsWithActualData;
    
    // Get total for current filter
    const total = await MutualFund.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        funds: filteredResult,
        total,
        page,
        limit,
        filters: {
          totalFunds,
          fundsWithActualData,
          fundsWithoutActualData
        }
      },
      message: 'Mutual funds retrieved successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching mutual funds for admin:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mutual funds'
    });
  }
}
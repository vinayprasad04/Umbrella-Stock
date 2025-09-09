import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualMutualFundDetails from '@/lib/models/ActualMutualFundDetails';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

interface FundDetailsRequest {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  assetAllocation: {
    equity: number;
    debt: number;
    cashAndCashEq: number;
  };
  portfolioAggregates: {
    giant: number;
    large: number;
    mid: number;
    small: number;
    tiny: number;
    avgMarketCap: number;
  };
  creditRating: {
    aaa: number;
    sov: number;
    cashEquivalent: number;
    aa: number;
  };
  sectorWiseHoldings: Array<{
    sector: string;
    fundPercentage: number;
    categoryPercentage: number;
  }>;
  topEquityHoldings: Array<{
    companyName: string;
    sector: string;
    peRatio: number;
    assetsPercentage: number;
  }>;
  topDebtHoldings: Array<{
    companyName: string;
    instrument: string;
    creditRating: string;
    assetsPercentage: number;
  }>;
  launchDate?: string;
  riskometer?: string;
  expense?: number;
  exitLoad?: string;
  openEnded?: boolean;
  lockInPeriod?: string;
  fundInfo: {
    nameOfAMC: string;
    address: string;
    phone: string;
    fax: string;
    email: string;
    website: string;
  };
  actualFundManagers: Array<{
    name: string;
    since?: string;
    experience?: string;
    education?: string;
    fundsManaged?: string[];
  }>;
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

      const decoded = AuthUtils.verifyAccessToken(token);
      
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

      console.log('📖 Loading fund data from database:', {
        found: !!actualDetails,
        hasAssetAllocation: !!(actualDetails?.assetAllocation),
        hasPortfolioAggregates: !!(actualDetails?.portfolioAggregates),
        hasCreditRating: !!(actualDetails?.creditRating),
        hasFundInfo: !!(actualDetails?.fundInfo),
        sectorWiseHoldingsCount: actualDetails?.sectorWiseHoldings?.length || 0,
        topEquityHoldingsCount: actualDetails?.topEquityHoldings?.length || 0,
        topDebtHoldingsCount: actualDetails?.topDebtHoldings?.length || 0
      });

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

      const decoded = AuthUtils.verifyAccessToken(token);
      
      if (!decoded || !['ADMIN', 'DATA_ENTRY'].includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      await connectDB();
      
      const fundData: FundDetailsRequest = req.body;
      
      console.log('🔍 Received fund data for save:', {
        schemeCode: fundData.schemeCode,
        hasAssetAllocation: !!fundData.assetAllocation,
        hasPortfolioAggregates: !!fundData.portfolioAggregates,
        hasCreditRating: !!fundData.creditRating,
        hasFundInfo: !!fundData.fundInfo,
        sectorWiseHoldingsCount: fundData.sectorWiseHoldings?.length || 0,
        topEquityHoldingsCount: fundData.topEquityHoldings?.length || 0,
        topDebtHoldingsCount: fundData.topDebtHoldings?.length || 0
      });

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

      // Transform data to match the new database schema
      const transformedData = {
        schemeCode: parseInt(schemeCode as string),
        schemeName: fundData.schemeName,
        fundHouse: fundData.fundHouse,
        assetAllocation: fundData.assetAllocation,
        portfolioAggregates: fundData.portfolioAggregates,
        creditRating: fundData.creditRating,
        sectorWiseHoldings: fundData.sectorWiseHoldings,
        topEquityHoldings: fundData.topEquityHoldings,
        topDebtHoldings: fundData.topDebtHoldings,
        launchDate: fundData.launchDate,
        riskometer: fundData.riskometer,
        expense: fundData.expense,
        exitLoad: fundData.exitLoad,
        openEnded: fundData.openEnded,
        lockInPeriod: fundData.lockInPeriod,
        fundInfo: fundData.fundInfo,
        actualFundManagers: fundData.actualFundManagers,
        dataSource: fundData.dataSource,
        dataQuality: fundData.dataQuality,
        notes: fundData.notes,
        lastUpdated: new Date(),
        enteredBy: userName,
        isActive: true
      };

      console.log('💾 Data being saved to database:', {
        schemeCode: transformedData.schemeCode,
        hasAllSections: {
          assetAllocation: !!transformedData.assetAllocation,
          portfolioAggregates: !!transformedData.portfolioAggregates,
          creditRating: !!transformedData.creditRating,
          sectorWiseHoldings: transformedData.sectorWiseHoldings?.length > 0,
          topEquityHoldings: transformedData.topEquityHoldings?.length > 0,
          topDebtHoldings: transformedData.topDebtHoldings?.length > 0,
          fundInfo: !!transformedData.fundInfo,
          actualFundManagers: transformedData.actualFundManagers?.length > 0
        }
      });

      let result;
      
      if (existingDetails) {
        // Delete existing and create new
        console.log('🗑️ Deleting existing document to avoid schema conflicts');
        await ActualMutualFundDetails.findByIdAndDelete(existingDetails._id);
        
        const newDoc = new ActualMutualFundDetails(transformedData);
        result = await newDoc.save();
        
        console.log('🔄 Recreated document successfully');
      } else {
        // Create new
        const newDoc = new ActualMutualFundDetails(transformedData);
        result = await newDoc.save();
        
        console.log('🆕 Created new document successfully');
      }

      // Verify saved data
      console.log('✅ Final result verification:', {
        documentId: result._id,
        schemeCode: result.schemeCode,
        hasAllData: {
          assetAllocation: !!result.assetAllocation,
          portfolioAggregates: !!result.portfolioAggregates,
          creditRating: !!result.creditRating,
          sectorWiseHoldings: result.sectorWiseHoldings?.length || 0,
          topEquityHoldings: result.topEquityHoldings?.length || 0,
          topDebtHoldings: result.topDebtHoldings?.length || 0,
          fundInfo: !!result.fundInfo,
          actualFundManagers: result.actualFundManagers?.length || 0
        }
      });

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
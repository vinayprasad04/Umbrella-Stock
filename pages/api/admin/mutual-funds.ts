import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import MutualFund from '@/lib/models/MutualFund';
import ActualMutualFundDetails from '@/lib/models/ActualMutualFundDetails';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

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

    const decoded = AuthUtils.verifyAccessToken(token);
    
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
    const dataQuality = req.query.dataQuality as string || '';
    const sortBy = req.query.sortBy as string || 'schemeName';
    const sortOrder = req.query.sortOrder as string || 'asc';
    
    console.log('📥 API Received parameters:', {
      page, limit, search, fundHouse, hasActualData, dataQuality, sortBy, sortOrder
    });
    
    // Build filter
    const filter: any = { isActive: true };
    
    if (search) {
      // For search queries, we'll use MongoDB aggregation with scoring
      console.log('🔍 Search query:', search);
      
      // Split search terms for flexible matching
      const searchTerms = search.trim().split(/\s+/);
      const termRegexes = searchTerms.map(term => new RegExp(term, 'i'));
      
      filter.$or = [
        // Exact match (highest priority)
        { schemeName: { $regex: `^${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        { fundHouse: { $regex: `^${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        
        // Contains exact phrase (high priority)
        { schemeName: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { fundHouse: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        
        // Contains all terms in any order (medium priority)
        { 
          $and: termRegexes.map(regex => ({ schemeName: { $regex: regex } }))
        },
        {
          $and: termRegexes.map(regex => ({ fundHouse: { $regex: regex } }))
        },
        
        // Contains any term (lowest priority)
        { schemeName: { $regex: search, $options: 'i' } },
        { fundHouse: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (fundHouse) {
      filter.fundHouse = { $regex: fundHouse, $options: 'i' };
    }
    
    // Handle dataQuality filtering differently - need to get matching ActualData first
    let funds;
    let actualData;
    
    if (dataQuality) {
      // When filtering by dataQuality, start with ActualMutualFundDetails
      console.log('🎯 Filtering by dataQuality, starting with ActualData...');
      
      actualData = await ActualMutualFundDetails.find({
        dataQuality: dataQuality,
        isActive: true
      }).select('schemeCode dataQuality lastUpdated enteredBy').lean();
      
      console.log('📋 Found ActualData with quality', dataQuality + ':', actualData.length, 'records');
      
      const qualifiedSchemeCodes = actualData.map(a => a.schemeCode);
      
      if (qualifiedSchemeCodes.length === 0) {
        // No funds with this data quality
        funds = [];
      } else {
        // Add schemeCode filter to main filter
        filter.schemeCode = { $in: qualifiedSchemeCodes };
        
        // For search queries with relevance, we need to get more results first, then sort and paginate
        const searchLimit = search ? Math.max(limit * 3, 150) : limit;
        const skip = search ? 0 : (page - 1) * limit;
        
        funds = await MutualFund.find(filter)
          .select('schemeCode schemeName fundHouse category')
          .sort(search ? { schemeName: 1 } : { [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .skip(skip)
          .limit(searchLimit)
          .lean();
      }
    } else {
      // Normal flow when not filtering by dataQuality
      // For search queries with relevance, we need to get more results first, then sort and paginate
      const searchLimit = search ? Math.max(limit * 3, 150) : limit;
      const skip = search ? 0 : (page - 1) * limit;
      
      funds = await MutualFund.find(filter)
        .select('schemeCode schemeName fundHouse category')
        .sort(search ? { schemeName: 1 } : { [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(searchLimit)
        .lean();
      
      // Get actual data status for these funds
      const schemeCodes = funds.map(f => f.schemeCode);
      actualData = await ActualMutualFundDetails.find({
        schemeCode: { $in: schemeCodes },
        isActive: true
      }).select('schemeCode dataQuality lastUpdated enteredBy').lean();
    }
    
    // Debug: Show what actual data we found
    console.log('🗃️ ActualData found:', actualData.length, 'records');
    if (dataQuality) {
      console.log('📋 ActualData with quality', dataQuality + ':', 
        actualData.filter(d => d.dataQuality === dataQuality).length, 'records');
    }
    console.log('📊 Data quality breakdown:', 
      actualData.reduce((acc: any, d) => {
        acc[d.dataQuality || 'undefined'] = (acc[d.dataQuality || 'undefined'] || 0) + 1;
        return acc;
      }, {}));
    
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
    
    // Apply relevance scoring for search queries
    let filteredResult = result;
    
    if (search) {
      console.log('🎯 Applying relevance scoring for search:', search);
      
      // Calculate relevance score for each fund
      filteredResult = filteredResult.map(fund => {
        let score = 0;
        const searchLower = search.toLowerCase();
        const schemeNameLower = fund.schemeName.toLowerCase();
        const fundHouseLower = fund.fundHouse.toLowerCase();
        
        // Exact match gets highest score
        if (schemeNameLower === searchLower) score += 1000;
        else if (fundHouseLower === searchLower) score += 900;
        
        // Contains exact phrase gets high score
        else if (schemeNameLower.includes(searchLower)) score += 500;
        else if (fundHouseLower.includes(searchLower)) score += 400;
        
        // Count matching words
        const searchTerms = search.trim().toLowerCase().split(/\s+/);
        const schemeWords = schemeNameLower.split(/\s+/);
        const fundHouseWords = fundHouseLower.split(/\s+/);
        
        // Score for each matching term
        searchTerms.forEach(term => {
          if (schemeWords.some(word => word.includes(term))) score += 50;
          if (fundHouseWords.some(word => word.includes(term))) score += 30;
        });
        
        return { ...fund, _searchScore: score };
      });
      
      // Sort by relevance score (highest first)
      filteredResult.sort((a: any, b: any) => b._searchScore - a._searchScore);
      
      // Apply pagination after sorting
      const skip = (page - 1) * limit;
      filteredResult = filteredResult.slice(skip, skip + limit);
      
      console.log('📊 Top 3 search results with scores:', 
        filteredResult.slice(0, 3).map((f: any) => ({ 
          schemeName: f.schemeName, 
          score: f._searchScore 
        }))
      );
    }
    
    // Apply hasActualData filter
    if (hasActualData === 'true') {
      filteredResult = filteredResult.filter(f => f.hasActualData);
    } else if (hasActualData === 'false') {
      filteredResult = filteredResult.filter(f => !f.hasActualData);
    }
    
    // dataQuality filtering is now handled earlier in the query logic
    console.log('📊 Final result after all filters:', filteredResult.length, 'funds');
    
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
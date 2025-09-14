import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import EquityStock from '@/lib/models/EquityStock';
import ActualStockDetail from '@/lib/models/ActualStockDetail';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

interface EquityStockListItem {
  symbol: string;
  companyName: string;
  sector: string;
  industry?: string;
  marketCap?: number;
  hasActualData: boolean;
  dataQuality?: string;
  lastUpdated?: string;
  enteredBy?: string;
  currentPrice?: number;
  exchange?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<{
    stocks: EquityStockListItem[];
    total: number;
    page: number;
    limit: number;
    filters: {
      totalStocks: number;
      stocksWithActualData: number;
      stocksWithoutActualData: number;
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
    const sector = req.query.sector as string || '';
    const exchange = req.query.exchange as string || '';
    const hasActualData = req.query.hasActualData as string || '';
    const dataQuality = req.query.dataQuality as string || '';
    const sortBy = req.query.sortBy as string || 'symbol';
    const sortOrder = req.query.sortOrder as string || 'asc';

    console.log('📥 API Received parameters:', {
      page, limit, search, sector, exchange, hasActualData, dataQuality, sortBy, sortOrder
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
        { symbol: { $regex: `^${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        { companyName: { $regex: `^${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },

        // Contains exact phrase (high priority)
        { symbol: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { companyName: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },

        // Contains all terms in any order (medium priority)
        {
          $and: termRegexes.map(regex => ({ companyName: { $regex: regex } }))
        },
        {
          $and: termRegexes.map(regex => ({ symbol: { $regex: regex } }))
        },

        // Contains any term (lowest priority)
        { companyName: { $regex: search, $options: 'i' } },
        { symbol: { $regex: search, $options: 'i' } }
      ];
    }

    // Handle dataQuality filtering differently - need to get matching ActualData first
    let stocks: any[];
    let actualData: any[];

    if (dataQuality) {
      // When filtering by dataQuality, start with ActualEquityStockDetails
      console.log('🎯 Filtering by dataQuality, starting with ActualData...');

      actualData = await ActualStockDetail.find({
        dataQuality: dataQuality,
        isActive: true
      }).select('symbol additionalInfo meta dataQuality lastUpdated enteredBy').lean();

      console.log('📋 Found ActualData with quality', dataQuality + ':', actualData.length, 'records');

      const qualifiedSymbols = actualData.map(a => a.symbol);

      if (qualifiedSymbols.length === 0) {
        // No stocks with this data quality
        stocks = [];
      } else {
        // Add symbol filter to main filter
        filter.symbol = { $in: qualifiedSymbols };

        // For search queries with relevance, we need to get more results first, then sort and paginate
        const searchLimit = search ? Math.max(limit * 3, 150) : limit;
        const skip = search ? 0 : (page - 1) * limit;

        stocks = await EquityStock.find(filter)
          .select('symbol companyName series dateOfListing isinNumber hasActualData lastUpdated')
          .sort(search ? { symbol: 1 } : { [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .skip(skip)
          .limit(searchLimit)
          .lean();
      }
    } else {
      // Normal flow when not filtering by dataQuality
      // For search queries with relevance, we need to get more results first, then sort and paginate
      const searchLimit = search ? Math.max(limit * 3, 150) : limit;
      const skip = search ? 0 : (page - 1) * limit;

      stocks = await EquityStock.find(filter)
        .select('symbol companyName series dateOfListing isinNumber hasActualData lastUpdated')
        .sort(search ? { symbol: 1 } : { [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(searchLimit)
        .lean();

      // Get actual data status for these stocks
      const symbols = stocks.map(s => s.symbol);
      actualData = await ActualStockDetail.find({
        symbol: { $in: symbols },
        isActive: true
      }).select('symbol additionalInfo meta dataQuality lastUpdated enteredBy').lean();
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
      actualDataMap.set(data.symbol, data);
    });

    // Combine data
    const result: EquityStockListItem[] = stocks.map(stock => {
      const actual = actualDataMap.get(stock.symbol);
      return {
        symbol: stock.symbol,
        companyName: stock.companyName,
        sector: actual?.additionalInfo?.sector || 'Unknown',
        industry: actual?.additionalInfo?.industry,
        marketCap: actual?.meta?.marketCapitalization,
        hasActualData: !!actual,
        dataQuality: actual?.dataQuality,
        lastUpdated: actual?.lastUpdated?.toISOString(),
        enteredBy: actual?.enteredBy,
        currentPrice: actual?.meta?.currentPrice,
        exchange: actual?.additionalInfo?.exchange
      };
    });

    // Apply relevance scoring for search queries
    let filteredResult = result;

    if (search) {
      console.log('🎯 Applying relevance scoring for search:', search);

      // Calculate relevance score for each stock
      filteredResult = filteredResult.map(stock => {
        let score = 0;
        const searchLower = search.toLowerCase();
        const symbolLower = stock.symbol.toLowerCase();
        const companyNameLower = stock.companyName.toLowerCase();

        // Exact match gets highest score
        if (symbolLower === searchLower) score += 1000;
        else if (companyNameLower === searchLower) score += 900;

        // Contains exact phrase gets high score
        else if (symbolLower.includes(searchLower)) score += 500;
        else if (companyNameLower.includes(searchLower)) score += 400;

        // Count matching words
        const searchTerms = search.trim().toLowerCase().split(/\s+/);
        const symbolWords = symbolLower.split(/\s+/);
        const companyWords = companyNameLower.split(/\s+/);

        // Score for each matching term
        searchTerms.forEach(term => {
          if (symbolWords.some(word => word.includes(term))) score += 50;
          if (companyWords.some(word => word.includes(term))) score += 30;
        });

        return { ...stock, _searchScore: score };
      });

      // Sort by relevance score (highest first)
      filteredResult.sort((a: any, b: any) => b._searchScore - a._searchScore);

      // Apply pagination after sorting
      const skip = (page - 1) * limit;
      filteredResult = filteredResult.slice(skip, skip + limit);

      console.log('📊 Top 3 search results with scores:',
        filteredResult.slice(0, 3).map((s: any) => ({
          symbol: s.symbol,
          companyName: s.companyName,
          score: s._searchScore
        }))
      );
    }

    // Apply sector filter
    if (sector) {
      filteredResult = filteredResult.filter(s =>
        s.sector && s.sector.toLowerCase().includes(sector.toLowerCase())
      );
    }

    // Apply exchange filter
    if (exchange) {
      filteredResult = filteredResult.filter(s =>
        s.exchange && s.exchange.toLowerCase().includes(exchange.toLowerCase())
      );
    }

    // Apply hasActualData filter
    if (hasActualData === 'true') {
      filteredResult = filteredResult.filter(s => s.hasActualData);
    } else if (hasActualData === 'false') {
      filteredResult = filteredResult.filter(s => !s.hasActualData);
    }

    // dataQuality filtering is now handled earlier in the query logic
    console.log('📊 Final result after all filters:', filteredResult.length, 'stocks');

    // Get total counts for filters
    const totalStocks = await EquityStock.countDocuments({ isActive: true });
    const stocksWithActualData = await ActualStockDetail.countDocuments({ isActive: true });
    const stocksWithoutActualData = totalStocks - stocksWithActualData;

    // Get total for current filter
    const total = await EquityStock.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        stocks: filteredResult,
        total,
        page,
        limit,
        filters: {
          totalStocks,
          stocksWithActualData,
          stocksWithoutActualData
        }
      },
      message: 'Equity stocks retrieved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error fetching equity stocks for admin:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch equity stocks'
    });
  }
}
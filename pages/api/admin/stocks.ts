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
  hasRatios?: boolean;
  niftyIndex?: string;
  niftyIndices?: string[];
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
    const hasRatios = req.query.hasRatios as string || '';
    const niftyIndex = req.query.niftyIndex as string || '';
    const niftyIndices = req.query.niftyIndices as string || '';
    const newsFilter = req.query.newsFilter as string || '';
    const sortBy = req.query.sortBy as string || 'symbol';
    const sortOrder = req.query.sortOrder as string || 'asc';

    // Determine if we need to sort by ActualStockDetail fields
    const actualDataSortFields = ['marketCap', 'currentPrice', 'dataQuality', 'lastUpdated'];
    const needsActualDataSort = actualDataSortFields.includes(sortBy);

    console.log('📥 API Received parameters:', {
      page, limit, search, sector, exchange, hasActualData, dataQuality, hasRatios, niftyIndex, niftyIndices, sortBy, sortOrder
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

    // Handle dataQuality, hasActualData and hasRatios filtering
    let stocks: any[];
    let actualData: any[];

    // Build ActualStockDetail filter for ratios and nifty index
    const actualDataFilter: any = { isActive: true };
    if (dataQuality) {
      actualDataFilter.dataQuality = dataQuality;
    }
    if (hasRatios === 'true') {
      actualDataFilter.ratios = { $exists: true, $ne: null };
    } else if (hasRatios === 'false') {
      actualDataFilter.$or = [
        { ratios: { $exists: false } },
        { ratios: null },
        { ratios: {} }
      ];
    }
    if (niftyIndex) {
      // Handle cumulative Nifty filtering (legacy single select)
      if (niftyIndex === 'NIFTY_50') {
        actualDataFilter['additionalInfo.niftyIndex'] = 'NIFTY_50';
      } else if (niftyIndex === 'NIFTY_100') {
        actualDataFilter['additionalInfo.niftyIndex'] = { $in: ['NIFTY_50', 'NIFTY_100'] };
      } else if (niftyIndex === 'NIFTY_200') {
        actualDataFilter['additionalInfo.niftyIndex'] = { $in: ['NIFTY_50', 'NIFTY_100', 'NIFTY_200'] };
      } else if (niftyIndex === 'NIFTY_500') {
        actualDataFilter['additionalInfo.niftyIndex'] = { $in: ['NIFTY_50', 'NIFTY_100', 'NIFTY_200', 'NIFTY_500'] };
      } else {
        actualDataFilter['additionalInfo.niftyIndex'] = niftyIndex;
      }
    }
    if (niftyIndices) {
      // Handle multi-select Nifty filtering using the new niftyIndices array field
      const selectedIndices = niftyIndices.split(',').filter(index => index.trim());
      if (selectedIndices.length > 0) {
        actualDataFilter['additionalInfo.niftyIndices'] = { $in: selectedIndices };
      }
    }

    // Get stocks with news if news filter is applied
    let stocksWithNewsSet: Set<string> | null = null;
    if (newsFilter === 'has-news' || newsFilter === 'no-news') {
      console.log('🎯 Fetching stocks with news for news filter...');
      const StockActivity = (await import('@/lib/models/StockActivity')).default;
      const stocksWithNewsData = await StockActivity.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$stockSymbol' } }
      ]);
      stocksWithNewsSet = new Set(stocksWithNewsData.map((item: any) => item._id));
      console.log('📋 Found stocks with news:', stocksWithNewsSet.size, 'stocks');
    }

    // Helper function to apply news filter
    const applyNewsFilter = (symbolsArray: string[]): string[] => {
      if (!stocksWithNewsSet) return symbolsArray;

      if (newsFilter === 'has-news') {
        return symbolsArray.filter(symbol => stocksWithNewsSet!.has(symbol));
      } else if (newsFilter === 'no-news') {
        return symbolsArray.filter(symbol => !stocksWithNewsSet!.has(symbol));
      }
      return symbolsArray;
    };

    if (dataQuality) {
      // When filtering by dataQuality, start with ActualEquityStockDetails
      console.log('🎯 Filtering by dataQuality, starting with ActualData...');

      actualData = await ActualStockDetail.find(actualDataFilter)
        .select('symbol additionalInfo meta dataQuality lastUpdated enteredBy ratios').lean();

      console.log('📋 Found ActualData with quality', dataQuality + ':', actualData.length, 'records');

      let qualifiedSymbols = actualData.map(a => a.symbol);

      // Apply news filter if present
      qualifiedSymbols = applyNewsFilter(qualifiedSymbols);
      console.log('📋 After news filter:', qualifiedSymbols.length, 'records');

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
          .sort(search || needsActualDataSort ? { symbol: 1 } : { [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .skip(needsActualDataSort ? 0 : skip)
          .limit(needsActualDataSort ? 0 : searchLimit)
          .lean();
      }
    } else if (hasActualData === 'false') {
      // Special case for "No Data" - filter at database level
      console.log('🎯 Filtering for stocks with NO actual data...');

      // Get all symbols that DO have actual data
      const stocksWithData = await ActualStockDetail.find({
        isActive: true
      }).select('symbol').lean();

      let symbolsWithData = stocksWithData.map(s => s.symbol);
      console.log('📋 Found', symbolsWithData.length, 'stocks WITH actual data');

      // Apply news filter to symbolsWithData if present
      if (stocksWithNewsSet) {
        if (newsFilter === 'has-news') {
          // For "no actual data + has news": exclude stocks with data, but include only those with news
          const newsSymbols = Array.from(stocksWithNewsSet);
          filter.symbol = { $in: newsSymbols, $nin: symbolsWithData };
        } else if (newsFilter === 'no-news') {
          // For "no actual data + no news": exclude both stocks with data and stocks with news
          const newsSymbols = Array.from(stocksWithNewsSet);
          filter.symbol = { $nin: [...symbolsWithData, ...newsSymbols] };
        }
      } else {
        // Filter to exclude stocks that have actual data
        filter.symbol = { $nin: symbolsWithData };
      }

      // Apply pagination at database level (only if not sorting by actual data fields)
      const skip = needsActualDataSort ? 0 : (page - 1) * limit;
      const dbLimit = needsActualDataSort ? 0 : limit;
      stocks = await EquityStock.find(filter)
        .select('symbol companyName series dateOfListing isinNumber hasActualData lastUpdated')
        .sort(needsActualDataSort ? { symbol: 1 } : { [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(dbLimit)
        .lean();

      console.log('📊 Found', stocks.length, 'stocks WITHOUT actual data for page', page);

      // No actual data needed since these stocks don't have any
      actualData = [];
    } else if (hasRatios === 'true' || hasRatios === 'false' || niftyIndex || niftyIndices) {
      // When filtering by ratios or nifty index, start with ActualStockDetail
      console.log('🎯 Filtering by ratios/nifty index, starting with ActualData...');

      actualData = await ActualStockDetail.find(actualDataFilter)
        .select('symbol additionalInfo meta dataQuality lastUpdated enteredBy ratios').lean();

      console.log('📋 Found ActualData with ratios/nifty filter:', actualData.length, 'records');

      let qualifiedSymbols = actualData.map(a => a.symbol);

      // Apply news filter if present
      qualifiedSymbols = applyNewsFilter(qualifiedSymbols);
      console.log('📋 After news filter:', qualifiedSymbols.length, 'records');

      if (qualifiedSymbols.length === 0) {
        // No stocks with this filter
        stocks = [];
      } else {
        // Add symbol filter to main filter
        filter.symbol = { $in: qualifiedSymbols };

        // For search queries with relevance, we need to get more results first, then sort and paginate
        const searchLimit = search ? Math.max(limit * 3, 150) : limit;
        const skip = search ? 0 : (page - 1) * limit;

        stocks = await EquityStock.find(filter)
          .select('symbol companyName series dateOfListing isinNumber hasActualData lastUpdated')
          .sort(search || needsActualDataSort ? { symbol: 1 } : { [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .skip(needsActualDataSort ? 0 : skip)
          .limit(needsActualDataSort ? 0 : searchLimit)
          .lean();
      }
    } else {
      // Normal flow when not filtering by dataQuality or hasActualData=false
      // Apply news filter to the base filter if present
      if (stocksWithNewsSet) {
        const newsSymbols = Array.from(stocksWithNewsSet);
        if (newsFilter === 'has-news') {
          filter.symbol = filter.symbol
            ? { ...filter.symbol, $in: newsSymbols }
            : { $in: newsSymbols };
        } else if (newsFilter === 'no-news') {
          filter.symbol = filter.symbol
            ? { ...filter.symbol, $nin: newsSymbols }
            : { $nin: newsSymbols };
        }
      }

      // For search queries with relevance, we need to get more results first, then sort and paginate
      const searchLimit = search ? Math.max(limit * 3, 150) : limit;
      const skip = search || needsActualDataSort ? 0 : (page - 1) * limit;
      const dbLimit = needsActualDataSort ? 0 : searchLimit;

      stocks = await EquityStock.find(filter)
        .select('symbol companyName series dateOfListing isinNumber hasActualData lastUpdated')
        .sort(search || needsActualDataSort ? { symbol: 1 } : { [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(dbLimit)
        .lean();

      // Get actual data status for these stocks
      const symbols = stocks.map(s => s.symbol);
      actualData = await ActualStockDetail.find({
        symbol: { $in: symbols },
        isActive: true
      }).select('symbol additionalInfo meta dataQuality lastUpdated enteredBy ratios').lean();
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
      const hasRatiosData = actual?.ratios &&
        typeof actual.ratios === 'object' &&
        Object.keys(actual.ratios).length > 0;
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
        exchange: actual?.additionalInfo?.exchange,
        hasRatios: hasRatiosData,
        niftyIndex: actual?.additionalInfo?.niftyIndex,
        niftyIndices: actual?.additionalInfo?.niftyIndices || []
      };
    });

    // Apply sorting if needed for ActualStockDetail fields
    let filteredResult = result;

    if (needsActualDataSort && !search) {
      console.log('🔄 Applying sorting by', sortBy, 'in', sortOrder, 'order');

      filteredResult.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
          case 'marketCap':
            aValue = a.marketCap || 0;
            bValue = b.marketCap || 0;
            break;
          case 'currentPrice':
            aValue = a.currentPrice || 0;
            bValue = b.currentPrice || 0;
            break;
          case 'dataQuality':
            aValue = a.dataQuality || 'ZZZ'; // Put undefined values at end
            bValue = b.dataQuality || 'ZZZ';
            break;
          case 'lastUpdated':
            aValue = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
            bValue = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
            break;
          default:
            aValue = 0;
            bValue = 0;
        }

        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      // Apply pagination after sorting
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      filteredResult = filteredResult.slice(startIndex, endIndex);

      console.log('📊 Applied sorting and pagination:', filteredResult.length, 'results for page', page);
    }

    // Apply relevance scoring for search queries
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

    // Apply hasActualData filter (only for hasActualData=true, false is handled at DB level)
    if (hasActualData === 'true') {
      filteredResult = filteredResult.filter(s => s.hasActualData);
    }
    // Note: hasActualData=false is now handled at database level for proper pagination

    // dataQuality filtering is now handled earlier in the query logic
    console.log('📊 Final result after all filters:', filteredResult.length, 'stocks');

    // Get total counts for filters
    const totalStocks = await EquityStock.countDocuments({ isActive: true });
    const stocksWithActualData = await ActualStockDetail.countDocuments({ isActive: true });
    const stocksWithoutActualData = totalStocks - stocksWithActualData;

    // Get total for current filter
    let total: number;
    if (hasActualData === 'false') {
      // For "No Data" filter, count stocks without actual data
      const stocksWithDataCount = await ActualStockDetail.countDocuments({ isActive: true });
      const totalStocksCount = await EquityStock.countDocuments({ isActive: true });
      total = totalStocksCount - stocksWithDataCount;
      console.log('📊 Total calculation for No Data:', { totalStocksCount, stocksWithDataCount, total });
    } else if (newsFilter === 'has-news' || newsFilter === 'no-news') {
      // For news filter, count stocks that match the criteria
      total = await EquityStock.countDocuments(filter);
      console.log('📊 Total calculation for news filter:', { newsFilter, total });
    } else if (hasRatios === 'true' || hasRatios === 'false' || niftyIndex || niftyIndices) {
      // For ratios or nifty filter, count stocks that match the criteria
      total = await ActualStockDetail.countDocuments(actualDataFilter);
      console.log('📊 Total calculation for filter:', { hasRatios, niftyIndex, niftyIndices, total });
    } else {
      total = await EquityStock.countDocuments(filter);
    }

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
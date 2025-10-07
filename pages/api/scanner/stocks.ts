import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualStockDetail from '@/lib/models/ActualStockDetail';

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
  sector?: string | string[];
  niftyIndices?: string | string[];
  minMarketCap?: string;
  maxMarketCap?: string;
  minPrice?: string;
  maxPrice?: string;
  minPE?: string;
  maxPE?: string;
  minROCE?: string;
  maxROCE?: string;
  minROE?: string;
  maxROE?: string;
  minDebtToEquity?: string;
  maxDebtToEquity?: string;
  minPB?: string;
  maxPB?: string;
  minDividendYield?: string;
  maxDividendYield?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface StockScannerResponse {
  success: boolean;
  data: {
    stocks: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  message?: string;
}

// Helper function to sort stocks in-memory
function applySorting(stocks: any[], sortBy: string, sortOrder: 'asc' | 'desc'): any[] {
  return stocks.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Compare values
    if (typeof aValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    } else {
      const comparison = aValue - bValue;
      return sortOrder === 'asc' ? comparison : -comparison;
    }
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StockScannerResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: { stocks: [], pagination: { currentPage: 1, totalPages: 0, totalRecords: 0, limit: 20, hasNext: false, hasPrevious: false } },
      message: 'Method not allowed'
    });
  }

  try {
    // Connect to database
    await connectDB();

    // Extract and validate query parameters
    const {
      page = '1',
      limit = '20',
      search,
      sector,
      niftyIndices,
      minMarketCap,
      maxMarketCap,
      minPrice,
      maxPrice,
      minPE,
      maxPE,
      minROCE,
      maxROCE,
      minROE,
      maxROE,
      minDebtToEquity,
      maxDebtToEquity,
      minPB,
      maxPB,
      minDividendYield,
      maxDividendYield,
      sortBy = 'meta.marketCapitalization',
      sortOrder = 'desc'
    }: QueryParams = req.query;

    // Note: All ratio filters will be applied in application code due to string vs number issue in DB
    // Store the filter values for later use
    const marketCapFilter = (minMarketCap || maxMarketCap) ? { min: minMarketCap ? parseFloat(minMarketCap) : 0, max: maxMarketCap ? parseFloat(maxMarketCap) : Infinity } : null;
    const peFilter = (minPE || maxPE) ? { min: minPE ? parseFloat(minPE) : 0, max: maxPE ? parseFloat(maxPE) : Infinity } : null;
    const roceFilter = (minROCE || maxROCE) ? { min: minROCE ? parseFloat(minROCE) : 0, max: maxROCE ? parseFloat(maxROCE) : Infinity } : null;
    const roeFilter = (minROE || maxROE) ? { min: minROE ? parseFloat(minROE) : 0, max: maxROE ? parseFloat(maxROE) : Infinity } : null;
    const debtFilter = (minDebtToEquity || maxDebtToEquity) ? { min: minDebtToEquity ? parseFloat(minDebtToEquity) : 0, max: maxDebtToEquity ? parseFloat(maxDebtToEquity) : Infinity } : null;
    const pbFilter = (minPB || maxPB) ? { min: minPB ? parseFloat(minPB) : 0, max: maxPB ? parseFloat(maxPB) : Infinity } : null;
    const divYieldFilter = (minDividendYield || maxDividendYield) ? { min: minDividendYield ? parseFloat(minDividendYield) : 0, max: maxDividendYield ? parseFloat(maxDividendYield) : Infinity } : null;

    const hasRatioFilter = marketCapFilter || peFilter || roceFilter || roeFilter || debtFilter || pbFilter || divYieldFilter;

    // Parse pagination parameters
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(50, Math.max(10, parseInt(limit))); // Min 10, Max 50
    const skip = (pageNumber - 1) * limitNumber;

    // If any ratio filter is active, we need to fetch ALL records since we'll filter in-memory
    // This is because ratio values are stored as strings and can't be filtered in MongoDB
    const fetchLimit = hasRatioFilter ? 10000 : limitNumber; // Fetch up to 10k stocks when filtering
    const fetchSkip = hasRatioFilter ? 0 : skip;

    // Build filter query
    const filterQuery: any = {
      isActive: true
    };

    // Text search across symbol, companyName
    if (search) {
      filterQuery.$or = [
        { symbol: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    // Sector filter - handle both single and multiple sectors
    if (sector) {
      if (Array.isArray(sector)) {
        // Multiple sectors - use $in operator
        filterQuery['additionalInfo.sector'] = { $in: sector };
      } else {
        // Single sector - use regex for partial matching
        filterQuery['additionalInfo.sector'] = { $regex: sector, $options: 'i' };
      }
    }

    // Nifty Indices filter - handle both single and multiple indices
    if (niftyIndices) {
      if (Array.isArray(niftyIndices)) {
        // Multiple indices - stocks must be in at least one of the selected indices
        filterQuery['additionalInfo.niftyIndices'] = { $in: niftyIndices };
      } else {
        // Single index
        filterQuery['additionalInfo.niftyIndices'] = niftyIndices;
      }
    }

    // Market Cap filter is now handled in application code (after fetching)
    // because Market Cap is stored in ratios as a formatted string

    // Price range filter
    if (minPrice || maxPrice) {
      filterQuery['meta.currentPrice'] = {};
      if (minPrice) {
        filterQuery['meta.currentPrice'].$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        filterQuery['meta.currentPrice'].$lte = parseFloat(maxPrice);
      }
    }

    // Build sort query for MongoDB
    // Note: marketCap sorting will be done in-memory since it's calculated from ratios
    const sortQuery: any = {};
    const validSortFields = [
      'symbol',
      'companyName',
      'meta.currentPrice',
      'additionalInfo.sector',
      'additionalInfo.industry',
      'lastUpdated'
    ];

    // Don't sort in MongoDB if sorting by marketCap or any ratio field
    const needsInMemorySort = sortBy === 'marketCap' ||
                               sortBy === 'peRatio' ||
                               sortBy === 'returnOnEquity' ||
                               sortBy === 'returnOnCapitalEmployed' ||
                               sortBy === 'pbRatio' ||
                               sortBy === 'debtToEquity' ||
                               sortBy === 'dividendYield';

    if (!needsInMemorySort && validSortFields.includes(sortBy)) {
      sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else if (!needsInMemorySort) {
      // Default: don't sort in MongoDB, will sort in-memory by marketCap
      sortQuery['symbol'] = 1; // Just use symbol for consistent ordering
    }

    // Get total count for pagination
    const totalRecords = await ActualStockDetail.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalRecords / limitNumber);

    // Fetch stocks with projection to limit data transfer
    const stocks = await ActualStockDetail.find(filterQuery)
      .select({
        symbol: 1,
        companyName: 1,
        'meta.faceValue': 1,
        'meta.currentPrice': 1,
        'meta.marketCapitalization': 1,
        'meta.numberOfShares': 1,
        'additionalInfo.sector': 1,
        'additionalInfo.industry': 1,
        'additionalInfo.description': 1,
        dataQuality: 1,
        lastUpdated: 1,
        ratios: 1, // Include ratios data
        // Include some recent financial data for ratios calculation
        'profitAndLoss.sales': { $slice: -2 }, // Last 2 years
        'profitAndLoss.netProfit': { $slice: -2 },
        'balanceSheet.equityShareCapital': { $slice: -2 }
      })
      .sort(sortQuery)
      .skip(fetchSkip)
      .limit(fetchLimit)
      .lean();

    // Transform data to include calculated metrics
    let transformedStocks = stocks.map((stock: any) => {
      // Extract ratios from the ratios object if available
      const ratios = stock.ratios || {};

      // Get Market Cap from ratios (in Cr format like "₹83679 Cr.")
      let marketCapValue = 0;
      if (ratios['Market Cap']) {
        const marketCapStr = String(ratios['Market Cap']);
        // Clean the string: remove ₹, Cr., Cr, commas, spaces
        const cleaned = marketCapStr
          .replace(/₹/g, '')
          .replace(/\s*Cr\.?/g, '')
          .replace(/,/g, '')
          .trim();
        marketCapValue = parseFloat(cleaned) || 0;
      }

      // Use Stock P/E from ratios object (actual stock data), not calculated
      const peRatio = ratios['Stock P/E'] ? parseFloat(ratios['Stock P/E']) : null;

      // Replace "Unknown" with "Other" for sector
      let sectorName = stock.additionalInfo?.sector || 'Other';
      if (sectorName === 'Unknown') {
        sectorName = 'Other';
      }

      return {
        id: stock._id,
        symbol: stock.symbol,
        name: stock.companyName,
        sector: sectorName,
        industry: stock.additionalInfo?.industry || 'Other',
        currentPrice: stock.meta?.currentPrice || 0,
        marketCap: marketCapValue, // Now using ratios["Market Cap"] instead of meta.marketCapitalization
        faceValue: stock.meta?.faceValue || 0,
        peRatio: peRatio,
        dataQuality: stock.dataQuality,
        lastUpdated: stock.lastUpdated,
        // Include ratios from database
        oneMonthReturn: ratios['1M Return'] ? parseFloat(ratios['1M Return']) : null,
        tenDayReturn: ratios['1D Return'] ? parseFloat(ratios['1D Return']) : null,
        returnOnEquity: ratios['ROE'] ? parseFloat(ratios['ROE']) : null,
        returnOnCapitalEmployed: ratios['ROCE'] ? parseFloat(ratios['ROCE']) : null,
        pbRatio: ratios['Price to book value'] ? parseFloat(ratios['Price to book value']) :
                 (ratios['P/B'] ? parseFloat(ratios['P/B']) :
                 (ratios['Price to Book'] ? parseFloat(ratios['Price to Book']) :
                 (ratios['P/B Ratio'] ? parseFloat(ratios['P/B Ratio']) : null))),
        debtToEquity: ratios['Debt to equity'] ? parseFloat(ratios['Debt to equity']) : null,
        dividendYield: ratios['Dividend Yield'] ? parseFloat(ratios['Dividend Yield']) : (ratios['Dividend yield'] ? parseFloat(ratios['Dividend yield']) : null),
        // Include all available ratios
        allRatios: ratios
      };
    });

    // Apply ratio filters in application code (due to string vs number issue in DB)
    if (hasRatioFilter) {
      transformedStocks = transformedStocks.filter((stock: any) => {
        // Market Cap filter
        if (marketCapFilter) {
          if (stock.marketCap == null || stock.marketCap === 0) return false;
          if (stock.marketCap < marketCapFilter.min || stock.marketCap > marketCapFilter.max) return false;
        }

        // P/E filter
        if (peFilter) {
          if (stock.peRatio == null) return false;
          if (stock.peRatio < peFilter.min || stock.peRatio > peFilter.max) return false;
        }

        // ROCE filter
        if (roceFilter) {
          if (stock.returnOnCapitalEmployed == null) return false;
          if (stock.returnOnCapitalEmployed < roceFilter.min || stock.returnOnCapitalEmployed > roceFilter.max) return false;
        }

        // ROE filter
        if (roeFilter) {
          if (stock.returnOnEquity == null) return false;
          if (stock.returnOnEquity < roeFilter.min || stock.returnOnEquity > roeFilter.max) return false;
        }

        // Debt-to-Equity filter
        if (debtFilter) {
          if (stock.debtToEquity == null) return false;
          if (stock.debtToEquity < debtFilter.min || stock.debtToEquity > debtFilter.max) return false;
        }

        // P/B filter
        if (pbFilter) {
          if (stock.pbRatio == null) return false;
          if (stock.pbRatio < pbFilter.min || stock.pbRatio > pbFilter.max) return false;
        }

        // Dividend Yield filter
        if (divYieldFilter) {
          if (stock.dividendYield == null) return false;
          if (stock.dividendYield < divYieldFilter.min || stock.dividendYield > divYieldFilter.max) return false;
        }

        return true;
      });

      // Apply in-memory sorting if needed
      if (needsInMemorySort) {
        transformedStocks = applySorting(transformedStocks, sortBy, sortOrder);
      }

      // Apply pagination after filtering
      const filteredTotalRecords = transformedStocks.length;
      const filteredTotalPages = Math.ceil(filteredTotalRecords / limitNumber);
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
      transformedStocks = transformedStocks.slice(startIndex, endIndex);

      const pagination = {
        currentPage: pageNumber,
        totalPages: filteredTotalPages,
        totalRecords: filteredTotalRecords,
        limit: limitNumber,
        hasNext: pageNumber < filteredTotalPages,
        hasPrevious: pageNumber > 1
      };

      return res.status(200).json({
        success: true,
        data: {
          stocks: transformedStocks,
          pagination
        }
      });
    }

    // Apply in-memory sorting if needed (for marketCap and ratio fields)
    if (needsInMemorySort) {
      transformedStocks = applySorting(transformedStocks, sortBy, sortOrder);
    }

    // Build pagination info for non-filtered results
    const pagination = {
      currentPage: pageNumber,
      totalPages,
      totalRecords,
      limit: limitNumber,
      hasNext: pageNumber < totalPages,
      hasPrevious: pageNumber > 1
    };

    return res.status(200).json({
      success: true,
      data: {
        stocks: transformedStocks,
        pagination
      }
    });

  } catch (error) {
    console.error('Scanner API Error:', error);
    return res.status(500).json({
      success: false,
      data: { stocks: [], pagination: { currentPage: 1, totalPages: 0, totalRecords: 0, limit: 20, hasNext: false, hasPrevious: false } },
      message: 'Internal server error'
    });
  }
}
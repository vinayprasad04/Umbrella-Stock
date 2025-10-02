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

    // Parse pagination parameters
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(50, Math.max(10, parseInt(limit))); // Min 10, Max 50
    const skip = (pageNumber - 1) * limitNumber;

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

    // Market Cap range filter
    if (minMarketCap || maxMarketCap) {
      filterQuery['meta.marketCapitalization'] = {};
      if (minMarketCap) {
        filterQuery['meta.marketCapitalization'].$gte = parseFloat(minMarketCap);
      }
      if (maxMarketCap) {
        filterQuery['meta.marketCapitalization'].$lte = parseFloat(maxMarketCap);
      }
    }

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

    // Ratio filters - using exact field names from ratios object
    if (minPE || maxPE) {
      filterQuery['ratios.Stock P/E'] = {};
      if (minPE) {
        filterQuery['ratios.Stock P/E'].$gte = parseFloat(minPE);
      }
      if (maxPE) {
        filterQuery['ratios.Stock P/E'].$lte = parseFloat(maxPE);
      }
    }

    if (minROCE || maxROCE) {
      filterQuery['ratios.ROCE'] = {};
      if (minROCE) {
        filterQuery['ratios.ROCE'].$gte = parseFloat(minROCE);
      }
      if (maxROCE) {
        filterQuery['ratios.ROCE'].$lte = parseFloat(maxROCE);
      }
    }

    if (minROE || maxROE) {
      filterQuery['ratios.Return on equity'] = {};
      if (minROE) {
        filterQuery['ratios.Return on equity'].$gte = parseFloat(minROE);
      }
      if (maxROE) {
        filterQuery['ratios.Return on equity'].$lte = parseFloat(maxROE);
      }
    }

    if (minDebtToEquity || maxDebtToEquity) {
      filterQuery['ratios.Debt to equity'] = {};
      if (minDebtToEquity) {
        filterQuery['ratios.Debt to equity'].$gte = parseFloat(minDebtToEquity);
      }
      if (maxDebtToEquity) {
        filterQuery['ratios.Debt to equity'].$lte = parseFloat(maxDebtToEquity);
      }
    }

    if (minPB || maxPB) {
      filterQuery['ratios.Price to book value'] = {};
      if (minPB) {
        filterQuery['ratios.Price to book value'].$gte = parseFloat(minPB);
      }
      if (maxPB) {
        filterQuery['ratios.Price to book value'].$lte = parseFloat(maxPB);
      }
    }

    if (minDividendYield || maxDividendYield) {
      filterQuery['ratios.Dividend Yield'] = {};
      if (minDividendYield) {
        filterQuery['ratios.Dividend Yield'].$gte = parseFloat(minDividendYield);
      }
      if (maxDividendYield) {
        filterQuery['ratios.Dividend Yield'].$lte = parseFloat(maxDividendYield);
      }
    }

    // Build sort query
    const sortQuery: any = {};
    const validSortFields = [
      'symbol',
      'companyName',
      'meta.marketCapitalization',
      'meta.currentPrice',
      'additionalInfo.sector',
      'additionalInfo.industry',
      'lastUpdated'
    ];

    if (validSortFields.includes(sortBy)) {
      sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortQuery['meta.marketCapitalization'] = -1; // Default sort
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
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Transform data to include calculated metrics
    const transformedStocks = stocks.map((stock: any) => {
      let marketCapInCrores = stock.meta?.marketCapitalization || 0;

      // Extract ratios from the ratios object if available
      const ratios = stock.ratios || {};

      // Use Stock P/E from ratios object (actual stock data), not calculated
      const peRatio = ratios['Stock P/E'] ? parseFloat(ratios['Stock P/E']) : null;

      return {
        id: stock._id,
        symbol: stock.symbol,
        name: stock.companyName,
        sector: stock.additionalInfo?.sector || 'Others',
        industry: stock.additionalInfo?.industry || 'Others',
        currentPrice: stock.meta?.currentPrice || 0,
        marketCap: marketCapInCrores,
        marketCapFormatted: `₹${(marketCapInCrores / 100).toFixed(2)}L Cr`,
        faceValue: stock.meta?.faceValue || 0,
        peRatio: peRatio,
        dataQuality: stock.dataQuality,
        lastUpdated: stock.lastUpdated,
        // Include ratios from database
        oneMonthReturn: ratios['1M Return'] ? parseFloat(ratios['1M Return']) : null,
        tenDayReturn: ratios['1D Return'] ? parseFloat(ratios['1D Return']) : null,
        returnOnEquity: ratios['ROE'] ? parseFloat(ratios['ROE']) : null,
        pbRatio: ratios['P/B'] ? parseFloat(ratios['P/B']) : null,
        // Include all available ratios
        allRatios: ratios
      };
    });

    // Build pagination info
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
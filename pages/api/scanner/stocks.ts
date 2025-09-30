import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualStockDetail from '@/lib/models/ActualStockDetail';

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
  sector?: string;
  industry?: string;
  minMarketCap?: string;
  maxMarketCap?: string;
  minPrice?: string;
  maxPrice?: string;
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
      industry,
      minMarketCap,
      maxMarketCap,
      minPrice,
      maxPrice,
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

    // Sector filter
    if (sector) {
      filterQuery['additionalInfo.sector'] = { $regex: sector, $options: 'i' };
    }

    // Industry filter
    if (industry) {
      filterQuery['additionalInfo.industry'] = { $regex: industry, $options: 'i' };
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
      // Calculate basic ratios if data is available
      let peRatio = null;
      let marketCapInCrores = stock.meta?.marketCapitalization || 0;

      // Calculate P/E ratio if we have net profit data
      if (stock.profitAndLoss?.netProfit && stock.profitAndLoss.netProfit.length > 0) {
        const latestNetProfit = stock.profitAndLoss.netProfit[stock.profitAndLoss.netProfit.length - 1]?.value;
        if (latestNetProfit && latestNetProfit > 0) {
          peRatio = (marketCapInCrores / latestNetProfit).toFixed(2);
        }
      }

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
        peRatio: peRatio ? parseFloat(peRatio) : null,
        dataQuality: stock.dataQuality,
        lastUpdated: stock.lastUpdated,
        // Placeholder values for missing financial ratios - can be calculated later
        oneMonthReturn: null,
        tenDayReturn: null,
        returnOnEquity: null,
        pbRatio: null
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
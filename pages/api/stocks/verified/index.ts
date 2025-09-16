import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualStockDetail from '@/lib/models/ActualStockDetail';
import { APIResponse } from '@/types';

interface VerifiedStockListItem {
  symbol: string;
  companyName: string;
  sector: string;
  industry?: string;
  marketCap: number;
  currentPrice: number;
  eps?: number;
  pe?: number;
  profitMargin?: number;
  salesGrowth?: number;
  profitGrowth?: number;
  lastUpdated: string;
  exchange?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<{
    stocks: VerifiedStockListItem[];
    total: number;
    page: number;
    limit: number;
  }>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    await connectDB();

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const sector = req.query.sector as string || '';
    const sortBy = req.query.sortBy as string || 'marketCap';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Build filter for verified stocks only
    const filter: any = { 
      dataQuality: 'VERIFIED',
      isActive: true 
    };

    if (search) {
      filter.$or = [
        { symbol: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    if (sector) {
      filter['additionalInfo.sector'] = { $regex: sector, $options: 'i' };
    }

    // Helper function to get latest year data
    const getLatestValue = (data: Array<{year: string, value: number}>) => {
      if (!data || data.length === 0) return 0;
      return data.sort((a, b) => b.year.localeCompare(a.year))[0]?.value || 0;
    };

    // Helper function to get year over year growth
    const getYoYGrowth = (data: Array<{year: string, value: number}>) => {
      if (!data || data.length < 2) return 0;
      const sorted = data.sort((a, b) => b.year.localeCompare(a.year));
      const current = sorted[0]?.value || 0;
      const previous = sorted[1]?.value || 0;
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    // Get stocks with pagination
    const skip = (page - 1) * limit;
    
    // Create sort object
    const sortOptions: any = {};
    if (sortBy === 'marketCap') {
      sortOptions['meta.marketCapitalization'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'currentPrice') {
      sortOptions['meta.currentPrice'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'symbol') {
      sortOptions.symbol = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'companyName') {
      sortOptions.companyName = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions['meta.marketCapitalization'] = -1; // Default sort by market cap desc
    }

    const stocks = await ActualStockDetail.find(filter)
      .select('symbol companyName meta profitAndLoss balanceSheet additionalInfo lastUpdated')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform data
    const result: VerifiedStockListItem[] = stocks.map(stock => {
      const latestSales = getLatestValue(stock.profitAndLoss.sales);
      const latestNetProfit = getLatestValue(stock.profitAndLoss.netProfit);
      const latestEquityShares = getLatestValue(stock.balanceSheet.numberOfEquityShares);
      
      // Calculate key ratios
      const eps = latestEquityShares > 0 ? latestNetProfit / latestEquityShares : 0;
      const pe = eps > 0 && stock.meta.currentPrice > 0 ? stock.meta.currentPrice / eps : 0;
      const profitMargin = latestSales > 0 ? (latestNetProfit / latestSales) * 100 : 0;

      return {
        symbol: stock.symbol,
        companyName: stock.companyName,
        sector: stock.additionalInfo?.sector || 'Unknown',
        industry: stock.additionalInfo?.industry,
        marketCap: stock.meta.marketCapitalization,
        currentPrice: stock.meta.currentPrice,
        eps: eps || undefined,
        pe: pe || undefined,
        profitMargin: profitMargin || undefined,
        salesGrowth: getYoYGrowth(stock.profitAndLoss.sales) || undefined,
        profitGrowth: getYoYGrowth(stock.profitAndLoss.netProfit) || undefined,
        lastUpdated: stock.lastUpdated.toISOString(),
        exchange: stock.additionalInfo?.exchange
      };
    });

    // Get total count
    const total = await ActualStockDetail.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        stocks: result,
        total,
        page,
        limit
      },
      message: 'Verified stocks retrieved successfully'
    });

  } catch (error: any) {
    console.error('Error fetching verified stocks:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch verified stocks'
    });
  }
}
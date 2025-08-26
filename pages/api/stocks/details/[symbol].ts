import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Stock from '@/models/Stock';
import StockHistory from '@/models/StockHistory';
import { fetchStockOverview, fetchDailyPrices, StockAPIError } from '@/lib/api-utils';
import { APIResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    await connectDB();
    
    const { symbol } = req.query;
    
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Stock symbol is required',
      });
    }

    const [overview, dailyPrices] = await Promise.all([
      fetchStockOverview(symbol),
      fetchDailyPrices(symbol, 'compact'),
    ]);

    await Stock.findOneAndUpdate(
      { symbol: symbol.toUpperCase() },
      {
        symbol: overview.symbol,
        name: overview.name,
        sector: overview.sector,
        marketCap: overview.marketCap,
        pe: overview.pe,
        eps: overview.eps,
        dividend: overview.dividend,
        high52Week: overview.high52Week,
        low52Week: overview.low52Week,
        lastUpdated: new Date(),
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    const historyPromises = dailyPrices.slice(0, 100).map((price) =>
      StockHistory.findOneAndUpdate(
        { 
          symbol: symbol.toUpperCase(),
          date: new Date(price.date),
        },
        {
          symbol: symbol.toUpperCase(),
          date: new Date(price.date),
          open: price.open,
          high: price.high,
          low: price.low,
          close: price.close,
          volume: price.volume,
        },
        { upsert: true, setDefaultsOnInsert: true }
      )
    );

    await Promise.all(historyPromises);

    const recentHistory = await StockHistory
      .find({ symbol: symbol.toUpperCase() })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        overview,
        history: recentHistory,
        description: overview.description,
      },
    });
  } catch (error) {
    console.error('Error fetching stock details:', error);
    
    if (error instanceof StockAPIError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
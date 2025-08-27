import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Stock from '@/models/Stock';
import StockHistory from '@/models/StockHistory';
import { fetchSingleStock, fetchStockChart } from '@/lib/yahoo-finance-api';
import { getNifty50StockBySymbol } from '@/lib/nifty50-symbols';
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

    const yahooSymbol = symbol.includes('.NS') ? symbol : `${symbol}.NS`;
    
    const [stockData, chartData] = await Promise.all([
      fetchSingleStock(yahooSymbol),
      fetchStockChart(yahooSymbol, '1d', '1y')
    ]);
    
    if (!stockData) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found'
      });
    }
    
    const niftyStock = getNifty50StockBySymbol(yahooSymbol);
    
    const overview = {
      symbol: stockData.symbol.replace('.NS', ''),
      name: stockData.shortName || stockData.longName || stockData.symbol,
      sector: niftyStock?.sector || 'Other',
      marketCap: stockData.marketCap || 0,
      pe: stockData.trailingPE || 0,
      eps: stockData.trailingPE ? stockData.regularMarketPrice / stockData.trailingPE : 0,
      dividend: stockData.dividendYield || 0,
      high52Week: stockData.fiftyTwoWeekHigh || 0,
      low52Week: stockData.fiftyTwoWeekLow || 0,
      currentPrice: stockData.regularMarketPrice,
      change: stockData.regularMarketChange,
      changePercent: stockData.regularMarketChangePercent,
      volume: stockData.regularMarketVolume,
      currency: stockData.currency || 'INR',
      exchange: stockData.exchange || 'NSI',
      description: `${stockData.shortName || stockData.longName} is listed on the National Stock Exchange of India.`
    };
    
    let dailyPrices: any[] = [];
    if (chartData?.indicators?.quote?.[0]) {
      const quote = chartData.indicators.quote[0];
      const timestamps = chartData.timestamp || [];
      
      dailyPrices = timestamps.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: quote.open[index] || 0,
        high: quote.high[index] || 0,
        low: quote.low[index] || 0,
        close: quote.close[index] || 0,
        volume: quote.volume[index] || 0
      })).filter(price => price.close > 0);
    }

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
    
    if (error instanceof Error && error.message.includes('Stock not found')) {
      return res.status(404).json({
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
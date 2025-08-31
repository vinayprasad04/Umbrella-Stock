import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Stock from '@/models/Stock';
import { fetchSingleStock } from '@/lib/yahoo-finance-api';
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

  const { symbol } = req.query;
  
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Stock symbol is required',
    });
  }

  try {
    await connectDB();

    const yahooSymbol = symbol.includes('.NS') ? symbol : `${symbol}.NS`;
    const stockData = await fetchSingleStock(yahooSymbol);
    
    if (!stockData) {
      return res.status(503).json({
        success: false,
        error: `Yahoo Finance API is currently unavailable for ${symbol}. Unable to fetch real-time stock data.`,
        code: 'API_UNAVAILABLE'
      });
    }
    
    const updatedStock = await Stock.findOneAndUpdate(
      { symbol: symbol.toUpperCase() },
      {
        symbol: stockData.symbol.replace('.NS', ''),
        price: stockData.regularMarketPrice,
        change: stockData.regularMarketChange,
        changePercent: stockData.regularMarketChangePercent,
        volume: stockData.regularMarketVolume,
        lastUpdated: new Date(),
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        symbol: stockData.symbol.replace('.NS', ''),
        price: stockData.regularMarketPrice,
        change: stockData.regularMarketChange,
        changePercent: stockData.regularMarketChangePercent,
        volume: stockData.regularMarketVolume,
        high: stockData.regularMarketHigh,
        low: stockData.regularMarketLow,
        open: stockData.regularMarketOpen,
        previousClose: stockData.regularMarketPrice - stockData.regularMarketChange,
        marketCap: stockData.marketCap,
        currency: stockData.currency || 'INR',
        lastUpdated: updatedStock.lastUpdated,
      },
    });
  } catch (error) {
    console.error('Error fetching live stock data:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : `Yahoo Finance API is currently unavailable. Unable to fetch real-time stock data for ${symbol}.`;
    
    res.status(503).json({
      success: false,
      error: errorMessage,
      code: 'API_UNAVAILABLE'
    });
  }
}
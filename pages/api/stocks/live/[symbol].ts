import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Stock from '@/models/Stock';
import { fetchStockQuote, StockAPIError } from '@/lib/api-utils';
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

    const stockData = await fetchStockQuote(symbol);
    
    const updatedStock = await Stock.findOneAndUpdate(
      { symbol: symbol.toUpperCase() },
      {
        symbol: stockData.symbol,
        price: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent,
        volume: stockData.volume,
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
        symbol: stockData.symbol,
        price: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent,
        volume: stockData.volume,
        high: stockData.high,
        low: stockData.low,
        open: stockData.open,
        previousClose: stockData.previousClose,
        lastUpdated: updatedStock.lastUpdated,
      },
    });
  } catch (error) {
    console.error('Error fetching live stock data:', error);
    
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
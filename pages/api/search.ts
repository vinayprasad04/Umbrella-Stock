import { NextApiRequest, NextApiResponse } from 'next';
import { searchStocks } from '@/lib/yahoo-finance-api';
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
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long',
      });
    }

    const searchResults = await searchStocks(q.trim());
    
    const filteredResults = searchResults
      .slice(0, 10)
      .map(stock => ({
        symbol: stock.symbol.replace('.NS', ''),
        name: stock.shortName || stock.longName || stock.symbol,
        type: 'Equity',
        region: 'India',
        currency: stock.currency || 'INR',
        price: stock.regularMarketPrice,
        change: stock.regularMarketChange,
        changePercent: stock.regularMarketChangePercent
      }));

    res.status(200).json({
      success: true,
      data: filteredResults,
    });
  } catch (error) {
    console.error('Error searching stocks:', error);
    
    if (error instanceof Error && error.message.includes('Yahoo Finance')) {
      return res.status(503).json({
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
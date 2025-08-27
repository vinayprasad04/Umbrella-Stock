import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { APIResponse } from '@/types';
import { fetchNifty50Stocks } from '@/lib/yahoo-finance-api';
import { getNifty50StockBySymbol } from '@/lib/nifty50-symbols';

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
    
    let top50Stocks;
    
    try {
      // Fetch real Yahoo Finance NIFTY 50 data
      const yahooStocks = await fetchNifty50Stocks();
      
      top50Stocks = yahooStocks.map(stock => {
        const niftyStock = getNifty50StockBySymbol(stock.symbol);
        return {
          symbol: stock.symbol.replace('.NS', ''), // Remove .NS suffix for display
          name: stock.shortName || stock.longName || stock.symbol,
          sector: niftyStock?.sector || 'Other',
          price: stock.regularMarketPrice,
          change: stock.regularMarketChange,
          changePercent: stock.regularMarketChangePercent,
          volume: stock.regularMarketVolume,
          marketState: stock.marketState || 'REGULAR',
          lastUpdated: new Date(stock.regularMarketTime ? stock.regularMarketTime * 1000 : Date.now()),
          currency: stock.currency || 'INR'
        };
      });
    } catch (error) {
      console.error('Yahoo Finance API failed:', error);
      throw new Error('Unable to fetch live NIFTY 50 data from Yahoo Finance. Please try again later.');
    }

    res.status(200).json({
      success: true,
      data: top50Stocks,
    });
  } catch (error) {
    console.error('Error in top 50 API:', error);
    
    const errorMessage = error instanceof Error && error.message.includes('Yahoo Finance') 
      ? error.message 
      : 'Something went wrong while fetching NIFTY 50 data. Please try again later.';
    
    res.status(503).json({
      success: false,
      error: errorMessage,
      code: 'API_UNAVAILABLE'
    });
  }
}
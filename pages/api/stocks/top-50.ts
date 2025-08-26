import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { APIResponse } from '@/types';
import { fetchNifty50 } from '@/lib/nse-api';
import { generateMockIndianStockData, getIndianStockSector, TOP_50_NIFTY_STOCKS } from '@/lib/indian-stocks-api';

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
      // Fetch real NSE Nifty 50 data
      const nifty50Data = await fetchNifty50();
      
      top50Stocks = nifty50Data.map(stock => ({
        symbol: stock.symbol,
        name: stock.companyName || stock.symbol,
        sector: getIndianStockSector(stock.symbol),
        price: stock.lastPrice,
        change: stock.change,
        changePercent: stock.pChange,
        volume: stock.totalTradedVolume,
        marketState: 'REGULAR',
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('NSE API failed:', error);
      throw new Error('Unable to fetch live NIFTY 50 data from NSE. Please try again later.');
    }

    res.status(200).json({
      success: true,
      data: top50Stocks,
    });
  } catch (error) {
    console.error('Error in top 50 API:', error);
    
    const errorMessage = error instanceof Error && error.message.includes('NSE') 
      ? error.message 
      : 'Something went wrong while fetching NIFTY 50 data. Please try again later.';
    
    res.status(503).json({
      success: false,
      error: errorMessage,
      code: 'API_UNAVAILABLE'
    });
  }
}
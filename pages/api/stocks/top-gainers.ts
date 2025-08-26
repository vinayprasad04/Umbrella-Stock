import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { APIResponse } from '@/types';
import { fetchTopGainers } from '@/lib/nse-api';
import { generateMockIndianStockData, getIndianStockSector } from '@/lib/indian-stocks-api';

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
    
    const limit = parseInt(req.query.limit as string) || 10;

    let topGainers;
    
    try {
      // Fetch real NSE top gainers data
      const nseGainers = await fetchTopGainers();
      
      topGainers = nseGainers
        .slice(0, limit)
        .map(stock => ({
          symbol: stock.symbol,
          name: stock.meta?.companyName || stock.symbol,
          sector: stock.meta?.sector || getIndianStockSector(stock.symbol),
          price: stock.lastPrice,
          change: stock.change,
          changePercent: stock.pChange,
          volume: stock.totalTradedVolume,
          marketState: 'REGULAR',
          lastUpdated: new Date(),
        }));
    } catch (error) {
      console.error('NSE API failed:', error);
      throw new Error('Unable to fetch live market data from NSE. Please try again later.');
    }

    res.status(200).json({
      success: true,
      data: topGainers,
    });
  } catch (error) {
    console.error('Error in top gainers API:', error);
    
    const errorMessage = error instanceof Error && error.message.includes('NSE') 
      ? error.message 
      : 'Something went wrong while fetching market data. Please try again later.';
    
    res.status(503).json({
      success: false,
      error: errorMessage,
      code: 'API_UNAVAILABLE'
    });
  }
}


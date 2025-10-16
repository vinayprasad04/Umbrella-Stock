import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { APIResponse } from '@/types';
import { getTopGainers } from '@/lib/yahoo-finance-api';
import { getNifty50StockBySymbol } from '@/lib/nifty50-symbols';
import { withPublicSecurity } from '@/lib/security';

async function topGainersHandler(
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
      // Fetch real Yahoo Finance top gainers data
      const yahooGainers = await getTopGainers(limit);
      
      topGainers = yahooGainers.map(stock => {
        const niftyStock = getNifty50StockBySymbol(stock.symbol);
        return {
          symbol: stock.symbol.replace('.NS', ''),
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
      throw new Error('Unable to fetch live market data from Yahoo Finance. Please try again later.');
    }

    res.status(200).json({
      success: true,
      data: topGainers,
    });
  } catch (error) {
    console.error('Error in top gainers API:', error);
    
    const errorMessage = error instanceof Error && error.message.includes('Yahoo Finance') 
      ? error.message 
      : 'Something went wrong while fetching market data. Please try again later.';
    
    res.status(503).json({
      success: false,
      error: errorMessage,
      code: 'API_UNAVAILABLE'
    });
  }
}

// Apply public endpoint security (anti-scraping protection)
export default withPublicSecurity(topGainersHandler);


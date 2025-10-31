import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { APIResponse } from '@/types';
import { getTopLosers } from '@/lib/yahoo-finance-api';
import { getNifty50StockBySymbol } from '@/lib/nifty50-symbols';

// In-memory cache for top losers data
let cachedLosersData: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

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

    let topLosers;

    // Check if we have valid cached data
    const now = Date.now();
    if (cachedLosersData && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Returning cached top losers data');
      topLosers = cachedLosersData.slice(0, limit);
    } else {
      try {
        console.log('Fetching fresh top losers data from Yahoo Finance...');
        // Fetch real Yahoo Finance top losers data
        const yahooLosers = await getTopLosers(50); // Fetch more to cache

        const formattedData = yahooLosers.map(stock => {
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

        // Update cache
        cachedLosersData = formattedData;
        cacheTimestamp = now;
        topLosers = formattedData.slice(0, limit);

        console.log(`Successfully cached ${formattedData.length} losers`);
      } catch (error) {
        console.error('Yahoo Finance API failed:', error);

        // If we have stale cache data, return it with a warning
        if (cachedLosersData && cachedLosersData.length > 0) {
          console.log('Returning stale cached data due to API failure');
          topLosers = cachedLosersData.slice(0, limit);
        } else {
          throw new Error('Unable to fetch live market data from Yahoo Finance. Please try again later.');
        }
      }
    }

    res.status(200).json({
      success: true,
      data: topLosers,
    });
  } catch (error) {
    console.error('Error in top losers API:', error);
    
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


import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { APIResponse } from '@/types';
import { getAllIndexSymbolsString } from '@/lib/indian-indices';

export interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketState: string;
  lastUpdated: Date;
}

// Helper function to get display names for indices
function getNameForSymbol(symbol: string): string {
  const names: { [key: string]: string } = {
    '^NSEI': 'NIFTY 50',
    '^CNX100': 'NIFTY 100',
    '^NSEBANK': 'NIFTY Bank',
    '^CNXIT': 'NIFTY IT',
    '^CNXPHARMA': 'NIFTY Pharma',
    '^NSEMDCP100': 'NIFTY Midcap 100',
    '^CNXSC': 'NIFTY Smallcap 100',
    'GOLDM.NS': 'Gold Futures',
    'USDINR=X': 'USD/INR'
  };
  return names[symbol] || symbol;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<IndexData[]>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const symbols = getAllIndexSymbolsString().split(',');
    const indices: IndexData[] = [];
    
    // Use the working chart API approach (same as top-50 API)
    for (const symbol of symbols) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m`;
        
        const response = await axios.get(url, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });

        if (response.data?.chart?.result?.[0]?.meta) {
          const meta = response.data.chart.result[0].meta;
          
          indices.push({
            symbol,
            name: getNameForSymbol(symbol),
            price: meta.regularMarketPrice || meta.chartPreviousClose || 0,
            change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
            changePercent: meta.previousClose ? (((meta.regularMarketPrice || 0) - (meta.previousClose || 0)) / (meta.previousClose || 1)) * 100 : 0,
            currency: meta.currency || 'INR',
            marketState: 'REGULAR',
            lastUpdated: new Date(meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now())
          });
        }
      } catch (error) {
        console.warn(`Error fetching ${symbol}:`, error);
        // Continue with other symbols
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (indices.length === 0) {
      throw new Error('Unable to fetch any index data from Yahoo Finance');
    }

    res.status(200).json({
      success: true,
      data: indices,
    });

  } catch (error) {
    console.error('Error fetching indices data:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Yahoo Finance API is currently unavailable. Unable to fetch real-time indices data.';
    
    res.status(503).json({
      success: false,
      error: errorMessage,
      code: 'API_UNAVAILABLE'
    });
  }
}
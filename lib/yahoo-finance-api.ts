import axios from 'axios';
import { getAllNifty50SymbolsString, getAllNifty50Symbols } from './nifty50-symbols';

export interface YahooQuoteResponse {
  quoteResponse: {
    result: YahooStock[];
    error: any;
  };
}

export interface YahooStock {
  symbol: string;
  shortName: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketOpen?: number;
  regularMarketHigh?: number;
  regularMarketLow?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  trailingPE?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageVolume?: number;
  currency?: string;
  exchange?: string;
  marketState?: string;
  regularMarketTime?: number;
}

export interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        symbol: string;
        exchangeName: string;
        instrumentType: string;
        firstTradeDate: number;
        regularMarketTime: number;
        regularMarketPrice: number;
        chartPreviousClose: number;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }>;
    error: any;
  };
}

const YAHOO_FINANCE_BASE_URL = 'https://query2.finance.yahoo.com';

// Fetch multiple stocks using chart API (which works better than quote API)
export const fetchMultipleStocks = async (symbols: string[]): Promise<YahooStock[]> => {
  const allResults: YahooStock[] = [];
  
  // Process symbols individually using chart API
  for (const symbol of symbols) {
    try {
      const stock = await fetchSingleStockFromChart(symbol);
      if (stock) {
        allResults.push(stock);
      }
    } catch (error) {
      console.warn(`Error fetching ${symbol}:`, error);
      // Continue with other symbols
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return allResults;
};

// Fetch single stock from chart API (more reliable)
const fetchSingleStockFromChart = async (symbol: string): Promise<YahooStock | null> => {
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
      
      return {
        symbol: symbol,
        shortName: meta.longName || meta.shortName || symbol,
        longName: meta.longName,
        regularMarketPrice: meta.regularMarketPrice || meta.chartPreviousClose || 0,
        regularMarketChange: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
        regularMarketChangePercent: meta.previousClose ? (((meta.regularMarketPrice || 0) - (meta.previousClose || 0)) / (meta.previousClose || 1)) * 100 : 0,
        regularMarketOpen: meta.regularMarketDayLow, // Approximation
        regularMarketHigh: meta.regularMarketDayHigh || 0,
        regularMarketLow: meta.regularMarketDayLow || 0,
        regularMarketVolume: meta.regularMarketVolume || 0,
        marketCap: 0, // Not available in chart API
        trailingPE: 0, // Not available in chart API
        dividendYield: 0, // Not available in chart API
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
        averageVolume: 0, // Not available in chart API
        currency: meta.currency || 'INR',
        exchange: meta.exchangeName || 'NSI',
        marketState: 'REGULAR',
        regularMarketTime: meta.regularMarketTime || Math.floor(Date.now() / 1000)
      };
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch ${symbol} from chart API:`, error);
    return null;
  }
};

// No mock data - we only return real Yahoo Finance data or errors

// Fetch all NIFTY 50 stocks - only real data, no mock fallback
export const fetchNifty50Stocks = async (): Promise<YahooStock[]> => {
  console.log('Fetching NIFTY 50 stocks from Yahoo Finance chart API...');
  const symbols = getAllNifty50Symbols();
  
  // Fetch first few stocks in parallel to test if API is working
  const testSymbols = symbols.slice(0, 3);
  const testPromises = testSymbols.map(symbol => fetchSingleStockFromChart(symbol));
  const testResults = (await Promise.allSettled(testPromises))
    .filter(result => result.status === 'fulfilled' && result.value !== null)
    .map(result => (result as PromiseFulfilledResult<YahooStock>).value);
  
  if (testResults.length < 2) {
    throw new Error('Yahoo Finance API is currently unavailable. Unable to fetch real-time stock data.');
  }
  
  // API is working, fetch all stocks in parallel (with chunking)
  console.log('Chart API working, fetching all stocks in parallel...');
  
  // Chunk the requests to avoid overwhelming the API
  const chunks = [];
  const chunkSize = 10;
  for (let i = 0; i < symbols.length; i += chunkSize) {
    chunks.push(symbols.slice(i, i + chunkSize));
  }
  
  const allResults: YahooStock[] = [];
  
  for (const chunk of chunks) {
    const chunkPromises = chunk.map(symbol => fetchSingleStockFromChart(symbol));
    const chunkResults = (await Promise.allSettled(chunkPromises))
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<YahooStock>).value);
    
    allResults.push(...chunkResults);
    
    // Small delay between chunks
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  if (allResults.length < 40) { // Didn't get enough data
    throw new Error(`Yahoo Finance API returned insufficient data. Only ${allResults.length}/50 stocks available.`);
  }
  
  console.log(`Successfully fetched ${allResults.length} real stock prices`);
  return allResults;
};

// Fetch single stock data - only real data, no mock fallback
export const fetchSingleStock = async (symbol: string): Promise<YahooStock | null> => {
  try {
    // Try chart API
    const stock = await fetchSingleStockFromChart(symbol);
    if (stock) {
      return stock;
    }
    
    // No fallback to mock data - return null if API fails
    console.warn(`Yahoo Finance API unavailable for ${symbol}`);
    return null;
    
  } catch (error) {
    console.error(`Error fetching single stock ${symbol}:`, error);
    return null;
  }
};

// Fetch historical chart data
export const fetchStockChart = async (
  symbol: string, 
  interval: string = '1m', 
  range: string = '1d'
): Promise<YahooChartResponse['chart']['result'][0] | null> => {
  try {
    const url = `${YAHOO_FINANCE_BASE_URL}/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    
    const response = await axios.get<YahooChartResponse>(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    return response.data.chart.result?.[0] || null;
  } catch (error) {
    console.error(`Error fetching chart for ${symbol}:`, error);
    return null;
  }
};

// Get top gainers from NIFTY 50 - throws error if API fails
export const getTopGainers = async (limit: number = 10): Promise<YahooStock[]> => {
  const stocks = await fetchNifty50Stocks(); // Will throw error if API fails
  return stocks
    .filter(stock => stock.regularMarketChangePercent > 0)
    .sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent)
    .slice(0, limit);
};

// Get top losers from NIFTY 50 - throws error if API fails
export const getTopLosers = async (limit: number = 10): Promise<YahooStock[]> => {
  const stocks = await fetchNifty50Stocks(); // Will throw error if API fails
  return stocks
    .filter(stock => stock.regularMarketChangePercent < 0)
    .sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent)
    .slice(0, limit);
};

// Get most active stocks by volume - throws error if API fails
export const getMostActive = async (limit: number = 10): Promise<YahooStock[]> => {
  const stocks = await fetchNifty50Stocks(); // Will throw error if API fails
  return stocks
    .filter(stock => stock.regularMarketVolume && stock.regularMarketVolume > 0)
    .sort((a, b) => (b.regularMarketVolume || 0) - (a.regularMarketVolume || 0))
    .slice(0, limit);
};

// Search stocks by name or symbol - throws error if API fails
export const searchStocks = async (query: string): Promise<YahooStock[]> => {
  const stocks = await fetchNifty50Stocks(); // Will throw error if API fails
  const lowerQuery = query.toLowerCase();
  
  return stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(lowerQuery) ||
    stock.shortName.toLowerCase().includes(lowerQuery) ||
    (stock.longName && stock.longName.toLowerCase().includes(lowerQuery))
  );
};

// Format price for display
export const formatPrice = (price: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency === 'INR' ? 'INR' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

// Format percentage change
export const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
};
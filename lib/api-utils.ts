import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

export class StockAPIError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'StockAPIError';
  }
}

export const alphaVantageAPI = axios.create({
  baseURL: ALPHA_VANTAGE_BASE_URL,
  timeout: 10000,
});

export async function fetchStockQuote(symbol: string) {
  try {
    const response = await alphaVantageAPI.get('', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol.toUpperCase(),
        apikey: ALPHA_VANTAGE_API_KEY,
      },
    });

    const quote = response.data['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      throw new StockAPIError(`Stock symbol ${symbol} not found`, 404);
    }

    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
    };
  } catch (error) {
    if (error instanceof StockAPIError) throw error;
    throw new StockAPIError('Failed to fetch stock quote');
  }
}

export async function fetchStockOverview(symbol: string) {
  try {
    const response = await alphaVantageAPI.get('', {
      params: {
        function: 'OVERVIEW',
        symbol: symbol.toUpperCase(),
        apikey: ALPHA_VANTAGE_API_KEY,
      },
    });

    const overview = response.data;
    
    if (!overview || !overview.Symbol) {
      throw new StockAPIError(`Stock overview for ${symbol} not found`, 404);
    }

    return {
      symbol: overview.Symbol,
      name: overview.Name,
      sector: overview.Sector || 'Unknown',
      marketCap: overview.MarketCapitalization ? parseInt(overview.MarketCapitalization) : 0,
      pe: overview.PERatio ? parseFloat(overview.PERatio) : null,
      eps: overview.EPS ? parseFloat(overview.EPS) : null,
      dividend: overview.DividendYield ? parseFloat(overview.DividendYield) : 0,
      high52Week: overview['52WeekHigh'] ? parseFloat(overview['52WeekHigh']) : null,
      low52Week: overview['52WeekLow'] ? parseFloat(overview['52WeekLow']) : null,
      description: overview.Description,
    };
  } catch (error) {
    if (error instanceof StockAPIError) throw error;
    throw new StockAPIError('Failed to fetch stock overview');
  }
}

export async function fetchDailyPrices(symbol: string, outputSize: 'compact' | 'full' = 'compact') {
  try {
    const response = await alphaVantageAPI.get('', {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: symbol.toUpperCase(),
        outputsize: outputSize,
        apikey: ALPHA_VANTAGE_API_KEY,
      },
    });

    const timeSeries = response.data['Time Series (Daily)'];
    
    if (!timeSeries) {
      throw new StockAPIError(`Daily prices for ${symbol} not found`, 404);
    }

    const prices = Object.entries(timeSeries).map(([date, data]: [string, any]) => ({
      date,
      open: parseFloat(data['1. open']),
      high: parseFloat(data['2. high']),
      low: parseFloat(data['3. low']),
      close: parseFloat(data['4. close']),
      volume: parseInt(data['5. volume']),
    }));

    return prices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    if (error instanceof StockAPIError) throw error;
    throw new StockAPIError('Failed to fetch daily prices');
  }
}

export async function searchStocks(keywords: string) {
  try {
    const response = await alphaVantageAPI.get('', {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: keywords,
        apikey: ALPHA_VANTAGE_API_KEY,
      },
    });

    const matches = response.data.bestMatches || [];
    
    return matches.map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
      marketOpen: match['5. marketOpen'],
      marketClose: match['6. marketClose'],
      timezone: match['7. timezone'],
      currency: match['8. currency'],
      matchScore: parseFloat(match['9. matchScore']),
    }));
  } catch (error) {
    throw new StockAPIError('Failed to search stocks');
  }
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

export function formatPercentage(percent: number): string {
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
}

export function formatAUM(amount: number): string {
  if (!amount || amount === 0) return '₹0 Cr';
  
  // Convert to crores and format
  const crores = amount / 10000000; // 1 crore = 10,000,000
  
  if (crores >= 1000) {
    return `₹${crores.toFixed(0)} Cr`;
  } else if (crores >= 100) {
    return `₹${crores.toFixed(0)} Cr`;
  } else if (crores >= 10) {
    return `₹${crores.toFixed(1)} Cr`;
  } else {
    return `₹${crores.toFixed(2)} Cr`;
  }
}
import axios from 'axios';

// Popular Indian stocks on NSE
export const POPULAR_INDIAN_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN', 
  'BHARTIARTL', 'KOTAKBANK', 'LT', 'HCLTECH', 'ASIANPAINT', 'MARUTI', 'AXISBANK',
  'WIPRO', 'ULTRACEMCO', 'TITAN', 'NESTLEIND', 'BAJFINANCE', 'SUNPHARMA', 'TECHM',
  'POWERGRID', 'TATAMOTORS', 'NTPC', 'TATASTEEL', 'ONGC', 'JSWSTEEL', 'GRASIM',
  'HINDALCO', 'COALINDIA', 'BPCL', 'DIVISLAB', 'DRREDDY', 'BAJAJFINSV', 'BRITANNIA',
  'EICHERMOT', 'HEROMOTOCO', 'CIPLA', 'INDUSINDBK', 'M&M', 'SHREECEM', 'TATACONSUM',
  'ADANIENT', 'APOLLOHOSP', 'HDFCLIFE', 'SBILIFE', 'BAJAJ-AUTO', 'GODREJCP', 'VEDL'
];

export const TOP_50_NIFTY_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN',
  'BHARTIARTL', 'KOTAKBANK', 'LT', 'HCLTECH', 'ASIANPAINT', 'MARUTI', 'AXISBANK',
  'WIPRO', 'ULTRACEMCO', 'TITAN', 'NESTLEIND', 'BAJFINANCE', 'SUNPHARMA', 'TECHM',
  'POWERGRID', 'TATAMOTORS', 'NTPC', 'TATASTEEL', 'ONGC', 'JSWSTEEL', 'GRASIM',
  'HINDALCO', 'COALINDIA', 'BPCL', 'DIVISLAB', 'DRREDDY', 'BAJAJFINSV', 'BRITANNIA',
  'EICHERMOT', 'HEROMOTOCO', 'CIPLA', 'INDUSINDBK', 'M&M', 'SHREECEM', 'TATACONSUM',
  'ADANIENT', 'APOLLOHOSP', 'HDFCLIFE', 'SBILIFE', 'BAJAJ-AUTO', 'GODREJCP', 'VEDL'
];

// Indian stock names mapping
export const INDIAN_STOCK_NAMES: { [key: string]: string } = {
  'RELIANCE': 'Reliance Industries Limited',
  'TCS': 'Tata Consultancy Services Limited',
  'HDFCBANK': 'HDFC Bank Limited',
  'INFY': 'Infosys Limited',
  'ICICIBANK': 'ICICI Bank Limited',
  'HINDUNILVR': 'Hindustan Unilever Limited',
  'ITC': 'ITC Limited',
  'SBIN': 'State Bank of India',
  'BHARTIARTL': 'Bharti Airtel Limited',
  'KOTAKBANK': 'Kotak Mahindra Bank Limited',
  'LT': 'Larsen & Toubro Limited',
  'HCLTECH': 'HCL Technologies Limited',
  'ASIANPAINT': 'Asian Paints Limited',
  'MARUTI': 'Maruti Suzuki India Limited',
  'AXISBANK': 'Axis Bank Limited',
  'WIPRO': 'Wipro Limited',
  'ULTRACEMCO': 'UltraTech Cement Limited',
  'TITAN': 'Titan Company Limited',
  'NESTLEIND': 'Nestle India Limited',
  'BAJFINANCE': 'Bajaj Finance Limited',
  'SUNPHARMA': 'Sun Pharmaceutical Industries Limited',
  'TECHM': 'Tech Mahindra Limited',
  'POWERGRID': 'Power Grid Corporation of India Limited',
  'TATAMOTORS': 'Tata Motors Limited',
  'NTPC': 'NTPC Limited',
  'TATASTEEL': 'Tata Steel Limited',
  'ONGC': 'Oil and Natural Gas Corporation Limited',
  'JSWSTEEL': 'JSW Steel Limited',
  'GRASIM': 'Grasim Industries Limited',
  'HINDALCO': 'Hindalco Industries Limited',
  'COALINDIA': 'Coal India Limited',
  'BPCL': 'Bharat Petroleum Corporation Limited',
  'DIVISLAB': 'Divi\'s Laboratories Limited',
  'DRREDDY': 'Dr. Reddy\'s Laboratories Limited',
  'BAJAJFINSV': 'Bajaj Finserv Limited',
  'BRITANNIA': 'Britannia Industries Limited',
  'EICHERMOT': 'Eicher Motors Limited',
  'HEROMOTOCO': 'Hero MotoCorp Limited',
  'CIPLA': 'Cipla Limited',
  'INDUSINDBK': 'IndusInd Bank Limited',
  'M&M': 'Mahindra & Mahindra Limited',
  'SHREECEM': 'Shree Cement Limited',
  'TATACONSUM': 'Tata Consumer Products Limited',
  'ADANIENT': 'Adani Enterprises Limited',
  'APOLLOHOSP': 'Apollo Hospitals Enterprise Limited',
  'HDFCLIFE': 'HDFC Life Insurance Company Limited',
  'SBILIFE': 'SBI Life Insurance Company Limited',
  'BAJAJ-AUTO': 'Bajaj Auto Limited',
  'GODREJCP': 'Godrej Consumer Products Limited',
  'VEDL': 'Vedanta Limited'
};

export interface YahooFinanceResponse {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketState: string;
  regularMarketTime: number;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketState: string;
  lastUpdated: Date;
}

// Check if Indian market is currently open
export function isIndianMarketOpen(): boolean {
  const now = new Date();
  // Convert to IST using proper timezone handling
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  const day = istTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  // Market is closed on weekends (Saturday = 6, Sunday = 0)
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Market hours: 9:15 AM to 3:30 PM IST (Monday to Friday)
  const marketStart = 9 * 60 + 15; // 9:15 AM in minutes
  const marketEnd = 15 * 60 + 30;   // 3:30 PM in minutes
  
  return currentTime >= marketStart && currentTime <= marketEnd;
}

// Fetch stock data using Yahoo Finance (fallback to mock data if API fails)
export async function fetchIndianStockData(symbols: string[]): Promise<StockData[]> {
  try {
    // For demo purposes, we'll use mock data since Yahoo Finance API requires special handling
    // In production, you would integrate with a proper API service
    return generateMockIndianStockData(symbols);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return generateMockIndianStockData(symbols);
  }
}

// Generate realistic mock data for Indian stocks
export function generateMockIndianStockData(symbols: string[]): StockData[] {
  const isMarketOpen = isIndianMarketOpen();
  const baseTime = Date.now();
  
  return symbols.map((symbol) => {
    // Generate realistic price ranges based on actual stock prices
    const basePrices: { [key: string]: number } = {
      'RELIANCE': 2800, 'TCS': 4200, 'HDFCBANK': 1700, 'INFY': 1900, 'ICICIBANK': 1200,
      'HINDUNILVR': 2650, 'ITC': 470, 'SBIN': 825, 'BHARTIARTL': 1150, 'KOTAKBANK': 1800,
      'LT': 3650, 'HCLTECH': 1850, 'ASIANPAINT': 3200, 'MARUTI': 11500, 'AXISBANK': 1150,
      'WIPRO': 650, 'ULTRACEMCO': 11200, 'TITAN': 3400, 'NESTLEIND': 25000, 'BAJFINANCE': 8200
    };
    
    const basePrice = basePrices[symbol] || (Math.random() * 2000 + 500);
    const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
    const price = basePrice * (1 + changePercent / 100);
    const change = price - basePrice;
    const volume = Math.floor(Math.random() * 5000000) + 100000;
    
    return {
      symbol,
      name: INDIAN_STOCK_NAMES[symbol] || `${symbol} Limited`,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume,
      marketState: isMarketOpen ? 'REGULAR' : 'CLOSED',
      lastUpdated: new Date(baseTime - Math.random() * 5000) // Slight time variation
    };
  });
}

// Get sector for Indian stocks
export function getIndianStockSector(symbol: string): string {
  const sectors: { [key: string]: string } = {
    'RELIANCE': 'Oil & Gas', 'TCS': 'IT Services', 'HDFCBANK': 'Banking', 'INFY': 'IT Services',
    'ICICIBANK': 'Banking', 'HINDUNILVR': 'FMCG', 'ITC': 'FMCG', 'SBIN': 'Banking',
    'BHARTIARTL': 'Telecom', 'KOTAKBANK': 'Banking', 'LT': 'Construction', 'HCLTECH': 'IT Services',
    'ASIANPAINT': 'Paints', 'MARUTI': 'Automotive', 'AXISBANK': 'Banking', 'WIPRO': 'IT Services',
    'ULTRACEMCO': 'Cement', 'TITAN': 'Consumer Goods', 'NESTLEIND': 'FMCG', 'BAJFINANCE': 'NBFC',
    'SUNPHARMA': 'Pharma', 'TECHM': 'IT Services', 'POWERGRID': 'Power', 'TATAMOTORS': 'Automotive',
    'NTPC': 'Power', 'TATASTEEL': 'Metals', 'ONGC': 'Oil & Gas', 'JSWSTEEL': 'Metals'
  };
  
  return sectors[symbol] || 'Others';
}
import axios, { AxiosInstance } from 'axios';

interface NSEResponse {
  data?: any;
  advance?: any;
  decline?: any;
}

interface NSEStock {
  symbol: string;
  companyName?: string;
  lastPrice: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
  totalTradedValue?: number;
  dayHigh?: number;
  dayLow?: number;
  yearHigh?: number;
  yearLow?: number;
  identifier?: string;
  series?: string;
}

interface NSEGainerLoser {
  symbol: string;
  series: string;
  lastPrice: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
  identifier: string;
  meta?: {
    companyName?: string;
    sector?: string;
    industry?: string;
  };
}

class NSEApiClient {
  private client: AxiosInstance;
  private sessionCookies: string = '';
  private lastSessionUpdate: number = 0;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.nseindia.com',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.nseindia.com/',
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    // Add request interceptor to include cookies
    this.client.interceptors.request.use((config) => {
      if (this.sessionCookies) {
        config.headers['Cookie'] = this.sessionCookies;
      }
      return config;
    });

    // Add response interceptor to handle cookies
    this.client.interceptors.response.use(
      (response) => {
        const setCookieHeaders = response.headers['set-cookie'];
        if (setCookieHeaders && setCookieHeaders.length > 0) {
          this.sessionCookies = setCookieHeaders.join('; ');
          this.lastSessionUpdate = Date.now();
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 403 || error.response?.status === 401) {
          // Session might be expired, clear cookies
          this.sessionCookies = '';
          this.lastSessionUpdate = 0;
        }
        return Promise.reject(error);
      }
    );
  }

  private async initializeSession(): Promise<void> {
    try {
      // Visit the main page to get initial session cookies
      await this.client.get('/');
      console.log('NSE session initialized');
    } catch (error) {
      console.error('Failed to initialize NSE session:', error);
      throw error;
    }
  }

  private async ensureValidSession(): Promise<void> {
    const now = Date.now();
    if (!this.sessionCookies || (now - this.lastSessionUpdate) > this.SESSION_TIMEOUT) {
      await this.initializeSession();
    }
  }

  async getNifty50Data(): Promise<NSEStock[]> {
    try {
      await this.ensureValidSession();
      
      const response = await this.client.get('/api/equity-stockIndices?index=NIFTY%2050');
      
      if (response.data && response.data.data) {
        return response.data.data.map((stock: any) => ({
          symbol: stock.symbol,
          companyName: stock.meta?.companyName || stock.symbol,
          lastPrice: parseFloat(stock.lastPrice) || 0,
          change: parseFloat(stock.change) || 0,
          pChange: parseFloat(stock.pChange) || 0,
          totalTradedVolume: parseInt(stock.totalTradedVolume) || 0,
          totalTradedValue: parseFloat(stock.totalTradedValue) || 0,
          dayHigh: parseFloat(stock.dayHigh) || 0,
          dayLow: parseFloat(stock.dayLow) || 0,
          yearHigh: parseFloat(stock.yearHigh) || 0,
          yearLow: parseFloat(stock.yearLow) || 0,
          identifier: stock.identifier || stock.symbol,
          series: stock.series || 'EQ'
        }));
      }
      
      throw new Error('Invalid response format from NSE API');
    } catch (error) {
      console.error('Error fetching NIFTY 50 data:', error);
      throw error;
    }
  }

  async getTopGainers(): Promise<NSEGainerLoser[]> {
    try {
      await this.ensureValidSession();
      
      const response = await this.client.get('/api/live-analysis-variations?index=Gainers');
      
      if (response.data && response.data.NIFTY) {
        return response.data.NIFTY.map((stock: any) => ({
          symbol: stock.symbol,
          series: stock.series || 'EQ',
          lastPrice: parseFloat(stock.ltp) || 0,
          change: parseFloat(stock.netPrice) || 0,
          pChange: parseFloat(stock.netPercent) || 0,
          totalTradedVolume: parseInt(stock.volume) || 0,
          identifier: stock.identifier || stock.symbol,
          meta: {
            companyName: stock.meta?.companyName || stock.symbol,
            sector: stock.meta?.sector || 'Unknown',
            industry: stock.meta?.industry || 'Unknown'
          }
        }));
      }
      
      throw new Error('Invalid response format from NSE gainers API');
    } catch (error) {
      console.error('Error fetching top gainers:', error);
      throw error;
    }
  }

  async getTopLosers(): Promise<NSEGainerLoser[]> {
    try {
      await this.ensureValidSession();
      
      const response = await this.client.get('/api/live-analysis-variations?index=Losers');
      
      if (response.data && response.data.NIFTY) {
        return response.data.NIFTY.map((stock: any) => ({
          symbol: stock.symbol,
          series: stock.series || 'EQ',
          lastPrice: parseFloat(stock.ltp) || 0,
          change: parseFloat(stock.netPrice) || 0,
          pChange: parseFloat(stock.netPercent) || 0,
          totalTradedVolume: parseInt(stock.volume) || 0,
          identifier: stock.identifier || stock.symbol,
          meta: {
            companyName: stock.meta?.companyName || stock.symbol,
            sector: stock.meta?.sector || 'Unknown',
            industry: stock.meta?.industry || 'Unknown'
          }
        }));
      }
      
      throw new Error('Invalid response format from NSE losers API');
    } catch (error) {
      console.error('Error fetching top losers:', error);
      throw error;
    }
  }

  async getPreOpenData(): Promise<NSEStock[]> {
    try {
      await this.ensureValidSession();
      
      const response = await this.client.get('/api/market-data-pre-open?key=NIFTY%2050');
      
      if (response.data && response.data.data) {
        return response.data.data.map((item: any) => ({
          symbol: item.metadata?.symbol,
          companyName: item.metadata?.companyName || item.metadata?.symbol,
          lastPrice: parseFloat(item.lastPrice) || 0,
          change: parseFloat(item.change) || 0,
          pChange: parseFloat(item.pChange) || 0,
          totalTradedVolume: parseInt(item.totalTradedVolume) || 0,
          identifier: item.metadata?.identifier || item.metadata?.symbol,
          series: item.metadata?.series || 'EQ'
        }));
      }
      
      throw new Error('Invalid response format from NSE pre-open API');
    } catch (error) {
      console.error('Error fetching pre-open data:', error);
      throw error;
    }
  }
}

// Singleton instance
const nseClient = new NSEApiClient();

// Export functions for use in API routes
export async function fetchNifty50(): Promise<NSEStock[]> {
  return await nseClient.getNifty50Data();
}

export async function fetchTopGainers(): Promise<NSEGainerLoser[]> {
  return await nseClient.getTopGainers();
}

export async function fetchTopLosers(): Promise<NSEGainerLoser[]> {
  return await nseClient.getTopLosers();
}

export async function fetchPreOpenData(): Promise<NSEStock[]> {
  return await nseClient.getPreOpenData();
}

export type { NSEStock, NSEGainerLoser };
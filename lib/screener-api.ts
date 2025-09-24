import axios from 'axios';

export interface ScreenerChartResponse {
  datasets: Array<{
    metric: string;
    label: string;
    values: Array<[string, string | number] | [string, number, { delivery?: number }]>;
    meta: {
      is_weekly?: boolean;
    };
  }>;
}

export interface ScreenerPriceData {
  date: string;
  price: number;
  volume?: number;
  dma50?: number;
  dma200?: number;
}

// Company ID mapping for major stocks
const COMPANY_IDS: Record<string, number> = {
  'HDFCBANK': 1298,
  'RELIANCE': 2726,
  'INFY': 500209,
  'TCS': 532540,
  'ICICIBANK': 532174,
  'HINDUNILVR': 500696,
  'ITC': 500875,
  'SBIN': 500112,
  'BHARTIARTL': 532454,
  'ASIANPAINT': 500820,
  'MARUTI': 532500,
  'BAJFINANCE': 500034,
  'LICI': 543526,
  'KOTAKBANK': 500247,
  'LT': 500510,
  'AXISBANK': 532215,
  'TITAN': 500114,
  'SUNPHARMA': 524715,
  'ULTRACEMCO': 532538,
  'NESTLEIND': 500790,
  'POWERGRID': 532898,
  'NTPC': 532555,
  'TATAMOTORS': 500570,
  'COALINDIA': 533278,
  'M&M': 500520,
  'BAJAJFINSV': 532978,
  'HCLTECH': 532281,
  'WIPRO': 507685,
  'ONGC': 500312,
  'TATASTEEL': 500470,
  'TECHM': 532755,
  'JSWSTEEL': 500228,
  'HINDALCO': 500440,
  'INDUSINDBK': 532187,
  'ADANIENT': 512599,
  'TATACONSUM': 500800,
  'GRASIM': 500300,
  'CIPLA': 500087,
  'BRITANNIA': 500825,
  'BPCL': 500547,
  'DRREDDY': 500124,
  'APOLLOHOSP': 526777,
  'HEROMOTOCO': 500182,
  'UPL': 512599,
  'DIVISLAB': 532488,
  'EICHERMOT': 505200,
  'BAJAJ-AUTO': 532977,
  'ADANIPORTS': 532921,
  'SHRIRAMFIN': 511243
};

// Fetch chart data from screener.in API
export const fetchScreenerChart = async (
  symbol: string,
  days: number = 365
): Promise<ScreenerPriceData[]> => {
  try {
    // Get company ID for the symbol
    const companyId = COMPANY_IDS[symbol.replace('.NS', '').toUpperCase()];

    if (!companyId) {
      throw new Error(`Company ID not found for symbol: ${symbol}`);
    }

    const url = `https://www.screener.in/api/company/${companyId}/chart/`;
    const params = {
      q: 'Price-DMA50-DMA200-Volume',
      days: days.toString(),
      consolidated: 'true'
    };

    const response = await axios.get<ScreenerChartResponse>(url, {
      params,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'Referer': `https://www.screener.in/company/${symbol.replace('.NS', '').toUpperCase()}/consolidated/`,
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      }
    });

    const { datasets } = response.data;

    // Find price, DMA50, DMA200, and volume datasets
    const priceDataset = datasets.find(d => d.metric === 'Price');
    const dma50Dataset = datasets.find(d => d.metric === 'DMA50');
    const dma200Dataset = datasets.find(d => d.metric === 'DMA200');
    const volumeDataset = datasets.find(d => d.metric === 'Volume');

    if (!priceDataset) {
      throw new Error('Price data not found in response');
    }

    // Convert to our format
    const result: ScreenerPriceData[] = [];

    priceDataset.values.forEach((priceEntry, index) => {
      const [date, priceStr] = priceEntry as [string, string];
      const price = parseFloat(priceStr);

      if (isNaN(price)) return;

      const dataPoint: ScreenerPriceData = {
        date,
        price
      };

      // Add DMA50 if available
      if (dma50Dataset && dma50Dataset.values[index]) {
        const dma50Value = dma50Dataset.values[index][1];
        if (typeof dma50Value === 'string') {
          dataPoint.dma50 = parseFloat(dma50Value);
        } else if (typeof dma50Value === 'number') {
          dataPoint.dma50 = dma50Value;
        }
      }

      // Add DMA200 if available
      if (dma200Dataset && dma200Dataset.values[index]) {
        const dma200Value = dma200Dataset.values[index][1];
        if (typeof dma200Value === 'string') {
          dataPoint.dma200 = parseFloat(dma200Value);
        } else if (typeof dma200Value === 'number') {
          dataPoint.dma200 = dma200Value;
        }
      }

      // Add volume if available
      if (volumeDataset && volumeDataset.values[index]) {
        const volumeEntry = volumeDataset.values[index];
        if (volumeEntry.length >= 2) {
          const volumeValue = volumeEntry[1];
          if (typeof volumeValue === 'number') {
            dataPoint.volume = volumeValue;
          }
        }
      }

      result.push(dataPoint);
    });

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  } catch (error: any) {
    console.error(`Error fetching screener chart for ${symbol}:`, error?.message || error);
    throw error;
  }
};

// Get current stock price from screener data
export const getCurrentStockPrice = async (symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  date: string;
} | null> => {
  try {
    const chartData = await fetchScreenerChart(symbol, 7); // Get last 7 days

    if (chartData.length < 2) {
      return null;
    }

    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];

    const change = latest.price - previous.price;
    const changePercent = (change / previous.price) * 100;

    return {
      price: latest.price,
      change,
      changePercent,
      date: latest.date
    };

  } catch (error) {
    console.error(`Error getting current price for ${symbol}:`, error);
    return null;
  }
};

// Check if symbol is supported
export const isSymbolSupported = (symbol: string): boolean => {
  const cleanSymbol = symbol.replace('.NS', '').toUpperCase();
  return cleanSymbol in COMPANY_IDS;
};

// Get all supported symbols
export const getSupportedSymbols = (): string[] => {
  return Object.keys(COMPANY_IDS);
};
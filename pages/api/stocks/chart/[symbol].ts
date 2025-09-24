import { NextApiRequest, NextApiResponse } from 'next';
import { fetchScreenerChart, isSymbolSupported } from '@/lib/screener-api';
import { fetchStockChart } from '@/lib/yahoo-finance-api';
import { APIResponse } from '@/types';

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
    const { symbol, period = '1Y' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Stock symbol is required',
      });
    }

    // Map period to days
    const periodDaysMap: Record<string, number> = {
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '2Y': 730,
      '5Y': 1825,
      '10Y': 3650,
      'MAX': 3650
    };

    const days = periodDaysMap[period as string] || 365;
    let chartData = null;

    // Try screener.in API first (has DMA50, DMA200, Volume)
    if (isSymbolSupported(symbol)) {
      try {
        console.log(`Fetching chart data for ${symbol} from screener.in (${period})`);
        const screenerData = await fetchScreenerChart(symbol, days);

        if (screenerData.length > 0) {
          chartData = {
            source: 'screener',
            period,
            data: screenerData.map(item => ({
              date: item.date,
              price: item.price,
              dma50: item.dma50,
              dma200: item.dma200,
              volume: item.volume,
              close: item.price,
              open: item.price, // Approximation
              high: item.price, // Approximation
              low: item.price   // Approximation
            }))
          };
        }
      } catch (error) {
        console.warn(`Screener.in failed for ${symbol}, falling back to Yahoo Finance:`, error);
      }
    }

    // Fallback to Yahoo Finance
    if (!chartData) {
      console.log(`Fetching chart data for ${symbol} from Yahoo Finance (fallback)`);
      const yahooSymbol = symbol.includes('.NS') ? symbol : `${symbol}.NS`;
      const yahooInterval = days <= 7 ? '5m' : days <= 30 ? '1h' : '1d';
      const yahooRange = days <= 7 ? '5d' : days <= 30 ? '1mo' : days <= 180 ? '6mo' : days <= 365 ? '1y' : '5y';

      const yahooData = await fetchStockChart(yahooSymbol, yahooInterval, yahooRange);

      if (yahooData?.indicators?.quote?.[0]) {
        const quote = yahooData.indicators.quote[0];
        const timestamps = yahooData.timestamp || [];

        const processedData = timestamps.map((timestamp: number, index: number) => ({
          date: new Date(timestamp * 1000).toISOString().split('T')[0],
          price: quote.close[index] || 0,
          close: quote.close[index] || 0,
          open: quote.open[index] || 0,
          high: quote.high[index] || 0,
          low: quote.low[index] || 0,
          volume: quote.volume[index] || 0,
          dma50: null,
          dma200: null
        })).filter((item: any) => item.close > 0);

        chartData = {
          source: 'yahoo',
          period,
          data: processedData
        };
      }
    }

    if (!chartData || chartData.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chart data not found'
      });
    }

    res.status(200).json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
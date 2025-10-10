import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import StockActivity from '@/lib/models/StockActivity';
import EquityStock from '@/lib/models/EquityStock';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';
import axios from 'axios';

interface TickertapeActivityItem {
  headline: string;
  summary: string;
  date: string;
  feed_type: string;
  publisher: string;
  tag: string;
  version: string;
  link: string;
  imageUrl: string;
  stocks: Array<{ sid: string }>;
}

interface TickertapeResponse {
  success: boolean;
  data: {
    total: number;
    items: TickertapeActivityItem[];
  };
}

interface SyncResult {
  stockSymbol: string;
  status: 'success' | 'error';
  added: number;
  skipped: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<{
    results: SyncResult[];
    totalAdded: number;
    totalSkipped: number;
    totalErrors: number;
  }>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Verify JWT token - Admin only
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const decoded = AuthUtils.verifyAccessToken(token);
    if (!decoded || !['ADMIN', 'DATA_ENTRY'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    await connectDB();

    const {
      symbols = [],
      types = ['news-article', 'news-video'],
      count = 50,
      syncAll = false
    } = req.body;

    let stocksToSync: string[] = symbols;

    // If syncAll is true, fetch all active stocks
    if (syncAll) {
      const allStocks = await EquityStock.find({ isActive: true }).select('symbol');
      stocksToSync = allStocks.map(stock => stock.symbol);
    }

    if (stocksToSync.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No stocks to sync. Provide symbols array or set syncAll to true',
      });
    }

    const results: SyncResult[] = [];
    let totalAdded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process each stock
    for (const symbol of stocksToSync) {
      try {
        const result = await syncActivitiesForStock(symbol, types, count);
        results.push(result);

        if (result.status === 'success') {
          totalAdded += result.added;
          totalSkipped += result.skipped;
        } else {
          totalErrors++;
        }
      } catch (error: any) {
        results.push({
          stockSymbol: symbol,
          status: 'error',
          added: 0,
          skipped: 0,
          error: error.message || 'Unknown error'
        });
        totalErrors++;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        results,
        totalAdded,
        totalSkipped,
        totalErrors
      },
      message: `Synced ${stocksToSync.length} stocks: ${totalAdded} added, ${totalSkipped} skipped, ${totalErrors} errors`
    });

  } catch (error: any) {
    console.error('Sync activities error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync activities',
    });
  }
}

async function syncActivitiesForStock(
  symbol: string,
  types: string[],
  count: number
): Promise<SyncResult> {
  try {
    // Fetch data from Tickertape API
    // Note: Don't use 'types' parameter - API returns 400 error with it
    const url = `https://analyze.api.tickertape.in/v2/stocks/feed/${symbol}?offset=1&count=${count}`;

    const response = await axios.get<any>(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Note: API has typo "sucess" instead of "success"
    if (!response.data?.sucess || !response.data?.data?.items) {
      return {
        stockSymbol: symbol,
        status: 'error',
        added: 0,
        skipped: 0,
        error: 'Invalid API response'
      };
    }

    const items = response.data.data.items;
    let added = 0;
    let skipped = 0;

    // Process each activity
    for (const item of items) {
      try {
        // Check if activity already exists
        const exists = await StockActivity.findOne({
          stockSymbol: symbol,
          activityType: item.feed_type,
          headline: item.headline,
          publishedAt: new Date(item.date)
        });

        if (exists) {
          skipped++;
          continue;
        }

        // Create new activity
        await StockActivity.create({
          stockSymbol: symbol,
          activityType: item.feed_type,
          headline: item.headline,
          summary: item.summary,
          publishedAt: new Date(item.date),
          source: item.publisher,
          sourceUrl: item.link,
          imageUrl: item.imageUrl,
          tags: item.tag ? [item.tag] : [],
          feedType: item.feed_type,
          version: item.version,
          isActive: true
        });

        added++;
      } catch (error: any) {
        // If duplicate key error, skip
        if (error.code === 11000) {
          skipped++;
        } else {
          console.error(`Error processing item for ${symbol}:`, error);
        }
      }
    }

    return {
      stockSymbol: symbol,
      status: 'success',
      added,
      skipped
    };

  } catch (error: any) {
    console.error(`Error syncing activities for ${symbol}:`, error);
    return {
      stockSymbol: symbol,
      status: 'error',
      added: 0,
      skipped: 0,
      error: error.message || 'Failed to fetch from API'
    };
  }
}

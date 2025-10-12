import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth';
import EquityStock from '@/lib/models/EquityStock';
import StockActivity from '@/lib/models/StockActivity';
import axios from 'axios';

/**
 * Fetch dividends from Tickertape API
 */
async function fetchDividends(tickertapeSymbol: string, nseSymbol: string) {
  const url = `https://api.tickertape.in/stocks/corporates/dividends/${tickertapeSymbol}?count=10&offset=0`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (!response.data?.success || !response.data?.data) {
      return [];
    }

    const dividends = [...(response.data.data.upcoming || []), ...(response.data.data.past || [])];

    return dividends.map((div: any) => ({
      stockSymbol: nseSymbol,
      activityType: 'dividend',
      headline: `${div.subType} Dividend - ₹${div.value} per share`,
      summary: `<p><strong>Type:</strong> ${div.title}</p><p><strong>Amount:</strong> ₹${div.dividend} per share</p><p><strong>Ex-Date:</strong> ${new Date(div.exDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>`,
      publishedAt: new Date(div.exDate),
      source: 'Tickertape',
      sourceUrl: `https://www.tickertape.in/stocks/${tickertapeSymbol.toLowerCase()}`,
      isActive: true,
      metadata: {
        dividendAmount: div.dividend,
        dividendType: div.type,
        subType: div.subType,
        exDate: div.exDate
      }
    }));
  } catch (error) {
    console.error(`Error fetching dividends for ${tickertapeSymbol}:`, error);
    return [];
  }
}

/**
 * Fetch announcements from Tickertape API
 */
async function fetchAnnouncements(tickertapeSymbol: string, nseSymbol: string) {
  const url = `https://api.tickertape.in/stocks/corporates/announcements/${tickertapeSymbol}?count=10&offset=0`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (!response.data?.success || !response.data?.data) {
      return [];
    }

    const announcements = [...(response.data.data.upcoming || []), ...(response.data.data.past || [])];

    return announcements.map((ann: any) => ({
      stockSymbol: nseSymbol,
      activityType: 'announcement',
      headline: ann.subject || 'Company Announcement',
      summary: ann.description ? `<p>${ann.description.replace(/\n/g, '<br>')}</p>` : '',
      publishedAt: new Date(ann.broadcastTime),
      source: 'NSE/BSE',
      sourceUrl: ann.attachement || `https://www.tickertape.in/stocks/${tickertapeSymbol.toLowerCase()}`,
      isActive: true,
      metadata: {
        subject: ann.subject,
        broadcastTime: ann.broadcastTime,
        attachement: ann.attachement
      }
    }));
  } catch (error) {
    console.error(`Error fetching announcements for ${tickertapeSymbol}:`, error);
    return [];
  }
}

/**
 * Fetch legal orders from Tickertape API
 */
async function fetchLegalOrders(tickertapeSymbol: string, nseSymbol: string) {
  const url = `https://api.tickertape.in/stocks/corporates/legal/${tickertapeSymbol}?count=10&offset=0`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (!response.data?.success || !response.data?.data) {
      return [];
    }

    const legalOrders = [...(response.data.data.upcoming || []), ...(response.data.data.past || [])];

    return legalOrders.map((legal: any) => ({
      stockSymbol: nseSymbol,
      activityType: 'legal-order',
      headline: `Case ${legal.caseNo}: ${legal.desc}`,
      summary: `<p><strong>Case Number:</strong> ${legal.caseNo}</p><p><strong>Description:</strong> ${legal.desc}</p><p><strong>Source:</strong> ${legal.source}</p><p><strong>Order Date:</strong> ${new Date(legal.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>`,
      publishedAt: new Date(legal.orderDate),
      source: legal.source || 'Court',
      sourceUrl: legal.link || `https://www.tickertape.in/stocks/${tickertapeSymbol.toLowerCase()}`,
      isActive: true,
      metadata: {
        caseNo: legal.caseNo,
        orderDate: legal.orderDate,
        courtSource: legal.source
      }
    }));
  } catch (error) {
    console.error(`Error fetching legal orders for ${tickertapeSymbol}:`, error);
    return [];
  }
}

/**
 * POST /api/admin/stocks/corporate/sync
 * Sync corporate actions from Tickertape API
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Verify authentication and admin role
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decodedToken = AuthUtils.verifyAccessToken(token);
    if (!decodedToken || !['ADMIN', 'DATA_ENTRY'].includes(decodedToken.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await connectDB();

    const { symbol } = req.body;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ success: false, error: 'Symbol is required' });
    }

    const upperSymbol = symbol.toUpperCase();

    // Get stock info to fetch Tickertape symbol
    const stock = await EquityStock.findOne({ symbol: upperSymbol });

    if (!stock) {
      return res.status(404).json({ success: false, error: 'Stock not found' });
    }

    if (!stock.screenerId) {
      return res.status(400).json({ success: false, error: 'No Tickertape symbol mapping found. Please add screenerId first.' });
    }

    const tickertapeSymbol = stock.screenerId;

    // Fetch all corporate actions
    const [dividends, announcements, legalOrders] = await Promise.all([
      fetchDividends(tickertapeSymbol, upperSymbol),
      fetchAnnouncements(tickertapeSymbol, upperSymbol),
      fetchLegalOrders(tickertapeSymbol, upperSymbol)
    ]);

    const allActions = [...dividends, ...announcements, ...legalOrders];

    // Save to database
    let saved = 0;
    let skipped = 0;
    let errors = 0;

    for (const action of allActions) {
      try {
        await StockActivity.create(action);
        saved++;
      } catch (error: any) {
        if (error.code === 11000) {
          skipped++; // Duplicate
        } else {
          errors++;
          console.error('Error saving activity:', error.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        total: allActions.length,
        saved,
        skipped,
        errors,
        breakdown: {
          dividends: dividends.length,
          announcements: announcements.length,
          legalOrders: legalOrders.length
        }
      }
    });
  } catch (error: any) {
    console.error('Error syncing corporate actions:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { APIResponse } from '@/types';
import { fetchTop100MutualFunds } from '@/lib/amfi-api';
import { 
  fetchIndianMutualFunds, 
  getMutualFundCategories
} from '@/lib/indian-mutual-funds';

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
    
    const category = req.query.category as string;
    const limit = parseInt(req.query.limit as string) || 20;

    let query: any = {
      lastUpdated: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    };

    if (category) {
      query.category = category;
    }

    let mutualFunds;
    let categories;
    
    try {
      // Try to fetch real AMFI data
      const amfiFunds = await fetchTop100MutualFunds();
      
      // Filter by category if specified
      let filteredFunds = category 
        ? amfiFunds.filter(fund => fund.category === category)
        : amfiFunds;
      
      // Sort by 1-year returns and limit
      mutualFunds = filteredFunds
        .sort((a, b) => b.returns1Y - a.returns1Y)
        .slice(0, limit);
      
      // Get unique categories from AMFI data
      categories = Array.from(new Set(amfiFunds.map(fund => fund.category))).sort();
      
    } catch (error) {
      console.error('AMFI API failed:', error);
      throw new Error('Unable to fetch live mutual fund data from AMFI. Please try again later.');
    }

    res.status(200).json({
      success: true,
      data: {
        funds: mutualFunds,
        categories,
      },
    });
  } catch (error) {
    console.error('Error fetching mutual funds:', error);
    
    const errorMessage = error instanceof Error && error.message.includes('AMFI') 
      ? error.message 
      : 'Something went wrong while fetching mutual fund data. Please try again later.';
    
    res.status(503).json({
      success: false,
      error: errorMessage,
      code: 'API_UNAVAILABLE'
    });
  }
}
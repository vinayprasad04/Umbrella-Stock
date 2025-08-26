import { NextApiRequest, NextApiResponse } from 'next';
import { searchStocks, StockAPIError } from '@/lib/api-utils';
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
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long',
      });
    }

    const searchResults = await searchStocks(q.trim());
    
    const filteredResults = searchResults
      .filter((result: any) => result.type === 'Equity' && result.region === 'United States')
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: filteredResults,
    });
  } catch (error) {
    console.error('Error searching stocks:', error);
    
    if (error instanceof StockAPIError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { APIResponse } from '@/types';
import { fetchIndianETFs } from '@/lib/indian-mutual-funds';

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
    
    const limit = parseInt(req.query.limit as string) || 10;

    // Fetch Indian ETF data
    const etfs = await fetchIndianETFs(limit);

    res.status(200).json({
      success: true,
      data: etfs.map(etf => ({
        ...etf,
        lastUpdated: new Date()
      })),
    });
  } catch (error) {
    console.error('Error fetching ETFs:', error);
    
    res.status(503).json({
      success: false,
      error: 'Something went wrong while fetching ETF data. Please try again later.',
      code: 'API_UNAVAILABLE'
    });
  }
}
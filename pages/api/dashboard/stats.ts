import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import EquityStock from '@/lib/models/EquityStock';
import { APIResponse } from '@/types';

interface DashboardStats {
  totalStocks: number;
  totalSectors: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<DashboardStats>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    await connectDB();

    // Count total active stocks
    const totalStocks = await EquityStock.countDocuments({ isActive: true });

    // Get unique sectors count
    const sectors = await EquityStock.distinct('sector', { isActive: true });
    const totalSectors = sectors.filter(s => s && s.trim()).length;

    res.status(200).json({
      success: true,
      data: {
        totalStocks,
        totalSectors,
      },
    });
  } catch (error: any) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
    });
  }
}

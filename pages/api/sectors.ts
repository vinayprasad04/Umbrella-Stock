import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Sector from '@/models/Sector';
import { APIResponse } from '@/types';

const SECTORS_DATA = [
  {
    name: 'Information Technology',
    performance: 3.25,
    stockCount: 125,
    topStocks: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM'],
  },
  {
    name: 'Banking & Financial Services',
    performance: 1.87,
    stockCount: 95,
    topStocks: ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'SBIN', 'AXISBANK'],
  },
  {
    name: 'Healthcare & Pharmaceuticals',
    performance: 2.14,
    stockCount: 85,
    topStocks: ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'LUPIN'],
  },
  {
    name: 'Consumer Goods',
    performance: 1.45,
    stockCount: 75,
    topStocks: ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'DABUR'],
  },
  {
    name: 'Automotive',
    performance: 0.98,
    stockCount: 60,
    topStocks: ['MARUTI', 'M&M', 'TATAMOTORS', 'BAJAJ-AUTO', 'HEROMOTOCO'],
  },
  {
    name: 'Energy & Power',
    performance: 0.67,
    stockCount: 55,
    topStocks: ['RELIANCE', 'ONGC', 'IOC', 'BPCL', 'POWERGRID'],
  },
  {
    name: 'Metals & Mining',
    performance: -0.45,
    stockCount: 45,
    topStocks: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'COALINDIA'],
  },
  {
    name: 'Telecom',
    performance: -1.23,
    stockCount: 25,
    topStocks: ['BHARTIARTL', 'IDEA', 'BSNL', 'RJIO', 'TTML'],
  },
  {
    name: 'Infrastructure',
    performance: 1.76,
    stockCount: 70,
    topStocks: ['LT', 'ULTRACEMCO', 'GRASIM', 'ACC', 'AMBUJACEMENT'],
  },
  {
    name: 'Textiles',
    performance: 0.34,
    stockCount: 40,
    topStocks: ['RTNPOWER', 'WELSPUNIND', 'VARDHMAN', 'TRIDENT', 'CENTURYTEX'],
  },
];

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
    
    let sectors = await Sector
      .find({
        lastUpdated: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      })
      .sort({ performance: -1 })
      .lean();

    if (sectors.length === 0) {
      const sectorPromises = SECTORS_DATA.map(sectorData =>
        Sector.findOneAndUpdate(
          { name: sectorData.name },
          {
            ...sectorData,
            lastUpdated: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      );

      sectors = await Promise.all(sectorPromises);
      sectors.sort((a, b) => b.performance - a.performance);
    }

    res.status(200).json({
      success: true,
      data: sectors,
    });
  } catch (error) {
    console.error('Error fetching sectors:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Sector from '@/models/Sector';
import { APIResponse } from '@/types';

const SECTORS_DATA = [
  {
    name: 'Technology',
    performance: 2.45,
    stockCount: 150,
    topStocks: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META'],
  },
  {
    name: 'Healthcare',
    performance: 1.23,
    stockCount: 120,
    topStocks: ['JNJ', 'PFE', 'UNH', 'ABBV', 'TMO'],
  },
  {
    name: 'Financial Services',
    performance: -0.87,
    stockCount: 100,
    topStocks: ['JPM', 'BAC', 'WFC', 'GS', 'MS'],
  },
  {
    name: 'Consumer Cyclical',
    performance: 0.56,
    stockCount: 95,
    topStocks: ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE'],
  },
  {
    name: 'Communication Services',
    performance: -1.34,
    stockCount: 45,
    topStocks: ['META', 'GOOGL', 'NFLX', 'DIS', 'CMCSA'],
  },
  {
    name: 'Industrial',
    performance: 0.23,
    stockCount: 85,
    topStocks: ['BA', 'HON', 'UPS', 'CAT', 'MMM'],
  },
  {
    name: 'Consumer Defensive',
    performance: 0.78,
    stockCount: 70,
    topStocks: ['PG', 'KO', 'PEP', 'WMT', 'COST'],
  },
  {
    name: 'Energy',
    performance: -2.15,
    stockCount: 55,
    topStocks: ['XOM', 'CVX', 'COP', 'EOG', 'SLB'],
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
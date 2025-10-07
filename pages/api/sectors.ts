import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualStockDetail from '@/lib/models/ActualStockDetail';
import { APIResponse } from '@/types';

interface SectorData {
  name: string;
  performance: number;
  stockCount: number;
  topStocks: Array<{
    symbol: string;
    companyName: string;
    marketCap: number;
    currentPrice: number;
  }>;
  totalMarketCap: number;
  avgMarketCap: number;
  lastUpdated: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<SectorData[]>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    await connectDB();

    // Aggregate sectors from actualstockdetails collection
    const sectors = await ActualStockDetail.aggregate([
      {
        $match: {
          'additionalInfo.sector': { $exists: true, $ne: null, $nin: ['Banks', 'Unknown'] },
          'ratios.Market Cap': { $exists: true, $ne: null },
          isActive: true,
          $expr: { $ne: ['$additionalInfo.sector', ''] }
        }
      },
      {
        $addFields: {
          marketCapCleaned: {
            $cond: [
              { $eq: [{ $type: '$ratios.Market Cap' }, 'string'] },
              {
                $replaceAll: {
                  input: {
                    $replaceAll: {
                      input: {
                        $replaceAll: {
                          input: {
                            $replaceAll: {
                              input: {
                                $replaceAll: {
                                  input: { $toString: '$ratios.Market Cap' },
                                  find: '₹',
                                  replacement: ''
                                }
                              },
                              find: ' Cr.',
                              replacement: ''
                            }
                          },
                          find: ' Cr',
                          replacement: ''
                        }
                      },
                      find: ',',
                      replacement: ''
                    }
                  },
                  find: ' ',
                  replacement: ''
                }
              },
              { $toString: '$ratios.Market Cap' }
            ]
          }
        }
      },
      {
        $addFields: {
          marketCapNumeric: {
            $cond: [
              {
                $and: [
                  { $ne: ['$marketCapCleaned', ''] },
                  { $ne: ['$marketCapCleaned', null] },
                  { $regexMatch: { input: '$marketCapCleaned', regex: '^[0-9.]+$' } }
                ]
              },
              { $toDouble: '$marketCapCleaned' },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: '$additionalInfo.sector',
          stockCount: { $sum: 1 },
          totalMarketCap: { $sum: '$marketCapNumeric' },
          avgMarketCap: { $avg: '$marketCapNumeric' },
          stocks: {
            $push: {
              symbol: '$symbol',
              companyName: '$companyName',
              marketCap: '$marketCapNumeric',
              currentPrice: '$meta.currentPrice'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          stockCount: 1,
          totalMarketCap: 1,
          avgMarketCap: 1,
          stocks: 1
        }
      },
      {
        $sort: { totalMarketCap: -1 }
      }
    ]);

    // Process each sector to get top 5 stocks by market cap
    const sectorsWithTopStocks: SectorData[] = sectors.map((sector: any) => {
      // Sort stocks by market cap and take top 5
      const topStocks = sector.stocks
        .filter((stock: any) => stock.marketCap && stock.marketCap > 0)
        .sort((a: any, b: any) => b.marketCap - a.marketCap)
        .slice(0, 5);

      return {
        name: sector.name,
        stockCount: sector.stockCount,
        topStocks: topStocks,
        totalMarketCap: sector.totalMarketCap || 0,
        avgMarketCap: sector.avgMarketCap || 0,
        performance: 0, // Will be calculated later when we have price data
        lastUpdated: new Date()
      };
    });

    res.status(200).json({
      success: true,
      data: sectorsWithTopStocks,
    });
  } catch (error) {
    console.error('Error fetching sectors:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
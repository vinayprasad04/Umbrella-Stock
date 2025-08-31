import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import EquityStock from '@/lib/models/EquityStock';
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
    await connectDB();
    
    const { q, limit = 10, series } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 1) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required and must be at least 1 character',
      });
    }
    
    const searchQuery = q.trim();
    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    
    // Build search filter
    const filter: any = {
      isActive: true,
      $or: [
        { symbol: { $regex: searchQuery, $options: 'i' } },
        { companyName: { $regex: searchQuery, $options: 'i' } }
      ]
    };
    
    // Add optional filters
    if (series && series !== 'all') {
      filter.series = series;
    }
    
    // Search with multiple strategies for best results
    let results = [];
    
    // 1. Exact symbol match (highest priority)
    const exactMatch = await EquityStock
      .find({
        ...filter,
        symbol: { $regex: `^${searchQuery}$`, $options: 'i' }
      })
      .limit(5)
      .select('symbol companyName series isinNumber dateOfListing')
      .lean();
    
    results.push(...exactMatch);
    
    // 2. Symbol starts with query
    if (results.length < limitNum) {
      const symbolStartsWith = await EquityStock
        .find({
          ...filter,
          symbol: { $regex: `^${searchQuery}`, $options: 'i' },
          _id: { $nin: results.map(r => r._id) }
        })
        .limit(limitNum - results.length)
        .select('symbol companyName series isinNumber dateOfListing')
        .lean();
      
      results.push(...symbolStartsWith);
    }
    
    // 3. Company name starts with query
    if (results.length < limitNum) {
      const companyStartsWith = await EquityStock
        .find({
          ...filter,
          companyName: { $regex: `^${searchQuery}`, $options: 'i' },
          _id: { $nin: results.map(r => r._id) }
        })
        .limit(limitNum - results.length)
        .select('symbol companyName series isinNumber dateOfListing')
        .lean();
      
      results.push(...companyStartsWith);
    }
    
    // 4. General text search for remaining slots
    if (results.length < limitNum) {
      const textSearch = await EquityStock
        .find({
          ...filter,
          _id: { $nin: results.map(r => r._id) }
        })
        .limit(limitNum - results.length)
        .select('symbol companyName series isinNumber dateOfListing')
        .lean();
      
      results.push(...textSearch);
    }
    
    res.status(200).json({
      success: true,
      data: results.slice(0, limitNum).map(stock => ({
        symbol: stock.symbol,
        companyName: stock.companyName,
        series: stock.series,
        isinNumber: stock.isinNumber,
        dateOfListing: stock.dateOfListing,
        type: 'equity'
      })),
    });
  } catch (error) {
    console.error('Error searching equity stocks:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to search equity stocks',
      code: 'SEARCH_ERROR'
    });
  }
}
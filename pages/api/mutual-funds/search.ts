import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import MutualFund from '@/lib/models/MutualFund';
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
    
    const { q, limit = 10, category, fundHouse } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required and must be at least 2 characters',
      });
    }
    
    const searchQuery = q.trim();
    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    
    // Build search filter
    const filter: any = {
      isActive: true,
      $text: { $search: searchQuery }
    };
    
    // Add optional filters
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (fundHouse && fundHouse !== 'all') {
      filter.fundHouse = fundHouse;
    }
    
    // Search with text score for relevance
    const results = await MutualFund
      .find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limitNum)
      .select('schemeCode schemeName fundHouse category nav returns1Y returns3Y returns5Y expenseRatio aum')
      .lean();
    
    // If text search returns few results, fallback to regex search
    if (results.length < limitNum / 2) {
      const regexFilter: any = {
        isActive: true,
        schemeName: { $regex: searchQuery, $options: 'i' }
      };
      
      if (category && category !== 'all') {
        regexFilter.category = category;
      }
      
      if (fundHouse && fundHouse !== 'all') {
        regexFilter.fundHouse = fundHouse;
      }
      
      const regexResults = await MutualFund
        .find(regexFilter)
        .limit(limitNum - results.length)
        .select('schemeCode schemeName fundHouse category nav returns1Y returns3Y returns5Y expenseRatio aum')
        .lean();
      
      // Merge results, avoiding duplicates
      const existingCodes = new Set(results.map(r => r.schemeCode));
      const additionalResults = regexResults.filter(r => !existingCodes.has(r.schemeCode));
      results.push(...additionalResults);
    }
    
    // If still no results, provide intelligent suggestions
    if (results.length === 0) {
      // Extract potential fund house from search query
      const searchWords = searchQuery.toLowerCase().split(' ');
      const commonFundHouses = ['axis', 'sbi', 'hdfc', 'icici', 'aditya birla', 'reliance', 'kotak', 'franklin', 'dsp', 'nippon'];
      
      let detectedFundHouse = null;
      for (const house of commonFundHouses) {
        if (searchWords.some(word => house.includes(word) || word.includes(house.split(' ')[0]))) {
          detectedFundHouse = house;
          break;
        }
      }
      
      // First priority: Same fund house suggestions
      if (detectedFundHouse) {
        const sameFundHouseSuggestions = await MutualFund
          .find({
            isActive: true,
            fundHouse: { $regex: detectedFundHouse, $options: 'i' }
          })
          .sort({ returns1Y: -1 })
          .limit(5)
          .select('schemeCode schemeName fundHouse category nav returns1Y returns3Y returns5Y expenseRatio aum')
          .lean();
        
        if (sameFundHouseSuggestions.length > 0) {
          results.push(...sameFundHouseSuggestions);
        }
      }
      
      // Second priority: Similar category suggestions if still no results
      if (results.length === 0) {
        const categoryKeywords = {
          'equity': ['equity', 'stock', 'growth'],
          'debt': ['debt', 'bond', 'income', 'fixed'],
          'hybrid': ['hybrid', 'balanced', 'allocation'],
          'elss': ['elss', 'tax', '80c']
        };
        
        let detectedCategory = null;
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(keyword => searchQuery.toLowerCase().includes(keyword))) {
            detectedCategory = category;
            break;
          }
        }
        
        if (detectedCategory) {
          const categoryFilter = detectedCategory === 'elss' 
            ? { schemeName: { $regex: 'elss|tax', $options: 'i' } }
            : { category: { $regex: detectedCategory, $options: 'i' } };
            
          const categorySuggestions = await MutualFund
            .find({
              isActive: true,
              ...categoryFilter
            })
            .sort({ returns1Y: -1 })
            .limit(limitNum)
            .select('schemeCode schemeName fundHouse category nav returns1Y returns3Y returns5Y expenseRatio aum')
            .lean();
          
          results.push(...categorySuggestions);
        }
      }
      
      // Third priority: Popular funds if still no results
      if (results.length === 0) {
        const popularFunds = await MutualFund
          .find({ isActive: true })
          .sort({ returns1Y: -1, aum: -1 })
          .limit(limitNum)
          .select('schemeCode schemeName fundHouse category nav returns1Y returns3Y returns5Y expenseRatio aum')
          .lean();
        
        results.push(...popularFunds);
      }
    }
    
    res.status(200).json({
      success: true,
      data: results.map(fund => ({
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        fundHouse: fund.fundHouse,
        category: fund.category,
        nav: fund.nav,
        returns1Y: fund.returns1Y,
        returns3Y: fund.returns3Y,
        returns5Y: fund.returns5Y,
        expenseRatio: fund.expenseRatio,
        aum: fund.aum
      })),
    });
  } catch (error) {
    console.error('Error searching mutual funds:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to search mutual funds',
      code: 'SEARCH_ERROR'
    });
  }
}
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import EquityStock from '@/lib/models/EquityStock';
import ActualStockDetail from '@/lib/models/ActualStockDetail';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

interface SearchResult {
  symbol: string;
  name: string;
  type: 'STOCK' | 'MUTUAL_FUND';
  sector?: string;
  description?: string;
  isVerified?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<SearchResult[]>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  // Verify authentication
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const decoded = AuthUtils.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    await connectDB();

    const { q } = req.query;
    const query = q as string;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    const searchTerm = query.trim();
    const results: SearchResult[] = [];

    // Create more flexible search patterns
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 1);
    const searchPatterns = [
      searchTerm, // Exact phrase
      ...searchWords // Individual words
    ];

    // Search stocks with multiple patterns for better matching
    const stockFilter = {
      $or: [
        // Symbol matches
        { symbol: { $regex: searchTerm, $options: 'i' } },
        // Company name matches (exact phrase)
        { companyName: { $regex: searchTerm, $options: 'i' } },
        // Company name matches (all words present)
        ...(searchWords.length > 1 ? [{
          $and: searchWords.map(word => ({
            companyName: { $regex: word, $options: 'i' }
          }))
        }] : [])
      ],
      isActive: true
    };

    console.log('Search filter for:', searchTerm, stockFilter);

    const stocks = await EquityStock.find(stockFilter)
      .select('symbol companyName series')
      .limit(30)
      .lean();

    console.log(`Found ${stocks.length} stocks for search term: ${searchTerm}`);
    if (stocks.length > 0) {
      console.log('Sample results:', stocks.slice(0, 3).map(s => ({ symbol: s.symbol, name: s.companyName })));
    }

    // If no stocks found from database, provide some common stock results as fallback
    const commonStocks = [
      { symbol: 'KOTAKBANK', companyName: 'Kotak Mahindra Bank Limited' },
      { symbol: 'HDFCBANK', companyName: 'HDFC Bank Limited' },
      { symbol: 'ICICIBANK', companyName: 'ICICI Bank Limited' },
      { symbol: 'SBIN', companyName: 'State Bank of India' },
      { symbol: 'AXISBANK', companyName: 'Axis Bank Limited' },
      { symbol: 'INDUSINDBK', companyName: 'IndusInd Bank Limited' },
      { symbol: 'RELIANCE', companyName: 'Reliance Industries Limited' },
      { symbol: 'TCS', companyName: 'Tata Consultancy Services Limited' },
      { symbol: 'INFY', companyName: 'Infosys Limited' },
      { symbol: 'WIPRO', companyName: 'Wipro Limited' },
      { symbol: 'LT', companyName: 'Larsen & Toubro Limited' },
      { symbol: 'BHARTIARTL', companyName: 'Bharti Airtel Limited' },
      { symbol: 'MARUTI', companyName: 'Maruti Suzuki India Limited' },
      { symbol: 'BAJFINANCE', companyName: 'Bajaj Finance Limited' },
      { symbol: 'TATAMOTORS', companyName: 'Tata Motors Limited' }
    ];

    // If no stocks found in database, search in common stocks
    let fallbackStocks: any[] = [];
    if (stocks.length === 0) {
      fallbackStocks = commonStocks.filter(stock => {
        const symbolMatch = stock.symbol.toLowerCase().includes(searchTerm.toLowerCase());
        const nameMatch = stock.companyName.toLowerCase().includes(searchTerm.toLowerCase());
        const wordsMatch = searchWords.length > 1 ? 
          searchWords.every(word => stock.companyName.toLowerCase().includes(word.toLowerCase())) : 
          false;
        return symbolMatch || nameMatch || wordsMatch;
      });
      console.log(`Using fallback stocks, found ${fallbackStocks.length} matches`);
    }

    const stocksToProcess = stocks.length > 0 ? stocks : fallbackStocks;

    // Get verified status for stocks
    const stockSymbols = stocksToProcess.map(s => s.symbol);
    const verifiedStocks = await ActualStockDetail.find({
      symbol: { $in: stockSymbols },
      dataQuality: 'VERIFIED',
      isActive: true
    }).select('symbol additionalInfo').lean();

    const verifiedStocksMap = new Map();
    verifiedStocks.forEach(vs => {
      verifiedStocksMap.set(vs.symbol, vs);
    });

    // Add stocks to results
    stocksToProcess.forEach(stock => {
      const verified = verifiedStocksMap.get(stock.symbol);
      results.push({
        symbol: stock.symbol,
        name: stock.companyName,
        type: 'STOCK',
        sector: verified?.additionalInfo?.sector,
        description: verified?.additionalInfo?.description,
        isVerified: !!verified
      });
    });

    // Search mutual funds (expanded list with popular funds)
    const commonMutualFunds = [
      // SBI Funds
      { symbol: '120503', name: 'SBI Bluechip Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '120305', name: 'SBI Large & Midcap Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '120577', name: 'SBI Small Cap Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      
      // HDFC Funds
      { symbol: '119551', name: 'HDFC Index Fund Sensex Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '118556', name: 'HDFC Equity Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '118825', name: 'HDFC Mid-Cap Opportunities Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      
      // Axis Funds
      { symbol: '120716', name: 'Axis Bluechip Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '120578', name: 'Axis Long Term Equity Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      
      // ICICI Prudential Funds
      { symbol: '118989', name: 'ICICI Prudential Bluechip Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '120344', name: 'ICICI Prudential Technology Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      
      // Kotak Funds
      { symbol: '118772', name: 'Kotak Standard Multicap Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '118742', name: 'Kotak Equity Opportunities Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '120472', name: 'Kotak Bluechip Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '118965', name: 'Kotak Small Cap Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      
      // Other Popular Funds
      { symbol: '119200', name: 'Mirae Asset Large Cap Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '125494', name: 'Parag Parikh Long Term Equity Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '120505', name: 'UTI Nifty Fund Direct Growth', type: 'MUTUAL_FUND' as const },
      { symbol: '119174', name: 'DSP Midcap Fund Direct Growth', type: 'MUTUAL_FUND' as const },
    ];

    // Improved mutual fund search with flexible matching
    const matchingMutualFunds = commonMutualFunds.filter(mf => {
      const symbolMatch = mf.symbol.includes(searchTerm);
      const nameMatch = mf.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Check if all search words are present in the name
      const wordsMatch = searchWords.length > 1 ? 
        searchWords.every(word => mf.name.toLowerCase().includes(word.toLowerCase())) : 
        false;
      
      return symbolMatch || nameMatch || wordsMatch;
    });

    console.log(`Found ${matchingMutualFunds.length} mutual funds for search term: ${searchTerm}`);

    results.push(...matchingMutualFunds.map(mf => ({
      symbol: mf.symbol,
      name: mf.name,
      type: mf.type,
      description: 'Mutual Fund investment option'
    })));

    // Sort results by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aExactSymbol = a.symbol.toLowerCase() === searchTerm.toLowerCase();
      const bExactSymbol = b.symbol.toLowerCase() === searchTerm.toLowerCase();
      
      if (aExactSymbol && !bExactSymbol) return -1;
      if (!aExactSymbol && bExactSymbol) return 1;
      
      const aStartsWithSymbol = a.symbol.toLowerCase().startsWith(searchTerm.toLowerCase());
      const bStartsWithSymbol = b.symbol.toLowerCase().startsWith(searchTerm.toLowerCase());
      
      if (aStartsWithSymbol && !bStartsWithSymbol) return -1;
      if (!aStartsWithSymbol && bStartsWithSymbol) return 1;
      
      return a.symbol.localeCompare(b.symbol);
    });

    res.status(200).json({
      success: true,
      data: results.slice(0, 10), // Limit to top 10 results
    });

  } catch (error: any) {
    console.error('❌ Search API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
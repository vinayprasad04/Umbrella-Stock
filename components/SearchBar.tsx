'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { NIFTY_50_STOCKS } from '@/lib/nifty50-symbols';

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  matchScore: number;
}

interface StockData {
  symbol: string;
  name: string;
  logo: string;
  sector: string;
  exchange: string;
  price: string;
}

interface MutualFundData {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  category: string;
  nav?: number;
  returns1Y?: number;
  returns3Y?: number;
  returns5Y?: number;
  expenseRatio?: number;
  aum?: number;
}

interface EquityStockData {
  symbol: string;
  companyName: string;
  series: string;
  isinNumber: string;
  dateOfListing: string;
  type: string;
}

const indianStocks: StockData[] = NIFTY_50_STOCKS.map(stock => ({
  symbol: stock.symbol,
  name: stock.name,
  logo: stock.symbol.substring(0, 2),
  sector: stock.sector || 'Other',
  exchange: 'NSE',
  price: '₹0.00'
}));

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<StockData[]>([]);
  const [mutualFundResults, setMutualFundResults] = useState<MutualFundData[]>([]);
  const [equityResults, setEquityResults] = useState<EquityStockData[]>([]);
  const [searchType, setSearchType] = useState<'all' | 'stocks' | 'mutual-funds' | 'equity'>('all');
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Mutual funds search query
  const { data: mutualFundsData, isLoading: isMutualFundsLoading } = useQuery({
    queryKey: ['mutual-funds-search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const response = await axios.get(`/api/mutual-funds/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
      return response.data.success ? response.data.data : [];
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Equity stocks search query
  const { data: equityData, isLoading: isEquityLoading } = useQuery({
    queryKey: ['equity-search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 1) return [];
      const response = await axios.get(`/api/equity/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
      return response.data.success ? response.data.data : [];
    },
    enabled: searchQuery.length >= 1,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Search functionality
  useEffect(() => {
    if (searchQuery.length >= 1) {
      // Filter out common generic terms that don't help with stock identification
      const genericTerms = ['stock', 'stocks', 'share', 'shares', 'company', 'ltd', 'limited', 'corporation', 'corp'];
      const searchTerms = searchQuery.toLowerCase().split(' ')
        .filter(term => term.length > 0 && !genericTerms.includes(term));
      
      const filteredStocks = indianStocks.filter(stock => {
        const symbolLower = stock.symbol.toLowerCase();
        const nameLower = stock.name.toLowerCase();
        const sectorLower = stock.sector.toLowerCase();
        
        // Check if all search terms are found in symbol, name, or sector
        return searchTerms.every(term => 
          symbolLower.includes(term) ||
          nameLower.includes(term) ||
          sectorLower.includes(term)
        ) || 
        // Or if any single term matches the symbol exactly (for cases like "hdfcbank" when searching "hdfc bank")
        searchTerms.some(term => symbolLower.includes(term.replace(/\s/g, ''))) ||
        // Or if the full search query (without spaces) matches symbol
        symbolLower.includes(searchQuery.toLowerCase().replace(/\s/g, ''));
      })
      .sort((a, b) => {
        // Prioritize exact symbol matches
        const aSymbolMatch = a.symbol.toLowerCase() === searchQuery.toLowerCase().replace(/\s/g, '');
        const bSymbolMatch = b.symbol.toLowerCase() === searchQuery.toLowerCase().replace(/\s/g, '');
        if (aSymbolMatch && !bSymbolMatch) return -1;
        if (!aSymbolMatch && bSymbolMatch) return 1;
        
        // Then prioritize symbol starts with
        const aSymbolStarts = a.symbol.toLowerCase().startsWith(searchQuery.toLowerCase().replace(/\s/g, ''));
        const bSymbolStarts = b.symbol.toLowerCase().startsWith(searchQuery.toLowerCase().replace(/\s/g, ''));
        if (aSymbolStarts && !bSymbolStarts) return -1;
        if (!aSymbolStarts && bSymbolStarts) return 1;
        
        // Then prioritize name starts with
        const aNameStarts = a.name.toLowerCase().startsWith(searchQuery.toLowerCase());
        const bNameStarts = b.name.toLowerCase().startsWith(searchQuery.toLowerCase());
        if (aNameStarts && !bNameStarts) return -1;
        if (!aNameStarts && bNameStarts) return 1;
        
        return 0;
      })
      .slice(0, searchType === 'all' ? 3 : 8);
      setSearchResults(filteredStocks);

      if (mutualFundsData) {
        setMutualFundResults(mutualFundsData.slice(0, searchType === 'all' ? 3 : 8));
      }

      if (equityData) {
        setEquityResults(equityData.slice(0, searchType === 'all' ? 3 : 8));
      }
    } else {
      setSearchResults([]);
      setMutualFundResults([]);
      setEquityResults([]);
    }
  }, [searchQuery, mutualFundsData, equityData, searchType]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStockSelect = (stock: StockData) => {
    router.push(`/stocks/${stock.symbol}`);
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  const handleMutualFundSelect = (fund: MutualFundData) => {
    router.push(`/mutual-funds/${fund.schemeCode}`);
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  const handleEquitySelect = (equity: EquityStockData) => {
    router.push(`/stocks/${equity.symbol}`);
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={`relative transition-all duration-500 ease-out w-full max-w-2xl mx-auto`}>
      <div className={`absolute inset-0 bg-gradient-to-r from-[#FF6B2C] to-blue-600 rounded-xl md:rounded-2xl blur transition-all duration-500 ${
        isSearchFocused ? 'opacity-40' : 'opacity-20'
      }`}></div>
      <div className={`relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl md:rounded-2xl shadow-2xl transition-all duration-500 ${
        isSearchFocused ? 'border-[#FF6B2C]/30 bg-white/90' : ''
      }`}>
        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 ${
          isSearchFocused ? 'text-[#FF6B2C]' : 'text-gray-400'
        }`}>
          <svg className="h-5 w-5 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search stocks, mutual funds, ETFs..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => {
            // Delay blur to allow clicking on suggestions
            setTimeout(() => setIsSearchFocused(false), 150);
          }}
          className="w-full pl-10 md:pl-12 pr-12 md:pr-14 py-2 md:py-3 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-sm md:text-base font-medium transition-all duration-500"
        />
        <div className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-all duration-300 ${
          isSearchFocused ? 'text-[#FF6B2C]' : 'text-gray-400'
        }`}>
          <span className="text-lg">⌘</span>
          <span className="text-sm ml-1">K</span>
        </div>
      </div>
      
      {/* Search Dropdown (appears when focused) */}
      {isSearchFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg md:rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-300 z-[100] w-full md:w-[150%] max-h-[80vh]">
          <div className="p-4">
            {searchQuery && (searchResults.length > 0 || mutualFundResults.length > 0 || equityResults.length > 0) ? (
              // Search Results Layout - Table Style
              <>
                {/* Search Type Filter */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                  <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                    <button
                      onClick={() => setSearchType('all')}
                      className={`text-xs px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                        searchType === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All ({searchResults.length + mutualFundResults.length + equityResults.length})
                    </button>
                    <button
                      onClick={() => setSearchType('stocks')}
                      className={`text-xs px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                        searchType === 'stocks' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Nifty 50 ({searchResults.length})
                    </button>
                    <button
                      onClick={() => setSearchType('equity')}
                      className={`text-xs px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                        searchType === 'equity' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Equity Stocks ({equityResults.length})
                    </button>
                    <button
                      onClick={() => setSearchType('mutual-funds')}
                      className={`text-xs px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                        searchType === 'mutual-funds' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Mutual Funds ({mutualFundResults.length})
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 px-3 py-1">
                    {(isMutualFundsLoading || isEquityLoading) ? 'Loading...' : `Showing results for "${searchQuery}"`}
                  </div>
                </div>
                <div className="max-h-60 md:max-h-80 overflow-y-auto">
                  <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                    {/* Show equity stocks if searchType is 'all' or 'equity' */}
                    {(searchType === 'all' || searchType === 'equity') && equityResults.map((equity, index) => (
                      <div 
                        key={`equity-${index}`} 
                        className="flex items-center justify-between p-2 md:p-4 border-b border-gray-100 last:border-b-0 hover:bg-orange-50 cursor-pointer transition-all duration-200"
                        onMouseDown={() => handleEquitySelect(equity)}
                      >
                        <div className="flex items-center gap-2 md:gap-4 flex-1">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs md:text-sm font-bold">
                              {equity.symbol.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* First line: Name and Price/Exchange */}
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900 text-xs sm:text-sm md:text-base w-4/5 truncate">{equity.symbol}</span>
                              <div className="text-right w-1/5 flex-shrink-0">
                                <div className="text-xs sm:text-sm md:text-lg font-bold text-gray-900">NSE</div>
                              </div>
                            </div>
                            {/* Second line: Fund house, category, subcategory */}
                            <div className="flex items-center gap-1 md:gap-2 mt-1">
                              <div className="text-xs text-gray-600 truncate">{equity.companyName}</div>
                              <span className="text-xs bg-orange-100 text-orange-800 px-1 md:px-2 py-1 rounded-full font-medium">
                                Equity
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-1 md:px-2 py-1 rounded-full">
                                {equity.series}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show stocks if searchType is 'all' or 'stocks' */}
                    {(searchType === 'all' || searchType === 'stocks') && searchResults.map((stock, index) => (
                      <div 
                        key={`stock-${index}`} 
                        className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                        onMouseDown={() => handleStockSelect(stock)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white text-sm font-bold">
                              {stock.logo}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* First line: Name and Price */}
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900 text-base w-4/5 truncate">{stock.symbol}</span>
                              {stock.price && stock.price !== '₹0.00' && (
                                <div className="text-right w-1/5 flex-shrink-0">
                                  <div className="text-lg font-bold text-gray-900">{stock.price}</div>
                                </div>
                              )}
                            </div>
                            {/* Second line: Company name, category, sector */}
                            <div className="flex items-center gap-2 mt-1">
                              <div className="text-sm text-gray-600 truncate">{stock.name}</div>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                Stock
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {stock.sector}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show mutual funds if searchType is 'all' or 'mutual-funds' */}
                    {(searchType === 'all' || searchType === 'mutual-funds') && mutualFundResults.map((fund, index) => (
                      <div 
                        key={`fund-${index}`} 
                        className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-green-50 cursor-pointer transition-all duration-200"
                        onMouseDown={() => handleMutualFundSelect(fund)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">
                              {fund.fundHouse.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* First line: Fund Name and NAV */}
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900 text-sm leading-tight w-4/5 truncate">
                                {fund.schemeName}
                              </span>
                              {fund.nav && fund.nav > 0 && (
                                <div className="text-right w-1/5 flex-shrink-0 ml-2">
                                  <div className="text-lg font-bold text-gray-900">
                                    ₹{fund.nav.toFixed(2)}
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Second line: Fund house, category, subcategory */}
                            <div className="flex items-center gap-2 mt-1">
                              <div className="text-sm text-gray-600 truncate">{fund.fundHouse}</div>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                Mutual Fund
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {fund.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : searchQuery && searchResults.length === 0 && mutualFundResults.length === 0 && equityResults.length === 0 && !isMutualFundsLoading && !isEquityLoading ? (
              // No Results Layout
              <>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
                  <p className="text-gray-600 mb-1">No results found matching &quot;{searchQuery}&quot;</p>
                  <p className="text-sm text-gray-500">Try searching for a stock symbol, company name, mutual fund name, fund house, or equity stock</p>
                </div>
              </>
            ) : (
              // Quick Access Layout - Grid Style
              <>
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Quick Access</h3>
                  <p className="text-xs text-gray-500">Popular stocks and trending searches</p>
                </div>
                
                {/* Popular Categories */}
                <div className="mb-6">
                  <div className="text-xs font-medium text-gray-700 mb-2">Popular Searches</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['RELIANCE', 'TCS', 'HDFC', 'ICICI', 'Banking', 'IT Services', 'Large Cap', 'SBI'].map((category) => (
                      <button 
                        key={category} 
                        onClick={() => setSearchQuery(category)}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Stocks Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN'].map((symbol) => {
                    const stock = indianStocks.find(s => s.symbol === symbol);
                    return stock ? (
                      <div 
                        key={symbol} 
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                        onMouseDown={() => handleStockSelect(stock)}
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-white text-xs font-bold">
                            {stock.logo}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm text-left">{stock.symbol}</div>
                          <div className="text-xs text-gray-500 truncate text-left">{stock.name}</div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
                
                {/* Quick Links */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/" className="text-left p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-medium text-gray-900">📊 Market Overview</div>
                      <div className="text-xs text-gray-500">View all indices</div>
                    </Link>
                    <Link href="/mutual-funds" className="text-left p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-medium text-gray-900">📈 Mutual Funds</div>
                      <div className="text-xs text-gray-500">Browse all funds</div>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
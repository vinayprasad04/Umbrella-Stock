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
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Search functionality
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const filteredResults = indianStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.sector.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8);
      setSearchResults(filteredResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStockSelect = (stock: StockData) => {
    router.push(`/stocks/${stock.symbol}`);
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
    <div ref={searchRef} className={`relative transition-all duration-500 ease-out`}>
      <div className={`absolute inset-0 bg-gradient-to-r from-[#FF6B2C] to-blue-600 rounded-2xl blur transition-all duration-500 ${
        isSearchFocused ? 'opacity-40' : 'opacity-20'
      }`}></div>
      <div className={`relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl transition-all duration-500 ${
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
          className="w-full pl-12 pr-14 py-3 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-base font-medium transition-all duration-500"
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 overflow-hidden animate-in slide-in-from-top-2 duration-300 z-[100]">
          <div className="p-4">
            {searchQuery && searchResults.length > 0 ? (
              // Search Results Layout - Table Style
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-bold text-gray-900">
                    Search Results ({searchResults.length})
                  </div>
                  <div className="text-xs text-gray-500">
                    Showing top {searchResults.length} matches
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                    {searchResults.map((stock, index) => (
                      <div 
                        key={index} 
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
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-bold text-gray-900 text-base">{stock.symbol}</span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                {stock.exchange}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {stock.sector}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 truncate text-left">{stock.name}</div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-gray-900">{stock.price}</div>
                          <div className="text-xs text-gray-500">Current Price</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : searchQuery && searchResults.length === 0 ? (
              // No Results Layout
              <>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
                  <p className="text-gray-600 mb-1">No stocks found matching &quot;{searchQuery}&quot;</p>
                  <p className="text-sm text-gray-500">Try searching for a stock symbol, company name, or sector</p>
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
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['Banking', 'IT Services', 'Auto', 'Pharma', 'Oil & Gas'].map((category) => (
                      <span key={category} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 cursor-pointer transition-colors">
                        {category}
                      </span>
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
                    <button className="text-left p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-medium text-gray-900">📊 Market Overview</div>
                      <div className="text-xs text-gray-500">View all indices</div>
                    </button>
                    <button className="text-left p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-medium text-gray-900">🔥 Trending Now</div>
                      <div className="text-xs text-gray-500">Popular searches</div>
                    </button>
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
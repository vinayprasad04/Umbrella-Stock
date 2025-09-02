'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

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

export default function MutualFundsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFundHouse, setSelectedFundHouse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('returns1Y');

  const { data: fundsData, isLoading, error, refetch } = useQuery({
    queryKey: ['mutualFunds', searchQuery, selectedCategory, selectedFundHouse, limit],
    queryFn: async () => {
      let url = `/api/mutual-funds/search?q=${encodeURIComponent(searchQuery || 'fund')}&limit=${limit}`;
      if (selectedCategory !== 'all') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (selectedFundHouse !== 'all') {
        url += `&fundHouse=${encodeURIComponent(selectedFundHouse)}`;
      }
      const response = await axios.get(url);
      return response.data.success ? response.data.data : [];
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: 5000,
  });

  const funds: MutualFundData[] = (fundsData as MutualFundData[]) || [];
  
  // Process and sort funds
  const processedFunds = funds
    .sort((a: MutualFundData, b: MutualFundData) => {
      if (sortBy === 'returns1Y') return (b.returns1Y || 0) - (a.returns1Y || 0);
      if (sortBy === 'returns3Y') return (b.returns3Y || 0) - (a.returns3Y || 0);
      if (sortBy === 'returns5Y') return (b.returns5Y || 0) - (a.returns5Y || 0);
      if (sortBy === 'nav') return (b.nav || 0) - (a.nav || 0);
      if (sortBy === 'aum') return (b.aum || 0) - (a.aum || 0);
      if (sortBy === 'expenseRatio') return (a.expenseRatio || 0) - (b.expenseRatio || 0);
      return 0;
    });

  // Get unique categories and fund houses for filters
  const categories: string[] = ['all', ...Array.from(new Set(funds.map(fund => fund.category)))];
  const fundHouses: string[] = ['all', ...Array.from(new Set(funds.map(fund => fund.fundHouse)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-6 py-12 pt-[104px] md:pt-[123px] lg:pt-[67px]">
        {/* Header Section */}
        <div className="mb-12 pt-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span className="mr-2">←</span>
                <span className="font-medium">Back to Home</span>
              </Link>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-300"
            >
              <span className="mr-2">🔄</span>
              Refresh Data
            </button>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-600/10 rounded-full text-sm font-medium text-gray-700 mb-6 backdrop-blur-sm border border-blue-200/50">
              <div className="w-2 h-2 rounded-full mr-2 bg-blue-400"></div>
              Mutual Funds • Real-time data from database
            </div>
            
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-700 to-blue-800 mb-4 leading-tight">
              Mutual Funds India
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover and compare mutual funds with comprehensive performance metrics, expense ratios, and fund house analysis
            </p>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Mutual Funds:</label>
            <input
              type="text"
              placeholder="Search by fund name, scheme code, or fund house..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white/70 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Limit Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Show Funds:</label>
              <div className="flex gap-2">
                {[10, 20, 50, 100].map((count) => (
                  <button
                    key={count}
                    onClick={() => setLimit(count)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      limit === count
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white/70 text-gray-700 hover:bg-blue-100'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Fund House Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Fund House:</label>
              <select
                value={selectedFundHouse}
                onChange={(e) => setSelectedFundHouse(e.target.value)}
                className="w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {fundHouses.map((fundHouse) => (
                  <option key={fundHouse} value={fundHouse}>
                    {fundHouse === 'all' ? 'All Fund Houses' : fundHouse}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="returns1Y">1 Year Returns</option>
                <option value="returns3Y">3 Year Returns</option>
                <option value="returns5Y">5 Year Returns</option>
                <option value="nav">NAV (High to Low)</option>
                <option value="aum">AUM (High to Low)</option>
                <option value="expenseRatio">Expense Ratio (Low to High)</option>
              </select>
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  Category: {selectedCategory}
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="ml-2 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedFundHouse !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  Fund House: {selectedFundHouse}
                  <button 
                    onClick={() => setSelectedFundHouse('all')}
                    className="ml-2 hover:text-green-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                  Search: "{searchQuery}"
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="ml-2 hover:text-purple-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {(selectedCategory !== 'all' || selectedFundHouse !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedFundHouse('all');
                    setSearchQuery('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {processedFunds && processedFunds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {processedFunds.length}
              </div>
              <div className="text-sm text-gray-600">Total Funds</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                +{Math.max(...processedFunds.map((fund: MutualFundData) => fund.returns1Y || 0)).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Best 1Y Return</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {(processedFunds.reduce((sum: number, fund: MutualFundData) => sum + (fund.returns1Y || 0), 0) / processedFunds.length).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg 1Y Return</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {Math.min(...processedFunds.filter((fund: MutualFundData) => fund.expenseRatio).map((fund: MutualFundData) => fund.expenseRatio || 0)).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">Lowest Expense Ratio</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mutual Funds Collection</h2>
                <p className="text-sm text-gray-600">
                  {selectedCategory === 'all' ? 'All categories' : selectedCategory}
                  {selectedFundHouse !== 'all' && ` • ${selectedFundHouse}`} • 
                  Sorted by {sortBy.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </p>
              </div>
            </div>
            
            {processedFunds && processedFunds.length > 0 && (
              <div className="text-sm text-gray-600">
                Showing {processedFunds.length} funds
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: limit }).map((_, index) => (
                <div key={index} className="bg-white/50 rounded-2xl p-6 border border-white/50 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-12">
              <ErrorMessage 
                title="Unable to load mutual funds"
                message={(error as Error)?.message || 'Failed to fetch mutual fund data. Please try again later.'}
              />
              <div className="text-center mt-6">
                <button
                  onClick={() => refetch()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-300"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : processedFunds && processedFunds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedFunds.map((fund: MutualFundData) => (
                <MutualFundCard key={fund.schemeCode} fund={fund} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Mutual Funds Found</h3>
              <p className="text-gray-600">No mutual funds match your current search and filter criteria. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface MutualFundCardProps {
  fund: MutualFundData;
}

function MutualFundCard({ fund }: MutualFundCardProps) {
  const formatAUM = (amount?: number): string => {
    if (!amount) return 'N/A';
    if (amount >= 10000000000) {
      return `₹${(amount / 10000000000).toFixed(1)}k Cr`;
    } else if (amount >= 1000000000) {
      return `₹${(amount / 10000000000).toFixed(2)}k Cr`;
    } else if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(0)} Cr`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };

  const getReturnColor = (value?: number) => {
    if (!value) return 'text-gray-500';
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Link href={`/mutual-funds/${fund.schemeCode}`} className="block">
      <div className="bg-white/50 rounded-2xl p-6 border border-white/50 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2">
              {fund.schemeName.length > 60 ? fund.schemeName.substring(0, 60) + '...' : fund.schemeName}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                {fund.fundHouse}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {fund.category}
              </span>
            </div>
            <p className="text-xs text-gray-500">Code: {fund.schemeCode}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              {fund.nav ? `₹${fund.nav.toFixed(4)}` : 'N/A'}
            </p>
            <p className="text-xs text-gray-500">NAV</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div>
            <p className="text-xs text-gray-500">1Y Return</p>
            <p className={`text-xs font-medium ${
              getReturnColor(fund.returns1Y)
            }`}>
              {fund.returns1Y ? `${fund.returns1Y >= 0 ? '+' : ''}${fund.returns1Y.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">3Y Return</p>
            <p className={`text-xs font-medium ${
              getReturnColor(fund.returns3Y)
            }`}>
              {fund.returns3Y ? `${fund.returns3Y >= 0 ? '+' : ''}${fund.returns3Y.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">5Y Return</p>
            <p className={`text-xs font-medium ${
              getReturnColor(fund.returns5Y)
            }`}>
              {fund.returns5Y ? `${fund.returns5Y >= 0 ? '+' : ''}${fund.returns5Y.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between text-xs">
            <div>
              <span className="text-gray-500">Expense Ratio: </span>
              <span className="font-medium">{fund.expenseRatio ? `${fund.expenseRatio.toFixed(2)}%` : 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">AUM: </span>
              <span className="font-medium">{formatAUM(fund.aum)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
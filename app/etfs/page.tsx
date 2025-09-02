'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import ETFCard from '@/components/ETFCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

interface ETF {
  name: string;
  symbol: string;
  category: string;
  nav: number;
  returns1Y: number;
  returns3Y: number;
  returns5Y: number;
  expenseRatio: number;
  aum: number;
  trackingIndex: string;
  fundHouse: string;
  lastUpdated: Date;
}

export default function ETFsPage() {
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('returns1Y');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFundHouse, setFilterFundHouse] = useState('all');

  const { data: etfs, isLoading, error, refetch } = useQuery({
    queryKey: ['etfs', limit],
    queryFn: async () => {
      const response = await axios.get(`/api/etfs?limit=${limit}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch ETFs');
      }
      return response.data.data as ETF[];
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 3,
    retryDelay: 5000,
  });

  // Filter and sort ETFs
  const processedETFs = etfs
    ?.filter(etf => {
      const categoryMatch = filterCategory === 'all' || etf.category === filterCategory;
      const fundHouseMatch = filterFundHouse === 'all' || etf.fundHouse === filterFundHouse;
      return categoryMatch && fundHouseMatch;
    })
    ?.sort((a, b) => {
      if (sortBy === 'returns1Y') return b.returns1Y - a.returns1Y;
      if (sortBy === 'returns3Y') return b.returns3Y - a.returns3Y;
      if (sortBy === 'returns5Y') return b.returns5Y - a.returns5Y;
      if (sortBy === 'nav') return b.nav - a.nav;
      if (sortBy === 'aum') return b.aum - a.aum;
      if (sortBy === 'expenseRatio') return a.expenseRatio - b.expenseRatio; // Lower is better
      return 0;
    }) || [];

  // Get unique categories and fund houses
  const categories: string[] = ['all', ...Array.from(new Set((etfs?.map(etf => etf.category) || []).filter((cat): cat is string => Boolean(cat))))];
  const fundHouses: string[] = ['all', ...Array.from(new Set((etfs?.map(etf => etf.fundHouse) || []).filter((house): house is string => Boolean(house))))];

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
              Exchange Traded Funds • Updated regularly
            </div>
            
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-700 to-blue-800 mb-4 leading-tight">
              ETFs India
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover and compare Exchange Traded Funds with comprehensive performance metrics, expense ratios, and tracking indices
            </p>
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Limit Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Show ETFs:</label>
              <div className="flex gap-2">
                {[10, 20, 30, 50].map((count) => (
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
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
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
                value={filterFundHouse}
                onChange={(e) => setFilterFundHouse(e.target.value)}
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
              {filterCategory !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  Category: {filterCategory}
                  <button 
                    onClick={() => setFilterCategory('all')}
                    className="ml-2 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterFundHouse !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  Fund House: {filterFundHouse}
                  <button 
                    onClick={() => setFilterFundHouse('all')}
                    className="ml-2 hover:text-green-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {(filterCategory !== 'all' || filterFundHouse !== 'all') && (
                <button
                  onClick={() => {
                    setFilterCategory('all');
                    setFilterFundHouse('all');
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
        {processedETFs && processedETFs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {processedETFs.length}
              </div>
              <div className="text-sm text-gray-600">Total ETFs</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                +{Math.max(...processedETFs.map(etf => etf.returns1Y)).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Best 1Y Return</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {(processedETFs.reduce((sum, etf) => sum + etf.returns1Y, 0) / processedETFs.length).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg 1Y Return</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {Math.min(...processedETFs.map(etf => etf.expenseRatio)).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">Lowest Expense Ratio</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">ETF Collection</h2>
                <p className="text-sm text-gray-600">
                  {filterCategory === 'all' ? 'All categories' : filterCategory}
                  {filterFundHouse !== 'all' && ` • ${filterFundHouse}`} • 
                  Sorted by {sortBy.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </p>
              </div>
            </div>
            
            {processedETFs && processedETFs.length > 0 && (
              <div className="text-sm text-gray-600">
                Showing {processedETFs.length} of {etfs?.length || 0} ETFs
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
                title="Unable to load ETFs"
                message={(error as Error)?.message || 'Failed to fetch ETF data. Please try again later.'}
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
          ) : processedETFs && processedETFs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedETFs.map((etf) => (
                <ETFCard key={etf.symbol} etf={etf} />
              ))}
            </div>
          ) : etfs && etfs.length > 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No ETFs Found</h3>
              <p className="text-gray-600">No ETFs match your current filter criteria. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No ETFs Available</h3>
              <p className="text-gray-600">ETF data is currently not available. Please try again later.</p>
            </div>
          )}
        </div>

        {/* Action Section */}
        {processedETFs && processedETFs.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Explore more investment options</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/mutual-funds"
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all duration-300"
                >
                  View Mutual Funds
                </Link>
                <Link
                  href="/sectors"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300"
                >
                  Explore Sectors
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-all duration-300"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
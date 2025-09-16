'use client';

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/api-utils';

interface VerifiedStock {
  symbol: string;
  companyName: string;
  sector: string;
  industry?: string;
  marketCap: number;
  currentPrice: number;
  eps?: number;
  pe?: number;
  profitMargin?: number;
  salesGrowth?: number;
  profitGrowth?: number;
  lastUpdated: string;
  exchange?: string;
}

interface StocksData {
  stocks: VerifiedStock[];
  total: number;
  page: number;
  limit: number;
}

export default function StocksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchStocks = useCallback(async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...(search && { search }),
      ...(sectorFilter && { sector: sectorFilter }),
      sortBy,
      sortOrder
    });

    const response = await axios.get(`/api/stocks/verified?${params}`);
    return response.data.data;
  }, [page, search, sectorFilter, sortBy, sortOrder]);

  const { data, isLoading, error, refetch } = useQuery<StocksData>({
    queryKey: ['verifiedStocks', page, search, sectorFilter, sortBy, sortOrder],
    queryFn: fetchStocks,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="w-full max-w-[1600px] mx-auto px-6 py-8 pt-[104px] md:pt-[123px] lg:pt-[67px]">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Error Loading Stocks
            </h1>
            <p className="text-gray-600 mb-8">
              We couldn't load the verified stocks list. Please try again later.
            </p>
            <button onClick={() => refetch()} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="w-full max-w-[1600px] mx-auto px-6 py-8 pt-[104px] md:pt-[123px] lg:pt-[67px]">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <h1 className="text-3xl font-bold text-gray-900">Verified Stocks</h1>
          </div>
          <p className="text-lg text-gray-600">
            Explore stocks with verified comprehensive financial data and detailed analysis.
          </p>
        </div>

        {/* Stats Card */}
        {data && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{data.total}</div>
                <div className="text-sm text-gray-600 mt-1">Verified Stocks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {data.stocks.filter(s => s.salesGrowth && s.salesGrowth > 0).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Positive Sales Growth</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {data.stocks.filter(s => s.profitGrowth && s.profitGrowth > 0).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Positive Profit Growth</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search & Filter</h3>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Symbol or company name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <input
                type="text"
                placeholder="Filter by sector..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="marketCap">Market Cap</option>
                <option value="currentPrice">Current Price</option>
                <option value="symbol">Symbol</option>
                <option value="companyName">Company Name</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSectorFilter('');
                  setSortBy('marketCap');
                  setSortOrder('desc');
                  setPage(1);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Stocks Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Verified Stocks ({data?.total || 0})
            </h3>
            {isLoading && (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('symbol')}
                  >
                    Symbol {getSortIcon('symbol')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('companyName')}
                  >
                    Company {getSortIcon('companyName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('marketCap')}
                  >
                    Market Cap {getSortIcon('marketCap')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('currentPrice')}
                  >
                    Price {getSortIcon('currentPrice')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P/E
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.stocks && data.stocks.length > 0 ? data.stocks.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stock.symbol}</div>
                          {stock.exchange && (
                            <div className="text-xs text-gray-500">{stock.exchange}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={stock.companyName}>
                        {stock.companyName}
                      </div>
                      {stock.industry && (
                        <div className="text-xs text-gray-500">{stock.industry}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock.sector}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(stock.marketCap)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(stock.currentPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock.pe ? stock.pe.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="space-y-1">
                        {stock.salesGrowth !== undefined && (
                          <div className={`text-xs ${stock.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Sales: {stock.salesGrowth.toFixed(1)}%
                          </div>
                        )}
                        {stock.profitGrowth !== undefined && (
                          <div className={`text-xs ${stock.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Profit: {stock.profitGrowth.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/stocks/${stock.symbol}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <LoadingSpinner size="lg" />
                          <span className="ml-2">Loading verified stocks...</span>
                        </div>
                      ) : (
                        'No verified stocks found matching your criteria.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total > data.limit && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((page - 1) * data.limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * data.limit, data.total)}
                    </span>{' '}
                    of <span className="font-medium">{data.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page * data.limit >= data.total}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
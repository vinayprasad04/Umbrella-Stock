'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from "next/link";
import { formatCurrency, formatPercentage } from '@/lib/api-utils';

// Custom styles for new design
const customStyles = `
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
  }
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 3px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
  }
  .filter-card {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .glass-effect {
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.85);
  }
`;

interface StockData {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  currentPrice: number;
  marketCap: number;
  marketCapFormatted: string;
  faceValue: number;
  peRatio: number | null;
  oneMonthReturn: number | null;
  tenDayReturn: number | null;
  returnOnEquity: number | null;
  pbRatio: number | null;
  dataQuality: string;
  lastUpdated: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface ApiResponse {
  success: boolean;
  data: {
    stocks: StockData[];
    pagination: PaginationInfo;
  };
  message?: string;
}

// API URL for fetching stocks
const API_URL = '/api/scanner/stocks';

export default function ScannerPage() {
  // Data states
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Pagination states
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    limit: 20,
    hasNext: false,
    hasPrevious: false
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    sector: '',
    industry: '',
    minMarketCap: '',
    maxMarketCap: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'meta.marketCapitalization',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // UI states
  const [selectedLimit, setSelectedLimit] = useState<number>(20);

  // Fetch stocks from API
  const fetchStocks = async (page: number = 1, limit: number = 20) => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.sector && { sector: filters.sector }),
        ...(filters.industry && { industry: filters.industry }),
        ...(filters.minMarketCap && { minMarketCap: filters.minMarketCap }),
        ...(filters.maxMarketCap && { maxMarketCap: filters.maxMarketCap }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await fetch(`${API_URL}?${queryParams}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setStocks(result.data.stocks);
        setPagination(result.data.pagination);
      } else {
        setError(result.message || 'Failed to fetch stocks');
      }
    } catch (err) {
      setError('An error occurred while fetching stocks');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchStocks(1, selectedLimit);
  }, []);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchStocks(newPage, selectedLimit);
    }
  };

  // Handle limit change
  const handleLimitChange = (newLimit: number) => {
    setSelectedLimit(newLimit);
    fetchStocks(1, newLimit); // Reset to page 1 when changing limit
  };

  // Handle filters
  const applyFilters = () => {
    fetchStocks(1, selectedLimit); // Reset to page 1 when applying filters
  };

  const handleSort = (key: string) => {
    const newDirection = filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({
      ...prev,
      sortBy: key,
      sortOrder: newDirection
    }));

    // Re-fetch data with new sort
    fetchStocks(1, selectedLimit);
  };

  const getSortIcon = (columnName: string) => {
    if (filters.sortBy !== columnName) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }

    if (filters.sortOrder === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  const resetAllFilters = () => {
    setFilters({
      search: '',
      sector: '',
      industry: '',
      minMarketCap: '',
      maxMarketCap: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'meta.marketCapitalization',
      sortOrder: 'desc'
    });
    fetchStocks(1, selectedLimit);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Header />

      <main className="pt-[120px] md:pt-[140px] lg:pt-[90px] pb-4">
        {/* Top Header Section */}
        <div className="px-6 mb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 ">Stock Screener</h1>
              <p className="text-slate-600">Find the perfect stocks with advanced filtering</p>
            </div>
            <div className="flex items-center gap-3">
              {/* <button className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all">
                Save Screen
              </button> */}
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
                Export Results
              </button>
            </div>
          </div>

        </div>

        <div className="px-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-24">
                {/* Filters Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
                  <button
                    onClick={resetAllFilters}
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    Reset all
                  </button>
                </div>

                {/* Filter Categories */}
                <div className="space-y-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                    <input
                      type="text"
                      placeholder="Search by company name or symbol..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Sector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sector</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={filters.sector}
                      onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
                    >
                      <option value="">All Sectors</option>
                      <option value="Banking">Banking</option>
                      <option value="Technology">Technology</option>
                      <option value="Energy">Energy</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="FMCG">FMCG</option>
                      <option value="Auto">Auto</option>
                      <option value="Telecom">Telecom</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Real Estate">Real Estate</option>
                    </select>
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
                    <input
                      type="text"
                      placeholder="Enter industry (e.g., IT Services, Banking)"
                      value={filters.industry}
                      onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Market Cap */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Market Cap (₹ Cr)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minMarketCap}
                        onChange={(e) => setFilters(prev => ({ ...prev, minMarketCap: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxMarketCap}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxMarketCap: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Additional Filters */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price Range (₹)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">P/E Ratio</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ROE (%)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <button
                    onClick={applyFilters}
                    className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="col-span-12 lg:col-span-9">
              {/* Results Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 ${loading ? 'bg-orange-500' : error ? 'bg-red-500' : 'bg-green-500'} rounded-full`}></div>
                      <span className="text-lg font-semibold text-slate-900">
                        {loading ? 'Loading...' : `${pagination.totalRecords} stocks found`}
                      </span>
                    </div>
                    {!loading && !error && (
                      <span className="text-sm text-slate-500">
                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Per Page:</span>
                    <select
                      value={selectedLimit}
                      onChange={(e) => handleLimitChange(Number(e.target.value))}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                    </select>
                    <button className="px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-sm">
                      Export
                    </button>
                  </div>
                </div>
              </div>

              {/* Stock Cards Grid */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-auto scrollbar-thin" style={{maxHeight: '575px'}}>
                  <table className="w-full">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('companyName')} className="flex items-center gap-1 hover:text-indigo-600">
                            Company {getSortIcon('companyName')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Sector
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('meta.marketCapitalization')} className="flex items-center gap-1 hover:text-indigo-600">
                            Market Cap {getSortIcon('meta.marketCapitalization')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('meta.currentPrice')} className="flex items-center gap-1 hover:text-indigo-600">
                            Price {getSortIcon('meta.currentPrice')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('peRatio')} className="flex items-center gap-1 hover:text-indigo-600">
                            P/E {getSortIcon('peRatio')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('oneMonthReturn')} className="flex items-center gap-1 hover:text-indigo-600">
                            1M Return {getSortIcon('oneMonthReturn')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('tenDayReturn')} className="flex items-center gap-1 hover:text-indigo-600">
                            1D Return {getSortIcon('tenDayReturn')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('returnOnEquity')} className="flex items-center gap-1 hover:text-indigo-600">
                            ROE {getSortIcon('returnOnEquity')}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                              Loading stocks...
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-red-500">
                            {error}
                          </td>
                        </tr>
                      ) : stocks.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                            No stocks found matching your criteria
                          </td>
                        </tr>
                      ) : (
                        stocks.map((stock, index) => (
                          <tr key={stock.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                                  {((pagination.currentPage - 1) * pagination.limit) + index + 1}
                                </div>
                                <div>
                                   <Link
                                    href={`/stocks/${stock.symbol}`}
                                     target="_blank"
                                      rel="noopener noreferrer"
                                    className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer"
                                  >
                                    {stock.name}
                                  </Link>
                                 
                                  <div className="text-xs text-slate-500">{stock.symbol}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                {stock.sector}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-slate-900">
                                {stock.marketCapFormatted}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-slate-900">
                                ₹{stock.currentPrice.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {stock.peRatio ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                                  {stock.peRatio.toFixed(2)}x
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {stock.oneMonthReturn !== null ? (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  stock.oneMonthReturn >= 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {stock.oneMonthReturn >= 0 ? '+' : ''}{stock.oneMonthReturn.toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {stock.tenDayReturn !== null ? (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  stock.tenDayReturn >= 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {stock.tenDayReturn >= 0 ? '+' : ''}{stock.tenDayReturn.toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {stock.returnOnEquity !== null ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500 rounded-full"
                                      style={{ width: `${Math.min(stock.returnOnEquity * 1.67, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-slate-900">{stock.returnOnEquity.toFixed(1)}%</span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {!loading && !error && pagination.totalPages > 1 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={!pagination.hasPrevious}
                        className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        First
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevious}
                        className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const startPage = Math.max(1, pagination.currentPage - 2);
                        const pageNumber = startPage + i;
                        if (pageNumber > pagination.totalPages) return null;

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              pageNumber === pagination.currentPage
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 bg-white border border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={!pagination.hasNext}
                        className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
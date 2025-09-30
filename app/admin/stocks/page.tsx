'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/custom-select';
import { Checkbox } from '@/components/ui/checkbox';
import { ApiClient } from '@/lib/apiClient';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface EquityStock {
  symbol: string;
  companyName: string;
  sector: string;
  industry?: string;
  marketCap?: number;
  hasActualData: boolean;
  dataQuality?: string;
  lastUpdated?: string;
  enteredBy?: string;
  currentPrice?: number;
  exchange?: string;
}

interface DashboardData {
  stocks: EquityStock[];
  total: number;
  page: number;
  limit: number;
  filters: {
    totalStocks: number;
    stocksWithActualData: number;
    stocksWithoutActualData: number;
  };
}

export default function StocksDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [exchangeFilter, setExchangeFilter] = useState('');
  const [dataFilter, setDataFilter] = useState('all');
  const [dataQualityFilter, setDataQualityFilter] = useState('all');
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [perPage, setPerPage] = useState(50);
  const [sortBy, setSortBy] = useState('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        ...(search && { search }),
        ...(sectorFilter && { sector: sectorFilter }),
        ...(exchangeFilter && { exchange: exchangeFilter }),
        ...(dataFilter && dataFilter !== 'all' && { hasActualData: dataFilter }),
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      // Handle dataQualityFilter - special case for NO_DATA
      if (dataQualityFilter && dataQualityFilter !== 'all') {
        if (dataQualityFilter === 'NO_DATA') {
          // For "No Data", only set hasActualData=false, don't set dataQuality
          params.append('hasActualData', 'false');
        } else {
          // For actual quality values, set dataQuality and ensure hasActualData=true
          params.append('dataQuality', dataQualityFilter);
          params.append('hasActualData', 'true');
        }
      }

      const url = `/admin/stocks?${params}`;
      console.log('🔗 API URL:', url);
      console.log('📋 URL Params:', Object.fromEntries(params.entries()));

      const result = await ApiClient.get(url);

      console.log('🔍 API Response:', result);
      console.log('📊 Stocks received:', result?.data?.stocks?.length || 0);
      console.log('📋 First stock sample:', result?.data?.stocks?.[0]);

      if (result.success) {
        setData(result.data);
        console.log('✅ Data set to state:', result.data?.stocks?.length, 'stocks');
      } else {
        console.error('❌ API Error:', result.error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, sectorFilter, exchangeFilter, dataFilter, dataQualityFilter, perPage, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectAll = (checked: boolean) => {
    if (data?.stocks) {
      if (checked) {
        const allSymbols = data.stocks.map(stock => stock.symbol);
        setSelectedStocks(allSymbols);
      } else {
        setSelectedStocks([]);
      }
    }
  };

  const handleSelectStock = (symbol: string) => {
    setSelectedStocks(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedStocks.length === 0) return;

    setBulkUpdating(true);
    try {
      const response = await ApiClient.patch('/admin/stocks/bulk-update', {
        symbols: selectedStocks,
        dataQuality: newStatus
      });

      if (response.success) {
        setSelectedStocks([]);
        setShowBulkActions(false);
        fetchData();
      } else {
        console.error('Bulk update failed:', response.error);
        alert('Failed to update stock statuses: ' + response.error);
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      alert('Failed to update stock statuses');
    } finally {
      setBulkUpdating(false);
    }
  };

  useEffect(() => {
    setShowBulkActions(selectedStocks.length > 0);
  }, [selectedStocks]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with ascending order
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page when sorting
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => {
    const isActive = sortBy === column;
    const isAsc = sortOrder === 'asc';

    return (
      <th
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center space-x-1">
          <span>{children}</span>
          <div className="flex flex-col">
            <svg
              className={`w-3 h-3 ${isActive && isAsc ? 'text-blue-600' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <svg
              className={`w-3 h-3 -mt-1 ${isActive && !isAsc ? 'text-blue-600' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </th>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1000000) {
      return `₹${(marketCap / 1000000).toFixed(2)}Cr`;
    } else if (marketCap >= 100000) {
      return `₹${(marketCap / 100000).toFixed(2)}L`;
    }
    return `₹${marketCap.toFixed(2)}`;
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `₹${price.toFixed(2)}`;
  };

  const PaginationComponent = () => {
    if (!data || data.total <= data.limit) return null;

    return (
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
    );
  };

  const getStatusBadge = (stock: EquityStock) => {
    if (!stock.hasActualData) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          No Data
        </span>
      );
    }

    const colors = {
      'VERIFIED': 'bg-green-100 text-green-800',
      'PENDING_VERIFICATION': 'bg-yellow-100 text-yellow-800',
      'EXCELLENT': 'bg-blue-100 text-blue-800',
      'GOOD': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[stock.dataQuality as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {stock.dataQuality || 'Unknown'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout currentPage="stocks">
      <div className="p-6">
          {/* Stats Cards */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Total Equity Stocks</p>
                    <p className="text-2xl font-semibold text-gray-900">{data.filters.totalStocks.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">With Actual Data</p>
                    <p className="text-2xl font-semibold text-gray-900">{data.filters.stocksWithActualData.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Missing Actual Data</p>
                    <p className="text-2xl font-semibold text-gray-900">{data.filters.stocksWithoutActualData.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                onClick={() => {
                  setSearch('');
                  setSectorFilter('');
                  setExchangeFilter('');
                  setDataFilter('all');
                  setDataQualityFilter('PENDING_VERIFICATION');
                  setSortBy('symbol');
                  setSortOrder('asc');
                  setPage(1);
                }}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Show Pending Verification</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Stock symbol or company..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <CustomSelect
                label="Status"
                value={dataQualityFilter}
                onValueChange={setDataQualityFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                  { value: 'VERIFIED', label: 'Verified' },
                  { value: 'EXCELLENT', label: 'Excellent' },
                  { value: 'GOOD', label: 'Good' },
                  { value: 'NO_DATA', label: 'No Data' }
                ]}
                placeholder="All Status"
                triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
              />

              <CustomSelect
                label="Per Page"
                value={perPage.toString()}
                onValueChange={(value) => {
                  setPerPage(parseInt(value));
                  setPage(1); // Reset to first page when changing per page
                }}
                options={[
                  { value: '10', label: '10 per page' },
                  { value: '20', label: '20 per page' },
                  { value: '50', label: '50 per page' },
                  { value: '100', label: '100 per page' },
                  { value: '200', label: '200 per page' }
                ]}
                placeholder="50 per page"
                triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
              />

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearch('');
                    setDataQualityFilter('all');
                    setSortBy('symbol');
                    setSortOrder('asc');
                    setPage(1);
                  }}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Top Pagination */}
            <PaginationComponent />

            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Equity Stocks ({data?.total.toLocaleString() || 0})
                  {selectedStocks.length > 0 && (
                    <span className="ml-2 text-sm text-blue-600">({selectedStocks.length} selected)</span>
                  )}
                </h3>
                {showBulkActions && (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">Bulk Actions:</span>
                    <button
                      onClick={() => handleBulkStatusUpdate('VERIFIED')}
                      disabled={bulkUpdating}
                      className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark as Verified
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate('PENDING_VERIFICATION')}
                      disabled={bulkUpdating}
                      className="bg-yellow-600 text-white px-3 py-1 text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Mark as Pending
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate('EXCELLENT')}
                      disabled={bulkUpdating}
                      className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Mark as Excellent
                    </button>
                    <button
                      onClick={() => setSelectedStocks([])}
                      disabled={bulkUpdating}
                      className="bg-gray-600 text-white px-3 py-1 text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={data?.stocks && selectedStocks.length === data.stocks.length && data.stocks.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <span>Select</span>
                      </div>
                    </th>
                    <SortableHeader column="symbol">
                      Symbol
                    </SortableHeader>
                    <SortableHeader column="companyName">
                      Company Name
                    </SortableHeader>
                    <SortableHeader column="marketCap">
                      Market Cap
                    </SortableHeader>
                    <SortableHeader column="currentPrice">
                      Current Price
                    </SortableHeader>
                    <SortableHeader column="dataQuality">
                      Status
                    </SortableHeader>
                    <SortableHeader column="lastUpdated">
                      Last Updated
                    </SortableHeader>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.stocks && data.stocks.length > 0 ? data.stocks.map((stock) => (
                    <tr key={stock.symbol} className={`hover:bg-gray-50 ${selectedStocks.includes(stock.symbol) ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedStocks.includes(stock.symbol)}
                          onCheckedChange={() => handleSelectStock(stock.symbol)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stock.symbol}
                        {stock.exchange && (
                          <div className="text-xs text-gray-500">{stock.exchange}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={stock.companyName}>
                          <Link
                            href={`https://www.screener.in/company/${stock.symbol}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {stock.companyName}
                          </Link>
                        </div>
                        {stock.industry && (
                          <div className="text-xs text-gray-500">{stock.industry}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatMarketCap(stock.marketCap)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(stock.currentPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(stock)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{formatDate(stock.lastUpdated)}</div>
                        {stock.enteredBy && (
                          <div className="text-xs text-gray-500">by {stock.enteredBy}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/stocks/${stock.symbol}`}
                          className="text-purple-600 hover:text-purple-900 mr-4"
                        >
                          {stock.hasActualData ? 'Edit' : 'Add Data'}
                        </Link>
                        <Link
                          href={`/stocks/${stock.symbol}`}
                          className="text-green-600 hover:text-green-900"
                          target="_blank"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                        {dataQualityFilter === 'PENDING_VERIFICATION' ?
                          'No stocks found with Pending Verification status.' :
                          'No stocks found matching your filters.'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination */}
            <PaginationComponent />
          </div>
      </div>
    </AdminDashboardLayout>
  );
}
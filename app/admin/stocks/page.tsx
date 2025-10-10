'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/custom-select';
import { MultiSelect } from '@/components/ui/multi-select';
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
  hasRatios?: boolean;
  niftyIndex?: string;
  niftyIndices?: string[];
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
  const [ratiosFilter, setRatiosFilter] = useState('all');
  const [niftyIndicesFilter, setNiftyIndicesFilter] = useState<string[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [perPage, setPerPage] = useState(50);
  const [sortBy, setSortBy] = useState('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [newsFilter, setNewsFilter] = useState('all');
  const [newsStats, setNewsStats] = useState<{total: number, withNews: number, withoutNews: number}>({total: 0, withNews: 0, withoutNews: 0});
  const [stocksWithNews, setStocksWithNews] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        ...(search && { search }),
        ...(sectorFilter && { sector: sectorFilter }),
        ...(exchangeFilter && { exchange: exchangeFilter }),
        ...(dataFilter && dataFilter !== 'all' && { hasActualData: dataFilter }),
        ...(ratiosFilter && ratiosFilter !== 'all' && { hasRatios: ratiosFilter }),
        ...(niftyIndicesFilter.length > 0 && { niftyIndices: niftyIndicesFilter.join(',') }),
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
  }, [page, search, sectorFilter, exchangeFilter, dataFilter, dataQualityFilter, ratiosFilter, niftyIndicesFilter, perPage, sortBy, sortOrder]);

  const fetchNewsStats = useCallback(async () => {
    try {
      const result = await ApiClient.get('/admin/stocks/news?limit=10000');
      if (result.success) {
        const newsMap = new Map<string, number>();
        result.data.activities.forEach((activity: any) => {
          const count = newsMap.get(activity.stockSymbol) || 0;
          newsMap.set(activity.stockSymbol, count + 1);
        });

        setStocksWithNews(new Set(newsMap.keys()));
        setNewsStats({
          total: result.data.total || 0,
          withNews: newsMap.size,
          withoutNews: 0 // Will be calculated from total stocks
        });
      }
    } catch (error) {
      console.error('Error fetching news stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchNewsStats();
  }, [fetchData, fetchNewsStats]);

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

  const formatNiftyIndices = (indices?: string[]) => {
    if (!indices || indices.length === 0) return 'Not Listed';

    // Sort indices by priority: 50 > 100 > 200 > 500 > others
    const priorityOrder = ['NIFTY_50', 'NIFTY_100', 'NIFTY_200', 'NIFTY_500'];
    const sortedIndices = [...indices].sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    const getIndexColor = (index: string) => {
      switch (index) {
        case 'NIFTY_50': return 'bg-blue-100 text-blue-800';
        case 'NIFTY_100': return 'bg-indigo-100 text-indigo-800';
        case 'NIFTY_200': return 'bg-violet-100 text-violet-800';
        case 'NIFTY_500': return 'bg-purple-100 text-purple-800';
        case 'NIFTY_BANK': return 'bg-green-100 text-green-800';
        case 'NIFTY_FINANCIAL_SERVICES': return 'bg-emerald-100 text-emerald-800';
        case 'NIFTY_MIDCAP_SELECT': return 'bg-yellow-100 text-yellow-800';
        case 'NIFTY_MIDCAP_50': return 'bg-orange-100 text-orange-800';
        case 'NIFTY_MIDCAP_100': return 'bg-amber-100 text-amber-800';
        case 'NIFTY_MIDCAP_150': return 'bg-lime-100 text-lime-800';
        case 'NIFTY_SMALLCAP_50': return 'bg-pink-100 text-pink-800';
        case 'NIFTY_SMALLCAP_100': return 'bg-rose-100 text-rose-800';
        case 'NIFTY_SMALLCAP_250': return 'bg-red-100 text-red-800';
        case 'NIFTY_AUTO': return 'bg-cyan-100 text-cyan-800';
        case 'NIFTY_FINANCIAL_SERVICES_25_50': return 'bg-teal-100 text-teal-800';
        case 'NIFTY_FMCG': return 'bg-sky-100 text-sky-800';
        case 'NIFTY_IT': return 'bg-blue-100 text-blue-800';
        case 'NIFTY_MEDIA': return 'bg-purple-100 text-purple-800';
        case 'NIFTY_METAL': return 'bg-slate-100 text-slate-800';
        case 'NIFTY_PHARMA': return 'bg-green-100 text-green-800';
        case 'NIFTY_PSU_BANK': return 'bg-lime-100 text-lime-800';
        case 'NIFTY_REALTY': return 'bg-orange-100 text-orange-800';
        case 'NIFTY_PRIVATE_BANK': return 'bg-emerald-100 text-emerald-800';
        case 'NIFTY_HEALTHCARE_INDEX': return 'bg-red-100 text-red-800';
        case 'NIFTY_CONSUMER_DURABLES': return 'bg-yellow-100 text-yellow-800';
        case 'NIFTY_OIL_GAS': return 'bg-amber-100 text-amber-800';
        case 'NIFTY_MIDSMALL_HEALTHCARE': return 'bg-pink-100 text-pink-800';
        case 'NIFTY_FINANCIAL_SERVICES_EX_BANK': return 'bg-indigo-100 text-indigo-800';
        case 'NIFTY_MIDSMALL_FINANCIAL_SERVICES': return 'bg-violet-100 text-violet-800';
        case 'NIFTY_MIDSMALL_IT_TELECOM': return 'bg-sky-100 text-sky-800';
        case 'NIFTY_NEXT_50': return 'bg-teal-100 text-teal-800';
        case 'NIFTY_MIDSMALLCAP_400': return 'bg-lime-100 text-lime-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getIndexLabel = (index: string) => {
      const labels: { [key: string]: string } = {
        'NIFTY_50': 'N50',
        'NIFTY_100': 'N100',
        'NIFTY_200': 'N200',
        'NIFTY_500': 'N500',
        'NIFTY_BANK': 'Bank',
        'NIFTY_FINANCIAL_SERVICES': 'Fin',
        'NIFTY_MIDCAP_SELECT': 'MC-S',
        'NIFTY_MIDCAP_50': 'MC50',
        'NIFTY_MIDCAP_100': 'MC100',
        'NIFTY_MIDCAP_150': 'MC150',
        'NIFTY_SMALLCAP_50': 'SC50',
        'NIFTY_SMALLCAP_100': 'SC100',
        'NIFTY_SMALLCAP_250': 'SC250',
        'NIFTY_AUTO': 'Auto',
        'NIFTY_FINANCIAL_SERVICES_25_50': 'Fin25/50',
        'NIFTY_FMCG': 'FMCG',
        'NIFTY_IT': 'IT',
        'NIFTY_MEDIA': 'Media',
        'NIFTY_METAL': 'Metal',
        'NIFTY_PHARMA': 'Pharma',
        'NIFTY_PSU_BANK': 'PSU-Bank',
        'NIFTY_REALTY': 'Realty',
        'NIFTY_PRIVATE_BANK': 'Pvt-Bank',
        'NIFTY_HEALTHCARE_INDEX': 'Health',
        'NIFTY_CONSUMER_DURABLES': 'Cons-Dur',
        'NIFTY_OIL_GAS': 'Oil&Gas',
        'NIFTY_MIDSMALL_HEALTHCARE': 'MS-Health',
        'NIFTY_FINANCIAL_SERVICES_EX_BANK': 'Fin-ExBank',
        'NIFTY_MIDSMALL_FINANCIAL_SERVICES': 'MS-Fin',
        'NIFTY_MIDSMALL_IT_TELECOM': 'MS-IT',
        'NIFTY_NEXT_50': 'Next50',
        'NIFTY_MIDSMALLCAP_400': 'MSC-400'
      };
      return labels[index] || index;
    };

    return (
      <div className="flex flex-wrap gap-1">
        {sortedIndices.map((index, i) => (
          <span
            key={i}
            className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded ${getIndexColor(index)}`}
            title={index.replace('NIFTY_', 'Nifty ').replace('_', ' ')}
          >
            {getIndexLabel(index)}
          </span>
        ))}
      </div>
    );
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

  // Apply news filter
  const filteredStocks = data?.stocks?.filter(stock => {
    if (newsFilter === 'has-news') {
      return stocksWithNews.has(stock.symbol);
    } else if (newsFilter === 'no-news') {
      return !stocksWithNews.has(stock.symbol);
    }
    return true; // 'all'
  }) || [];

  return (
    <AdminDashboardLayout currentPage="stocks">
      <div className="p-6">
          {/* Stats Cards */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Stocks With News</p>
                    <p className="text-2xl font-semibold text-gray-900">{newsStats.withNews.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Total News Articles</p>
                    <p className="text-2xl font-semibold text-gray-900">{newsStats.total.toLocaleString()}</p>
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
                  setRatiosFilter('all');
                  setNewsFilter('all');
                  setNiftyIndicesFilter([]);
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
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-3">
              <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Stock symbol or company..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="lg:col-span-1 xl:col-span-1">
                <CustomSelect
                  label="Status"
                  value={dataQualityFilter}
                  onValueChange={setDataQualityFilter}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'PENDING_VERIFICATION', label: 'Pending' },
                    { value: 'VERIFIED', label: 'Verified' },
                    { value: 'EXCELLENT', label: 'Excellent' },
                    { value: 'GOOD', label: 'Good' },
                    { value: 'NO_DATA', label: 'No Data' }
                  ]}
                  placeholder="All Status"
                  triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
                />
              </div>

              <div className="lg:col-span-1 xl:col-span-1">
                <CustomSelect
                  label="Ratios"
                  value={ratiosFilter}
                  onValueChange={setRatiosFilter}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'true', label: 'Has Ratios' },
                    { value: 'false', label: 'No Ratios' }
                  ]}
                  placeholder="All"
                  triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
                />
              </div>

              <div className="lg:col-span-1 xl:col-span-1">
                <CustomSelect
                  label="News"
                  value={newsFilter}
                  onValueChange={setNewsFilter}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'has-news', label: 'Has News' },
                    { value: 'no-news', label: 'No News' }
                  ]}
                  placeholder="All"
                  triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-2 xl:col-span-3">
                <MultiSelect
                  label="Nifty Indices"
                  options={[
                    { value: 'NIFTY_50', label: 'Nifty 50' },
                    { value: 'NIFTY_100', label: 'Nifty 100' },
                    { value: 'NIFTY_200', label: 'Nifty 200' },
                    { value: 'NIFTY_500', label: 'Nifty 500' },
                    { value: 'NIFTY_NEXT_50', label: 'Nifty Next 50' },
                    { value: 'NIFTY_BANK', label: 'Nifty Bank' },
                    { value: 'NIFTY_FINANCIAL_SERVICES', label: 'Nifty Financial Services' },
                    { value: 'NIFTY_MIDCAP_SELECT', label: 'Nifty Midcap Select' },
                    { value: 'NIFTY_MIDCAP_50', label: 'Nifty Midcap 50' },
                    { value: 'NIFTY_MIDCAP_100', label: 'Nifty Midcap 100' },
                    { value: 'NIFTY_MIDCAP_150', label: 'Nifty Midcap 150' },
                    { value: 'NIFTY_SMALLCAP_50', label: 'Nifty Smallcap 50' },
                    { value: 'NIFTY_SMALLCAP_100', label: 'Nifty Smallcap 100' },
                    { value: 'NIFTY_SMALLCAP_250', label: 'Nifty Smallcap 250' },
                    { value: 'NIFTY_MIDSMALLCAP_400', label: 'Nifty MidSmallcap 400' },
                    { value: 'NIFTY_AUTO', label: 'Nifty Auto' },
                    { value: 'NIFTY_FINANCIAL_SERVICES_25_50', label: 'Nifty Financial Services 25/50' },
                    { value: 'NIFTY_FMCG', label: 'Nifty FMCG' },
                    { value: 'NIFTY_IT', label: 'Nifty IT' },
                    { value: 'NIFTY_MEDIA', label: 'Nifty Media' },
                    { value: 'NIFTY_METAL', label: 'Nifty Metal' },
                    { value: 'NIFTY_PHARMA', label: 'Nifty Pharma' },
                    { value: 'NIFTY_PSU_BANK', label: 'Nifty PSU Bank' },
                    { value: 'NIFTY_REALTY', label: 'Nifty Realty' },
                    { value: 'NIFTY_PRIVATE_BANK', label: 'Nifty Private Bank' },
                    { value: 'NIFTY_HEALTHCARE_INDEX', label: 'Nifty Healthcare Index' },
                    { value: 'NIFTY_CONSUMER_DURABLES', label: 'Nifty Consumer Durables' },
                    { value: 'NIFTY_OIL_GAS', label: 'Nifty Oil & Gas' },
                    { value: 'NIFTY_MIDSMALL_HEALTHCARE', label: 'Nifty MidSmall Healthcare' },
                    { value: 'NIFTY_FINANCIAL_SERVICES_EX_BANK', label: 'Nifty Financial Services Ex-Bank' },
                    { value: 'NIFTY_MIDSMALL_FINANCIAL_SERVICES', label: 'Nifty MidSmall Financial Services' },
                    { value: 'NIFTY_MIDSMALL_IT_TELECOM', label: 'Nifty MidSmall IT & Telecom' }
                  ]}
                  value={niftyIndicesFilter}
                  onChange={setNiftyIndicesFilter}
                  placeholder="Select indices..."
                />
              </div>

              <div className="lg:col-span-1 xl:col-span-1">
                <CustomSelect
                  label="Per Page"
                  value={perPage.toString()}
                  onValueChange={(value) => {
                    setPerPage(parseInt(value));
                    setPage(1); // Reset to first page when changing per page
                  }}
                  options={[
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                    { value: '200', label: '200' }
                  ]}
                  placeholder="50"
                  triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
                />
              </div>

              <div className="flex items-end lg:col-span-1 xl:col-span-1">
                <button
                  onClick={() => {
                    setSearch('');
                    setDataQualityFilter('all');
                    setRatiosFilter('all');
                    setNiftyIndicesFilter([]);
                    setSortBy('symbol');
                    setSortOrder('asc');
                    setPage(1);
                  }}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition duration-200 text-sm"
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ratios
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nifty Indices
                    </th>
                    <SortableHeader column="lastUpdated">
                      Last Updated
                    </SortableHeader>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStocks && filteredStocks.length > 0 ? filteredStocks.map((stock) => (
                    <tr key={stock.symbol} className={`hover:bg-gray-50 ${selectedStocks.includes(stock.symbol) ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Checkbox
                          checked={selectedStocks.includes(stock.symbol)}
                          onCheckedChange={() => handleSelectStock(stock.symbol)}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stock.symbol}
                        {stock.exchange && (
                          <div className="text-xs text-gray-500">{stock.exchange}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900" style={{ maxWidth: '150px' }}>
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
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatMarketCap(stock.marketCap)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(stock.currentPrice)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {getStatusBadge(stock)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {stock.hasRatios ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✓ Has Ratios
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            ✗ No Ratios
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {formatNiftyIndices(stock.niftyIndices)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        <div>{formatDate(stock.lastUpdated)}</div>
                        {stock.enteredBy && (
                          <div className="text-xs text-gray-500">by {stock.enteredBy}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/stocks/${stock.symbol}`}
                            className="text-purple-600 hover:text-purple-900"
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
                          <Link
                            href={`/admin/stock-news/${stock.symbol}`}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            News
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-500">
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
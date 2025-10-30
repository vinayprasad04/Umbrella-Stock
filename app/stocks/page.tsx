'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/api-utils';
import { TrendingUp, TrendingDown, Search, Filter, BarChart3, Building2, DollarSign, Percent, RefreshCw } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [livePrices, setLivePrices] = useState<Record<string, {
    price: number;
    change: number;
    changePercent: number;
    loading: boolean;
  }>>({});

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

  // Fetch live prices for visible stocks
  const fetchLivePrices = useCallback(async (symbols: string[]) => {
    // Mark all symbols as loading
    setLivePrices(prev => {
      const updated = { ...prev };
      symbols.forEach(symbol => {
        updated[symbol] = { ...updated[symbol], loading: true } as any;
      });
      return updated;
    });

    // Fetch prices in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (symbol) => {
          try {
            const response = await axios.get(`/api/stocks/live/${symbol}`);
            if (response.data.success) {
              setLivePrices(prev => ({
                ...prev,
                [symbol]: {
                  price: response.data.data.price,
                  change: response.data.data.change,
                  changePercent: response.data.data.changePercent,
                  loading: false,
                },
              }));
            } else {
              setLivePrices(prev => ({
                ...prev,
                [symbol]: { ...prev[symbol], loading: false },
              }));
            }
          } catch (error) {
            console.error(`Failed to fetch price for ${symbol}:`, error);
            setLivePrices(prev => ({
              ...prev,
              [symbol]: { ...prev[symbol], loading: false },
            }));
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }, []);

  // Fetch live prices when data changes
  React.useEffect(() => {
    if (data?.stocks && data.stocks.length > 0) {
      const symbols = data.stocks.map(stock => stock.symbol);
      fetchLivePrices(symbols);
    }
  }, [data?.stocks, fetchLivePrices]);

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

  // Helper to get current price (live or static)
  const getCurrentPrice = (stock: VerifiedStock) => {
    const liveData = livePrices[stock.symbol];
    if (liveData && !liveData.loading && liveData.price) {
      return liveData.price;
    }
    return stock.currentPrice;
  };

  // Helper to get price change data
  const getPriceChange = (stock: VerifiedStock) => {
    const liveData = livePrices[stock.symbol];
    if (liveData && !liveData.loading && liveData.changePercent !== undefined) {
      return {
        change: liveData.change,
        changePercent: liveData.changePercent,
        isLive: true,
      };
    }
    return null;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30">
        <Header />
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-8 pt-[104px] md:pt-[123px] lg:pt-[67px]">
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Error Loading Stocks
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We couldn't load the verified stocks list. Please try again later.
            </p>
            <button
              onClick={() => refetch()}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generate JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Verified Indian Stocks - Live NSE Stock Market Prices',
    description: 'Explore verified Indian stocks with real-time NSE prices, financial analysis, and comprehensive market data.',
    url: 'https://stock.incomegrow.in/stocks',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: data?.total || 0,
      itemListElement: data?.stocks?.slice(0, 10).map((stock, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'FinancialProduct',
          name: stock.companyName,
          identifier: stock.symbol,
          category: stock.sector,
          offers: {
            '@type': 'Offer',
            price: getCurrentPrice(stock),
            priceCurrency: 'INR',
          },
        },
      })) || [],
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://stock.incomegrow.in',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Verified Stocks',
          item: 'https://stock.incomegrow.in/stocks',
        },
      ],
    },
    provider: {
      '@type': 'Organization',
      name: 'IncomeGrow Stock',
      url: 'https://stock.incomegrow.in',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-8 pt-[104px] md:pt-[123px] lg:pt-20" role="main" aria-label="Verified Stocks Page">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                  Verified Stocks
                </h1>
              </div>
              <p className="text-lg text-gray-600 ml-13">
                Explore stocks with verified comprehensive financial data and detailed analysis.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Prices Button */}
              <button
                onClick={() => {
                  if (data?.stocks) {
                    const symbols = data.stocks.map(s => s.symbol);
                    fetchLivePrices(symbols);
                  }
                }}
                disabled={!data?.stocks || Object.values(livePrices).some(p => p?.loading)}
                className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                title="Refresh live prices"
              >
                <RefreshCw className={`w-4 h-4 ${Object.values(livePrices).some(p => p?.loading) ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium hidden sm:inline">Refresh Prices</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'table'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Table View
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Card */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full">Total</div>
              </div>
              <div className="text-4xl font-bold mb-1">{data.total}</div>
              <div className="text-green-100 text-sm font-medium">Verified Stocks</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full">Growth</div>
              </div>
              <div className="text-4xl font-bold mb-1">
                {data.stocks.filter(s => s.salesGrowth && s.salesGrowth > 0).length}
              </div>
              <div className="text-blue-100 text-sm font-medium">Positive Sales Growth</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full">Profit</div>
              </div>
              <div className="text-4xl font-bold mb-1">
                {data.stocks.filter(s => s.profitGrowth && s.profitGrowth > 0).length}
              </div>
              <div className="text-purple-100 text-sm font-medium">Positive Profit Growth</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8" aria-label="Stock Search and Filter">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Search & Filter Stocks</h2>
          </div>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4" role="search">
            <div className="relative">
              <label htmlFor="stock-search" className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="stock-search"
                  name="search"
                  type="text"
                  placeholder="Symbol or company name..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search stocks by symbol or company name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sector-filter" className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="sector-filter"
                  name="sector"
                  type="text"
                  placeholder="Filter by sector..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  aria-label="Filter stocks by sector"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                id="sort-by"
                name="sortBy"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort stocks by criteria"
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
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
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
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        {/* Stocks Display */}
        {viewMode === 'grid' ? (
          /* Grid View */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Verified Stocks ({data?.total || 0})
              </h3>
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data?.stocks && data.stocks.length > 0 ? data.stocks.map((stock) => (
                <Link
                  key={stock.symbol}
                  href={`/stocks/${stock.symbol}`}
                  className="group bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                          {stock.symbol}
                        </h3>
                        {stock.exchange && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {stock.exchange}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-1" title={stock.companyName}>
                        {stock.companyName}
                      </p>
                      {stock.industry && (
                        <p className="text-xs text-gray-500 mt-1">{stock.industry}</p>
                      )}
                    </div>
                  </div>

                  {/* Price & Market Cap */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Current Price</span>
                        {livePrices[stock.symbol]?.loading && (
                          <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        {livePrices[stock.symbol] && !livePrices[stock.symbol].loading && (
                          <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded-full font-medium">
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(getCurrentPrice(stock))}
                        </div>
                        {getPriceChange(stock) && (
                          <div className={`text-xs font-semibold flex items-center gap-1 justify-end ${
                            getPriceChange(stock)!.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {getPriceChange(stock)!.changePercent >= 0 ? '▲' : '▼'}
                            {Math.abs(getPriceChange(stock)!.changePercent).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Market Cap</span>
                      <span className="text-sm font-semibold text-gray-700">
                        {formatNumber(stock.marketCap)}
                      </span>
                    </div>
                  </div>

                  {/* Sector & PE */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg text-center">
                      {stock.sector}
                    </span>
                    <span className="px-3 py-2 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg">
                      P/E: {stock.pe ? stock.pe.toFixed(2) : 'N/A'}
                    </span>
                  </div>

                  {/* Growth Metrics */}
                  <div className="space-y-2">
                    {stock.salesGrowth !== undefined && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-600 font-medium">Sales Growth</span>
                        <div className="flex items-center gap-1">
                          {stock.salesGrowth >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm font-bold ${stock.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stock.salesGrowth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                    {stock.profitGrowth !== undefined && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-600 font-medium">Profit Growth</span>
                        <div className="flex items-center gap-1">
                          {stock.profitGrowth >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm font-bold ${stock.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stock.profitGrowth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              )) : (
                <div className="col-span-full text-center py-12">
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="lg" />
                      <span className="ml-2 text-gray-600">Loading verified stocks...</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <p className="text-lg font-medium mb-2">No verified stocks found</p>
                      <p className="text-sm">Try adjusting your search criteria</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
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
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => handleSort('symbol')}
                      >
                        Symbol {getSortIcon('symbol')}
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => handleSort('companyName')}
                      >
                        Company {getSortIcon('companyName')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Sector
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => handleSort('marketCap')}
                      >
                        Market Cap {getSortIcon('marketCap')}
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => handleSort('currentPrice')}
                      >
                        Price {getSortIcon('currentPrice')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        P/E
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Growth
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {data?.stocks && data.stocks.length > 0 ? data.stocks.map((stock) => (
                      <tr key={stock.symbol} className="hover:bg-green-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-bold text-gray-900">{stock.symbol}</div>
                              {stock.exchange && (
                                <div className="text-xs text-gray-500 mt-0.5">{stock.exchange}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={stock.companyName}>
                            {stock.companyName}
                          </div>
                          {stock.industry && (
                            <div className="text-xs text-gray-500 mt-0.5">{stock.industry}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                            {stock.sector}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatNumber(stock.marketCap)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="text-sm font-bold text-gray-900">
                                {formatCurrency(getCurrentPrice(stock))}
                              </div>
                              {getPriceChange(stock) && (
                                <div className={`text-xs font-semibold flex items-center gap-0.5 ${
                                  getPriceChange(stock)!.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {getPriceChange(stock)!.changePercent >= 0 ? '▲' : '▼'}
                                  {Math.abs(getPriceChange(stock)!.changePercent).toFixed(2)}%
                                </div>
                              )}
                            </div>
                            {livePrices[stock.symbol]?.loading && (
                              <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            )}
                            {livePrices[stock.symbol] && !livePrices[stock.symbol].loading && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-500 text-white rounded font-medium">
                                LIVE
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-sm font-medium bg-purple-50 text-purple-700 rounded">
                            {stock.pe ? stock.pe.toFixed(2) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1.5">
                            {stock.salesGrowth !== undefined && (
                              <div className="flex items-center gap-1">
                                {stock.salesGrowth >= 0 ? (
                                  <TrendingUp className="w-3 h-3 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-600" />
                                )}
                                <span className={`text-xs font-semibold ${stock.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  Sales: {stock.salesGrowth.toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {stock.profitGrowth !== undefined && (
                              <div className="flex items-center gap-1">
                                {stock.profitGrowth >= 0 ? (
                                  <TrendingUp className="w-3 h-3 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-600" />
                                )}
                                <span className={`text-xs font-semibold ${stock.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  Profit: {stock.profitGrowth.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/stocks/${stock.symbol}`}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <LoadingSpinner size="lg" />
                              <span className="ml-2 text-gray-600">Loading verified stocks...</span>
                            </div>
                          ) : (
                            <div className="text-gray-500">
                              <p className="text-lg font-medium mb-2">No verified stocks found</p>
                              <p className="text-sm">Try adjusting your search criteria</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }

        {/* Pagination */}
        {data && data.total > data.limit && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-semibold text-gray-900">{((page - 1) * data.limit) + 1}</span> to{' '}
                  <span className="font-semibold text-gray-900">
                    {Math.min(page * data.limit, data.total)}
                  </span>{' '}
                  of <span className="font-semibold text-gray-900">{data.total}</span> results
                </p>
              </div>
              <div>
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-5 py-2.5 rounded-xl border-2 border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 transition-all"
                  >
                    Previous
                  </button>
                  <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold">
                    Page {page}
                  </div>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * data.limit >= data.total}
                    className="px-5 py-2.5 rounded-xl border-2 border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 transition-all"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
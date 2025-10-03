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

  /* Range slider styles */
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: #6366f1;
    cursor: pointer;
    border-radius: 50%;
    pointer-events: auto;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #6366f1;
    cursor: pointer;
    border-radius: 50%;
    pointer-events: auto;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    border: none;
  }

  input[type="range"]::-webkit-slider-thumb:hover {
    background: #4f46e5;
  }

  input[type="range"]::-moz-range-thumb:hover {
    background: #4f46e5;
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
  returnOnCapitalEmployed: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  dataQuality: string;
  lastUpdated: string;
  allRatios?: { [key: string]: any };
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
    sector: [] as string[],
    niftyIndices: [] as string[],
    minMarketCap: '',
    maxMarketCap: '',
    minPrice: '',
    maxPrice: '',
    minPE: '',
    maxPE: '',
    minROCE: '',
    maxROCE: '',
    minROE: '',
    maxROE: '',
    minDebtToEquity: '',
    maxDebtToEquity: '',
    minPB: '',
    maxPB: '',
    minDividendYield: '',
    maxDividendYield: '',
    sortBy: 'meta.marketCapitalization',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // UI states
  const [selectedLimit, setSelectedLimit] = useState<number>(20);
  const [sectorSearch, setSectorSearch] = useState<string>('');
  const [niftyIndicesSearch, setNiftyIndicesSearch] = useState<string>('');
  const [expandedFilters, setExpandedFilters] = useState<{ [key: string]: boolean }>({
    search: true,
    sector: false,
    niftyIndices: false,
    marketCap: false,
    priceRange: false,
    peRatio: false,
    roce: false,
    roe: false,
    debtToEquity: false,
    pbRatio: false,
    dividendYield: false
  });

  const toggleFilter = (filterName: string) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Helper to show selected range when filter is collapsed
  const getFilterDisplay = (min: string, max: string, defaultMax: string, suffix = '') => {
    if (!min && !max) return null;
    const minVal = min || '0';
    const maxVal = max || defaultMax;
    if (minVal === '0' && maxVal === defaultMax) return null;
    return `${parseFloat(minVal).toLocaleString('en-IN')}${suffix} - ${parseFloat(maxVal).toLocaleString('en-IN')}${suffix}`;
  };

  // All available sectors
  const allSectors = [
    'Automobile',
    'Banks',
    'Consumer Durables',
    'Financial Services',
    'FMCG',
    'Healthcare',
    'IT',
    'IT & Telecom',
    'Media',
    'Metals',
    'Oil & Gas',
    'Pharma',
    'Private Banks',
    'PSU Banks',
    'Realty'
  ];

  // Filter sectors based on search
  const filteredSectors = allSectors.filter(sector =>
    sector.toLowerCase().includes(sectorSearch.toLowerCase())
  );

  // Toggle sector selection
  const toggleSector = (sector: string) => {
    setFilters(prev => ({
      ...prev,
      sector: prev.sector.includes(sector)
        ? prev.sector.filter(s => s !== sector)
        : [...prev.sector, sector]
    }));
  };

  // All available Nifty indices
  const allNiftyIndices = [
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
  ];

  // Filter nifty indices based on search
  const filteredNiftyIndices = allNiftyIndices.filter(index =>
    index.label.toLowerCase().includes(niftyIndicesSearch.toLowerCase())
  );

  // Toggle nifty index selection
  const toggleNiftyIndex = (index: string) => {
    setFilters(prev => ({
      ...prev,
      niftyIndices: prev.niftyIndices.includes(index)
        ? prev.niftyIndices.filter(i => i !== index)
        : [...prev.niftyIndices, index]
    }));
  };

  // Fetch stocks from API
  const fetchStocks = async (page: number = 1, limit: number = 20) => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.minMarketCap && { minMarketCap: filters.minMarketCap }),
        ...(filters.maxMarketCap && { maxMarketCap: filters.maxMarketCap }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.minPE && { minPE: filters.minPE }),
        ...(filters.maxPE && { maxPE: filters.maxPE }),
        ...(filters.minROCE && { minROCE: filters.minROCE }),
        ...(filters.maxROCE && { maxROCE: filters.maxROCE }),
        ...(filters.minROE && { minROE: filters.minROE }),
        ...(filters.maxROE && { maxROE: filters.maxROE }),
        ...(filters.minDebtToEquity && { minDebtToEquity: filters.minDebtToEquity }),
        ...(filters.maxDebtToEquity && { maxDebtToEquity: filters.maxDebtToEquity }),
        ...(filters.minPB && { minPB: filters.minPB }),
        ...(filters.maxPB && { maxPB: filters.maxPB }),
        ...(filters.minDividendYield && { minDividendYield: filters.minDividendYield }),
        ...(filters.maxDividendYield && { maxDividendYield: filters.maxDividendYield }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      // Add multiple sectors as separate query params
      if (filters.sector.length > 0) {
        filters.sector.forEach(sector => {
          queryParams.append('sector', sector);
        });
      }

      // Add multiple nifty indices as separate query params
      if (filters.niftyIndices.length > 0) {
        filters.niftyIndices.forEach(index => {
          queryParams.append('niftyIndices', index);
        });
      }

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

  const resetAllFilters = async () => {
    const resetFilters = {
      search: '',
      sector: [],
      niftyIndices: [],
      minMarketCap: '',
      maxMarketCap: '',
      minPrice: '',
      maxPrice: '',
      minPE: '',
      maxPE: '',
      minROCE: '',
      maxROCE: '',
      minROE: '',
      maxROE: '',
      minDebtToEquity: '',
      maxDebtToEquity: '',
      minPB: '',
      maxPB: '',
      minDividendYield: '',
      maxDividendYield: '',
      sortBy: 'meta.marketCapitalization',
      sortOrder: 'desc'
    };

    setFilters(resetFilters);
    setSectorSearch('');
    setNiftyIndicesSearch('');

    // Fetch stocks with reset filters
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: '1',
        limit: selectedLimit.toString(),
        sortBy: 'meta.marketCapitalization',
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/scanner/stocks?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setStocks(data.data.stocks);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setError('Failed to load stocks');
    } finally {
      setLoading(false);
    }
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
          </div>

        </div>

        <div className="px-6">
          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-full lg:w-[350px] flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-24 flex flex-col" style={{height: 'calc(100vh - 210px)'}}>
                {/* Filters Header - Fixed */}
                <div className="flex items-center justify-between py-5 px-5 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
                  <button
                    onClick={resetAllFilters}
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    Reset all
                  </button>
                </div>

                {/* Filter Categories - Scrollable */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  <div className="space-y-0">
                  {/* Search */}
                  <div className="border-t border-slate-200 px-5">
                    <div className="flex items-center justify-between py-3">
                      <button
                        onClick={() => toggleFilter('search')}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <label className="text-sm font-medium text-slate-700 cursor-pointer">Search</label>
                      </button>
                      <div className="flex items-center gap-2">
                        {filters.search && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            title="Reset filter"
                          >
                            ✕
                          </button>
                        )}
                        <button onClick={() => toggleFilter('search')}>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform ${expandedFilters.search ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {expandedFilters.search && (
                      <div className="pb-3">
                        <input
                          type="text"
                          placeholder="Search by company name or symbol..."
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Sector */}
                  <div className="border-t border-slate-200 px-5">
                    <div className="flex items-center justify-between py-3">
                      <button
                        onClick={() => toggleFilter('sector')}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <label className="text-sm font-medium text-slate-700 cursor-pointer">
                          Sector {filters.sector.length > 0 && <span className="text-indigo-600">({filters.sector.length})</span>}
                        </label>
                      </button>
                      <div className="flex items-center gap-2">
                        {filters.sector.length > 0 && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, sector: [] }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            title="Reset filter"
                          >
                            ✕
                          </button>
                        )}
                        <button onClick={() => toggleFilter('sector')}>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform ${expandedFilters.sector ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {expandedFilters.sector && (
                      <div className="pb-3 space-y-2">
                        {/* Search bar */}
                        <input
                          type="text"
                          placeholder="Search sectors..."
                          value={sectorSearch}
                          onChange={(e) => setSectorSearch(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />

                        {/* Sector checkboxes */}
                        <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
                          {filteredSectors.map((sector) => (
                            <label
                              key={sector}
                              className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={filters.sector.includes(sector)}
                                onChange={() => toggleSector(sector)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-slate-700">{sector}</span>
                            </label>
                          ))}
                        </div>

                        {/* Clear selection */}
                        {filters.sector.length > 0 && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, sector: [] }))}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Clear selection
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stock World (Nifty Indices) */}
                  <div className="border-t border-slate-200 px-5">
                    <div className="flex items-center justify-between py-3">
                      <button
                        onClick={() => toggleFilter('niftyIndices')}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <label className="text-sm font-medium text-slate-700 cursor-pointer">
                          Stock World {filters.niftyIndices.length > 0 && <span className="text-indigo-600">({filters.niftyIndices.length})</span>}
                        </label>
                      </button>
                      <div className="flex items-center gap-2">
                        {filters.niftyIndices.length > 0 && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, niftyIndices: [] }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            title="Reset filter"
                          >
                            ✕
                          </button>
                        )}
                        <button onClick={() => toggleFilter('niftyIndices')}>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform ${expandedFilters.niftyIndices ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {expandedFilters.niftyIndices && (
                      <div className="pb-3 space-y-2">
                        {/* Search bar */}
                        <input
                          type="text"
                          placeholder="Search indices..."
                          value={niftyIndicesSearch}
                          onChange={(e) => setNiftyIndicesSearch(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />

                        {/* Nifty indices checkboxes */}
                        <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
                          {filteredNiftyIndices.map((index) => (
                            <label
                              key={index.value}
                              className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={filters.niftyIndices.includes(index.value)}
                                onChange={() => toggleNiftyIndex(index.value)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-slate-700">{index.label}</span>
                            </label>
                          ))}
                        </div>

                        {/* Clear selection */}
                        {filters.niftyIndices.length > 0 && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, niftyIndices: [] }))}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Clear selection
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Market Cap */}
                  <div className="border-t border-slate-200 px-5">
                    <div className="flex items-center justify-between py-3">
                      <button
                        onClick={() => toggleFilter('marketCap')}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-700 cursor-pointer">Market Cap (₹ Cr)</label>
                          {!expandedFilters.marketCap && getFilterDisplay(filters.minMarketCap, filters.maxMarketCap, '2052200') && (
                            <span className="text-xs text-indigo-600">
                              (₹{getFilterDisplay(filters.minMarketCap, filters.maxMarketCap, '2052200')} Cr)
                            </span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        {(filters.minMarketCap || filters.maxMarketCap) && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minMarketCap: '', maxMarketCap: '' }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            title="Reset filter"
                          >
                            ✕
                          </button>
                        )}
                        <button onClick={() => toggleFilter('marketCap')}>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform ${expandedFilters.marketCap ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {expandedFilters.marketCap && (
                      <div className="pb-3 space-y-3">
                        {/* Range Slider */}
                        <div className="px-1">
                          <div className="flex justify-between text-xs text-slate-600 mb-2">
                            <span>₹{parseInt(filters.minMarketCap || '0').toLocaleString('en-IN')} Cr</span>
                            <span>₹{parseInt(filters.maxMarketCap || '2052200').toLocaleString('en-IN')} Cr</span>
                          </div>
                          <div className="relative h-6 flex items-center">
                            {/* Background track */}
                            <div className="absolute w-full h-1.5 bg-slate-200 rounded-full"></div>

                            {/* Highlighted range in middle */}
                            <div
                              className="absolute h-1.5 bg-indigo-500 rounded-full"
                              style={{
                                left: `${((parseInt(filters.minMarketCap || '0') / 2052200) * 100)}%`,
                                right: `${100 - ((parseInt(filters.maxMarketCap || '2052200') / 2052200) * 100)}%`
                              }}
                            ></div>

                            {/* Min range slider */}
                            <input
                              type="range"
                              min="0"
                              max="2052200"
                              step="1000"
                              value={filters.minMarketCap || 0}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                minMarketCap: e.target.value,
                                maxMarketCap: prev.maxMarketCap && parseInt(e.target.value) > parseInt(prev.maxMarketCap)
                                  ? e.target.value
                                  : prev.maxMarketCap
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />

                            {/* Max range slider */}
                            <input
                              type="range"
                              min="0"
                              max="2052200"
                              step="1000"
                              value={filters.maxMarketCap || 2052200}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                maxMarketCap: e.target.value,
                                minMarketCap: prev.minMarketCap && parseInt(e.target.value) < parseInt(prev.minMarketCap)
                                  ? e.target.value
                                  : prev.minMarketCap
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                          </div>
                        </div>

                        {/* Input Boxes */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Min"
                            value={filters.minMarketCap ? parseInt(filters.minMarketCap).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, minMarketCap: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Max"
                            value={filters.maxMarketCap ? parseInt(filters.maxMarketCap).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, maxMarketCap: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        {/* Preset Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minMarketCap: '0', maxMarketCap: '32500' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minMarketCap === '0' && filters.maxMarketCap === '32500'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Small Cap
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minMarketCap: '32501', maxMarketCap: '99500' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minMarketCap === '32501' && filters.maxMarketCap === '99500'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Mid Cap
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minMarketCap: '99501', maxMarketCap: '2052200' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minMarketCap === '99501' && filters.maxMarketCap === '2052200'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Large Cap
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price Range */}
                  <div className="border-t border-slate-200 px-5">
                    <div className="flex items-center justify-between py-3">
                      <button
                        onClick={() => toggleFilter('priceRange')}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-700 cursor-pointer">Price Range (₹)</label>
                          {!expandedFilters.priceRange && getFilterDisplay(filters.minPrice, filters.maxPrice, '200000') && (
                            <span className="text-xs text-indigo-600">
                              (₹{getFilterDisplay(filters.minPrice, filters.maxPrice, '200000')})
                            </span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        {(filters.minPrice || filters.maxPrice) && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            title="Reset filter"
                          >
                            ✕
                          </button>
                        )}
                        <button onClick={() => toggleFilter('priceRange')}>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform ${expandedFilters.priceRange ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {expandedFilters.priceRange && (
                      <div className="pb-3 space-y-3">
                        {/* Range Slider */}
                        <div className="px-1">
                          <div className="flex justify-between text-xs text-slate-600 mb-2">
                            <span>₹{filters.minPrice ? parseFloat(filters.minPrice).toLocaleString('en-IN') : '0'}</span>
                            <span>₹{filters.maxPrice ? parseFloat(filters.maxPrice).toLocaleString('en-IN') : '1,10,000'}</span>
                          </div>
                          <div className="relative h-6 flex items-center">
                            <div className="absolute w-full h-1.5 bg-slate-200 rounded-full"></div>
                            <div
                              className="absolute h-1.5 bg-indigo-500 rounded-full"
                              style={{
                                left: `${((parseFloat(filters.minPrice || '0') / 110000) * 100)}%`,
                                right: `${100 - ((parseFloat(filters.maxPrice || '110000') / 110000) * 100)}%`
                              }}
                            ></div>
                            <input
                              type="range"
                              min="0"
                              max="110000"
                              step="100"
                              value={filters.minPrice || 0}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                minPrice: e.target.value,
                                maxPrice: prev.maxPrice && parseFloat(e.target.value) > parseFloat(prev.maxPrice)
                                  ? e.target.value
                                  : prev.maxPrice
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                            <input
                              type="range"
                              min="0"
                              max="110000"
                              step="100"
                              value={filters.maxPrice || 110000}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                maxPrice: e.target.value,
                                minPrice: prev.minPrice && parseFloat(e.target.value) < parseFloat(prev.minPrice)
                                  ? e.target.value
                                  : prev.minPrice
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                          </div>
                        </div>

                        {/* Input Boxes */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Min"
                            value={filters.minPrice ? parseFloat(filters.minPrice).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, minPrice: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Max"
                            value={filters.maxPrice ? parseFloat(filters.maxPrice).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, maxPrice: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        {/* Preset Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPrice: '0', maxPrice: '100' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minPrice === '0' && filters.maxPrice === '100'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Low
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPrice: '100.1', maxPrice: '1000' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minPrice === '100.1' && filters.maxPrice === '1000'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Mid
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPrice: '1000.1', maxPrice: '110000' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minPrice === '1000.1' && filters.maxPrice === '110000'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            High
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* P/E Ratio */}
                  <div className="border-t border-slate-200 px-5">
                    <div className="flex items-center justify-between py-3">
                      <button
                        onClick={() => toggleFilter('peRatio')}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-700 cursor-pointer">P/E Ratio</label>
                          {!expandedFilters.peRatio && getFilterDisplay(filters.minPE, filters.maxPE, '100') && (
                            <span className="text-xs text-indigo-600">({getFilterDisplay(filters.minPE, filters.maxPE, '100')})</span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        {(filters.minPE || filters.maxPE) && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPE: '', maxPE: '' }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            title="Reset filter"
                          >
                            ✕
                          </button>
                        )}
                        <button onClick={() => toggleFilter('peRatio')}>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform ${expandedFilters.peRatio ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {expandedFilters.peRatio && (
                      <div className="pb-3 space-y-3">
                        {/* Range Slider */}
                        <div className="px-1">
                          <div className="flex justify-between text-xs text-slate-600 mb-2">
                            <span>{filters.minPE ? parseFloat(filters.minPE).toLocaleString('en-IN') : '0'}</span>
                            <span>{filters.maxPE ? parseFloat(filters.maxPE).toLocaleString('en-IN') : '100'}</span>
                          </div>
                          <div className="relative h-6 flex items-center">
                            <div className="absolute w-full h-1.5 bg-slate-200 rounded-full"></div>
                            <div
                              className="absolute h-1.5 bg-indigo-500 rounded-full"
                              style={{
                                left: `${((parseFloat(filters.minPE || '0') / 100) * 100)}%`,
                                right: `${100 - ((parseFloat(filters.maxPE || '100') / 100) * 100)}%`
                              }}
                            ></div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={filters.minPE || 0}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                minPE: e.target.value,
                                maxPE: prev.maxPE && parseFloat(e.target.value) > parseFloat(prev.maxPE)
                                  ? e.target.value
                                  : prev.maxPE
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={filters.maxPE || 100}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                maxPE: e.target.value,
                                minPE: prev.minPE && parseFloat(e.target.value) < parseFloat(prev.minPE)
                                  ? e.target.value
                                  : prev.minPE
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                          </div>
                        </div>

                        {/* Input Boxes */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Min"
                            value={filters.minPE ? parseFloat(filters.minPE).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, minPE: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Max"
                            value={filters.maxPE ? parseFloat(filters.maxPE).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, maxPE: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        {/* Preset Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPE: '0', maxPE: '15' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minPE === '0' && filters.maxPE === '15'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Low
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPE: '16', maxPE: '25' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minPE === '16' && filters.maxPE === '25'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Mid
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPE: '26', maxPE: '100' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minPE === '26' && filters.maxPE === '100'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            High
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ROCE */}
                  <div className="border-t border-slate-200 px-5">
                    <div className="flex items-center justify-between py-3">
                      <button
                        onClick={() => toggleFilter('roce')}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-700 cursor-pointer">ROCE (%)</label>
                          {!expandedFilters.roce && getFilterDisplay(filters.minROCE, filters.maxROCE, '50', '%') && (
                            <span className="text-xs text-indigo-600">({getFilterDisplay(filters.minROCE, filters.maxROCE, '50', '%')})</span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        {(filters.minROCE || filters.maxROCE) && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minROCE: '', maxROCE: '' }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            title="Reset filter"
                          >
                            ✕
                          </button>
                        )}
                        <button onClick={() => toggleFilter('roce')}>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform ${expandedFilters.roce ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {expandedFilters.roce && (
                      <div className="pb-3 space-y-3">
                        <div className="px-1">
                          <div className="flex justify-between text-xs text-slate-600 mb-2">
                            <span>{filters.minROCE ? parseFloat(filters.minROCE).toLocaleString('en-IN') : '0'}%</span>
                            <span>{filters.maxROCE ? parseFloat(filters.maxROCE).toLocaleString('en-IN') : '50'}%</span>
                          </div>
                          <div className="relative h-6 flex items-center">
                            <div className="absolute w-full h-1.5 bg-slate-200 rounded-full"></div>
                            <div
                              className="absolute h-1.5 bg-indigo-500 rounded-full"
                              style={{
                                left: `${((parseFloat(filters.minROCE || '0') / 50) * 100)}%`,
                                right: `${100 - ((parseFloat(filters.maxROCE || '50') / 50) * 100)}%`
                              }}
                            ></div>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="0.5"
                              value={filters.minROCE || 0}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                minROCE: e.target.value,
                                maxROCE: prev.maxROCE && parseFloat(e.target.value) > parseFloat(prev.maxROCE)
                                  ? e.target.value
                                  : prev.maxROCE
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="0.5"
                              value={filters.maxROCE || 50}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                maxROCE: e.target.value,
                                minROCE: prev.minROCE && parseFloat(e.target.value) < parseFloat(prev.minROCE)
                                  ? e.target.value
                                  : prev.minROCE
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Min"
                            value={filters.minROCE ? parseFloat(filters.minROCE).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, minROCE: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Max"
                            value={filters.maxROCE ? parseFloat(filters.maxROCE).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, maxROCE: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minROCE: '0', maxROCE: '10' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minROCE === '0' && filters.maxROCE === '10'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Low
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minROCE: '11', maxROCE: '20' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minROCE === '11' && filters.maxROCE === '20'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Mid
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minROCE: '21', maxROCE: '50' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minROCE === '21' && filters.maxROCE === '50'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            High
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ROE */}
                  <div className="border-t border-slate-200 px-5">
                    <div className="flex items-center justify-between py-3">
                      <button
                        onClick={() => toggleFilter('roe')}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-700 cursor-pointer">ROE (%)</label>
                          {!expandedFilters.roe && getFilterDisplay(filters.minROE, filters.maxROE, '50', '%') && (
                            <span className="text-xs text-indigo-600">({getFilterDisplay(filters.minROE, filters.maxROE, '50', '%')})</span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        {(filters.minROE || filters.maxROE) && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minROE: '', maxROE: '' }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            title="Reset filter"
                          >
                            ✕
                          </button>
                        )}
                        <button onClick={() => toggleFilter('roe')}>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform ${expandedFilters.roe ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {expandedFilters.roe && (
                      <div className="pb-3 space-y-3">
                        <div className="px-1">
                          <div className="flex justify-between text-xs text-slate-600 mb-2">
                            <span>{filters.minROE ? parseFloat(filters.minROE).toLocaleString('en-IN') : '0'}%</span>
                            <span>{filters.maxROE ? parseFloat(filters.maxROE).toLocaleString('en-IN') : '50'}%</span>
                          </div>
                          <div className="relative h-6 flex items-center">
                            <div className="absolute w-full h-1.5 bg-slate-200 rounded-full"></div>
                            <div
                              className="absolute h-1.5 bg-indigo-500 rounded-full"
                              style={{
                                left: `${((parseFloat(filters.minROE || '0') / 50) * 100)}%`,
                                right: `${100 - ((parseFloat(filters.maxROE || '50') / 50) * 100)}%`
                              }}
                            ></div>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="0.5"
                              value={filters.minROE || 0}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                minROE: e.target.value,
                                maxROE: prev.maxROE && parseFloat(e.target.value) > parseFloat(prev.maxROE)
                                  ? e.target.value
                                  : prev.maxROE
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="0.5"
                              value={filters.maxROE || 50}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                maxROE: e.target.value,
                                minROE: prev.minROE && parseFloat(e.target.value) < parseFloat(prev.minROE)
                                  ? e.target.value
                                  : prev.minROE
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Min"
                            value={filters.minROE ? parseFloat(filters.minROE).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, minROE: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Max"
                            value={filters.maxROE ? parseFloat(filters.maxROE).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, maxROE: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minROE: '0', maxROE: '10' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minROE === '0' && filters.maxROE === '10'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Low
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minROE: '11', maxROE: '20' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minROE === '11' && filters.maxROE === '20'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Mid
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minROE: '21', maxROE: '50' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minROE === '21' && filters.maxROE === '50'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            High
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Debt-to-Equity */}
                  <div className="border-t border-slate-200 px-5">
                    <div className="flex items-center justify-between py-3">
                      <button
                        onClick={() => toggleFilter('debtToEquity')}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-700 cursor-pointer">Debt-to-Equity</label>
                          {!expandedFilters.debtToEquity && getFilterDisplay(filters.minDebtToEquity, filters.maxDebtToEquity, '5') && (
                            <span className="text-xs text-indigo-600">({getFilterDisplay(filters.minDebtToEquity, filters.maxDebtToEquity, '5')})</span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        {(filters.minDebtToEquity || filters.maxDebtToEquity) && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minDebtToEquity: '', maxDebtToEquity: '' }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            title="Reset filter"
                          >
                            ✕
                          </button>
                        )}
                        <button onClick={() => toggleFilter('debtToEquity')}>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform ${expandedFilters.debtToEquity ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {expandedFilters.debtToEquity && (
                      <div className="pb-3 space-y-3">
                        <div className="px-1">
                          <div className="flex justify-between text-xs text-slate-600 mb-2">
                            <span>{filters.minDebtToEquity ? parseFloat(filters.minDebtToEquity).toLocaleString('en-IN') : '0'}</span>
                            <span>{filters.maxDebtToEquity ? parseFloat(filters.maxDebtToEquity).toLocaleString('en-IN') : '5'}</span>
                          </div>
                          <div className="relative h-6 flex items-center">
                            <div className="absolute w-full h-1.5 bg-slate-200 rounded-full"></div>
                            <div
                              className="absolute h-1.5 bg-indigo-500 rounded-full"
                              style={{
                                left: `${((parseFloat(filters.minDebtToEquity || '0') / 5) * 100)}%`,
                                right: `${100 - ((parseFloat(filters.maxDebtToEquity || '5') / 5) * 100)}%`
                              }}
                            ></div>
                            <input
                              type="range"
                              min="0"
                              max="5"
                              step="0.1"
                              value={filters.minDebtToEquity || 0}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                minDebtToEquity: e.target.value,
                                maxDebtToEquity: prev.maxDebtToEquity && parseFloat(e.target.value) > parseFloat(prev.maxDebtToEquity)
                                  ? e.target.value
                                  : prev.maxDebtToEquity
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                            <input
                              type="range"
                              min="0"
                              max="5"
                              step="0.1"
                              value={filters.maxDebtToEquity || 5}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                maxDebtToEquity: e.target.value,
                                minDebtToEquity: prev.minDebtToEquity && parseFloat(e.target.value) < parseFloat(prev.minDebtToEquity)
                                  ? e.target.value
                                  : prev.minDebtToEquity
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Min"
                            value={filters.minDebtToEquity ? parseFloat(filters.minDebtToEquity).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, minDebtToEquity: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Max"
                            value={filters.maxDebtToEquity ? parseFloat(filters.maxDebtToEquity).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, maxDebtToEquity: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minDebtToEquity: '0', maxDebtToEquity: '0.5' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minDebtToEquity === '0' && filters.maxDebtToEquity === '0.5'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Low
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minDebtToEquity: '0.6', maxDebtToEquity: '1.5' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minDebtToEquity === '0.6' && filters.maxDebtToEquity === '1.5'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Mid
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minDebtToEquity: '1.6', maxDebtToEquity: '5' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minDebtToEquity === '1.6' && filters.maxDebtToEquity === '5'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            High
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* P/B Ratio */}
                  <div className="border-t border-slate-200 px-5">
                    <div className="flex items-center justify-between py-3">
                      <button
                        onClick={() => toggleFilter('pbRatio')}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-700 cursor-pointer">P/B Ratio</label>
                          {!expandedFilters.pbRatio && getFilterDisplay(filters.minPB, filters.maxPB, '20') && (
                            <span className="text-xs text-indigo-600">({getFilterDisplay(filters.minPB, filters.maxPB, '20')})</span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        {(filters.minPB || filters.maxPB) && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPB: '', maxPB: '' }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            title="Reset filter"
                          >
                            ✕
                          </button>
                        )}
                        <button onClick={() => toggleFilter('pbRatio')}>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform ${expandedFilters.pbRatio ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {expandedFilters.pbRatio && (
                      <div className="pb-3 space-y-3">
                        <div className="px-1">
                          <div className="flex justify-between text-xs text-slate-600 mb-2">
                            <span>{filters.minPB ? parseFloat(filters.minPB).toLocaleString('en-IN') : '0'}</span>
                            <span>{filters.maxPB ? parseFloat(filters.maxPB).toLocaleString('en-IN') : '20'}</span>
                          </div>
                          <div className="relative h-6 flex items-center">
                            <div className="absolute w-full h-1.5 bg-slate-200 rounded-full"></div>
                            <div
                              className="absolute h-1.5 bg-indigo-500 rounded-full"
                              style={{
                                left: `${((parseFloat(filters.minPB || '0') / 20) * 100)}%`,
                                right: `${100 - ((parseFloat(filters.maxPB || '20') / 20) * 100)}%`
                              }}
                            ></div>
                            <input
                              type="range"
                              min="0"
                              max="20"
                              step="0.5"
                              value={filters.minPB || 0}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                minPB: e.target.value,
                                maxPB: prev.maxPB && parseFloat(e.target.value) > parseFloat(prev.maxPB)
                                  ? e.target.value
                                  : prev.maxPB
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                            <input
                              type="range"
                              min="0"
                              max="20"
                              step="0.5"
                              value={filters.maxPB || 20}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                maxPB: e.target.value,
                                minPB: prev.minPB && parseFloat(e.target.value) < parseFloat(prev.minPB)
                                  ? e.target.value
                                  : prev.minPB
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Min"
                            value={filters.minPB ? parseFloat(filters.minPB).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, minPB: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Max"
                            value={filters.maxPB ? parseFloat(filters.maxPB).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, maxPB: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPB: '0', maxPB: '3' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minPB === '0' && filters.maxPB === '3'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Low
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPB: '3.1', maxPB: '6' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minPB === '3.1' && filters.maxPB === '6'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Mid
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minPB: '6.1', maxPB: '20' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minPB === '6.1' && filters.maxPB === '20'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            High
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dividend Yield */}
                  <div className="border-t border-b border-slate-200 px-5">
                    <div className="flex items-center justify-between py-3">
                      <button
                        onClick={() => toggleFilter('dividendYield')}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-700 cursor-pointer">Dividend Yield (%)</label>
                          {!expandedFilters.dividendYield && getFilterDisplay(filters.minDividendYield, filters.maxDividendYield, '10', '%') && (
                            <span className="text-xs text-indigo-600">({getFilterDisplay(filters.minDividendYield, filters.maxDividendYield, '10', '%')})</span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        {(filters.minDividendYield || filters.maxDividendYield) && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minDividendYield: '', maxDividendYield: '' }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                            title="Reset filter"
                          >
                            ✕
                          </button>
                        )}
                        <button onClick={() => toggleFilter('dividendYield')}>
                          <svg
                            className={`w-4 h-4 text-slate-500 transition-transform ${expandedFilters.dividendYield ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {expandedFilters.dividendYield && (
                      <div className="pb-3 space-y-3">
                        <div className="px-1">
                          <div className="flex justify-between text-xs text-slate-600 mb-2">
                            <span>{filters.minDividendYield ? parseFloat(filters.minDividendYield).toLocaleString('en-IN') : '0'}%</span>
                            <span>{filters.maxDividendYield ? parseFloat(filters.maxDividendYield).toLocaleString('en-IN') : '10'}%</span>
                          </div>
                          <div className="relative h-6 flex items-center">
                            <div className="absolute w-full h-1.5 bg-slate-200 rounded-full"></div>
                            <div
                              className="absolute h-1.5 bg-indigo-500 rounded-full"
                              style={{
                                left: `${((parseFloat(filters.minDividendYield || '0') / 10) * 100)}%`,
                                right: `${100 - ((parseFloat(filters.maxDividendYield || '10') / 10) * 100)}%`
                              }}
                            ></div>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              step="0.1"
                              value={filters.minDividendYield || 0}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                minDividendYield: e.target.value,
                                maxDividendYield: prev.maxDividendYield && parseFloat(e.target.value) > parseFloat(prev.maxDividendYield)
                                  ? e.target.value
                                  : prev.maxDividendYield
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                            <input
                              type="range"
                              min="0"
                              max="10"
                              step="0.1"
                              value={filters.maxDividendYield || 10}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                maxDividendYield: e.target.value,
                                minDividendYield: prev.minDividendYield && parseFloat(e.target.value) < parseFloat(prev.minDividendYield)
                                  ? e.target.value
                                  : prev.minDividendYield
                              }))}
                              className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                              style={{ height: '1.5rem' }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Min"
                            value={filters.minDividendYield ? parseFloat(filters.minDividendYield).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, minDividendYield: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Max"
                            value={filters.maxDividendYield ? parseFloat(filters.maxDividendYield).toLocaleString('en-IN') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              if (value === '' || !isNaN(Number(value))) {
                                setFilters(prev => ({ ...prev, maxDividendYield: value }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minDividendYield: '0', maxDividendYield: '1' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minDividendYield === '0' && filters.maxDividendYield === '1'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Low
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minDividendYield: '1.1', maxDividendYield: '3' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minDividendYield === '1.1' && filters.maxDividendYield === '3'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            Mid
                          </button>
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, minDividendYield: '3.1', maxDividendYield: '10' }))}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              filters.minDividendYield === '3.1' && filters.maxDividendYield === '10'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                            }`}
                          >
                            High
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                {/* Apply Button - Fixed */}
                <div className="border-t border-slate-200 px-5 py-4">
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
            <div className="flex-1 min-w-0">
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
                  </div>
                </div>
              </div>

              {/* Stock Cards Grid */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-auto scrollbar-thin" style={{minHeight: 'calc(100vh - 369px)', maxHeight: 'calc(100vh - 369px)'}}>
                  <table className="w-full min-h-full">
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
                          <button onClick={() => handleSort('returnOnEquity')} className="flex items-center gap-1 hover:text-indigo-600">
                            ROE {getSortIcon('returnOnEquity')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('returnOnCapitalEmployed')} className="flex items-center gap-1 hover:text-indigo-600">
                            ROCE {getSortIcon('returnOnCapitalEmployed')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('pbRatio')} className="flex items-center gap-1 hover:text-indigo-600">
                            P/B {getSortIcon('pbRatio')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('debtToEquity')} className="flex items-center gap-1 hover:text-indigo-600">
                            Debt/Equity {getSortIcon('debtToEquity')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('dividendYield')} className="flex items-center gap-1 hover:text-indigo-600">
                            Div Yield {getSortIcon('dividendYield')}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                              Loading stocks...
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-red-500">
                            {error}
                          </td>
                        </tr>
                      ) : stocks.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
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
                                  {stock.peRatio.toFixed(2)}
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
                            <td className="px-4 py-4">
                              {stock.returnOnCapitalEmployed != null ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-purple-500 rounded-full"
                                      style={{ width: `${Math.min(stock.returnOnCapitalEmployed * 1.67, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-slate-900">{stock.returnOnCapitalEmployed.toFixed(1)}%</span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {stock.pbRatio != null ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                  {stock.pbRatio.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {stock.debtToEquity != null ? (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  stock.debtToEquity < 0.5 ? 'bg-green-100 text-green-800' :
                                  stock.debtToEquity < 1 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {stock.debtToEquity.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {stock.dividendYield != null ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                                  {stock.dividendYield.toFixed(2)}%
                                </span>
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
              {!loading && !error && (
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
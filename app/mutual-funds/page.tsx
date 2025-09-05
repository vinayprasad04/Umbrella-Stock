'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { FilterSelect } from '@/components/ui/custom-select';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-cyan-400/5 to-blue-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <Header />

      <main className="w-full max-w-[1800px] mx-auto px-6 py-12 pt-[104px] md:pt-[123px] lg:pt-[67px] relative z-10">
        {/* Enhanced Header Section */}
        <div className="mb-16 pt-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-6">
              <Link 
                href="/" 
                className="group flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/60 text-gray-700 hover:text-blue-700 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md hover:scale-105"
              >
                <span className="mr-2 text-lg transition-transform group-hover:-translate-x-1">←</span>
                <span className="font-semibold">Back to Home</span>
              </Link>
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-700">Live Data</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{funds.length} funds loaded</span>
              </div>
              <button
                onClick={() => refetch()}
                className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span className="mr-2 text-lg group-hover:rotate-180 transition-transform duration-500">🔄</span>
                Refresh Data
              </button>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-600/10 rounded-full text-sm font-medium text-gray-700 mb-6 backdrop-blur-sm border border-blue-200/50">
              <div className="w-2 h-2 rounded-full mr-2 bg-blue-400"></div>
              Mutual Funds • Performance Analytics
            </div>
            
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-700 to-blue-800 mb-4 leading-tight">
              Indian Mutual Funds
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Discover, analyze, and compare India's top-performing mutual funds with
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold"> comprehensive performance metrics</span>,
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold"> expense ratios</span>, and
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold"> fund house analysis</span>
            </p>
            
            {/* Quick Action Cards */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/60 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <span className="text-2xl">📈</span>
                <span className="font-semibold text-gray-700">Performance Tracking</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/60 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <span className="text-2xl">🎯</span>
                <span className="font-semibold text-gray-700">Smart Filtering</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/60 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <span className="text-2xl">💎</span>
                <span className="font-semibold text-gray-700">Premium Analysis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Stats Summary */}
        {processedFunds && processedFunds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-xl rounded-2xl p-6 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg">📊</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">
                  {processedFunds.length}
                </div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total Funds</div>
              </div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 backdrop-blur-xl rounded-2xl p-6 border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg">🚀</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
                  +{Math.max(...processedFunds.map((fund: MutualFundData) => fund.returns1Y || 0)).toFixed(1)}%
                </div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">Best 1Y Return</div>
              </div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-indigo-50 to-purple-50 backdrop-blur-xl rounded-2xl p-6 border border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg">📈</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  {(processedFunds.reduce((sum: number, fund: MutualFundData) => sum + (fund.returns1Y || 0), 0) / processedFunds.length).toFixed(1)}%
                </div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">Avg 1Y Return</div>
              </div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-orange-50 to-red-50 backdrop-blur-xl rounded-2xl p-6 border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-red-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg">💰</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
                  {Math.min(...processedFunds.filter((fund: MutualFundData) => fund.expenseRatio).map((fund: MutualFundData) => fund.expenseRatio || 0)).toFixed(2)}%
                </div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">Lowest Expense</div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filter Controls */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/20 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-2xl mb-10 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-100/80 to-cyan-100/80 backdrop-blur-sm rounded-2xl border border-blue-200/50 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">🎯</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">
                  Advanced search and filtering for precise fund selection
                </span>
              </div>
             
            </div>

            {/* Enhanced Search Section - Separate */}
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-4xl">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-focus-within:scale-110 transition-transform duration-300">
                      <span className="text-white text-lg">🔍</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by fund name, scheme code, fund house..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-16 pr-12 py-4 bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 rounded-2xl text-base font-medium placeholder:text-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl focus:bg-white group-focus-within:scale-[1.02]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-xl bg-gray-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all duration-200 shadow-md"
                    >
                      <span className="font-bold">×</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 items-start justify-center">

              {/* Enhanced Filters Section */}
              <div className="flex flex-wrap gap-8 items-end max-w-4xl">
                {/* Premium Limit Control */}
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <span className="text-blue-500">📊</span>
                    Results Limit
                  </label>
                  <div className="flex gap-8">
                    {[10, 20, 50, 100].map((count) => (
                      <button
                        key={count}
                        onClick={() => setLimit(count)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${
                          limit === count
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white scale-105 shadow-blue-500/25'
                            : 'bg-white/90 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:scale-105 border border-gray-200/60'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enhanced Category Filter */}
                <div className="min-w-[160px]">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-green-500">🏷️</span>
                    Category
                  </label>
                  <FilterSelect
                    value={selectedCategory}
                    onValueChange={(value) => setSelectedCategory(value)}
                    placeholder="All Categories"
                    variant="form"
                    options={categories.map((category) => ({
                      value: category,
                      label: category === 'all' ? 'All Categories' : category,
                    }))}
                  />
                </div>

                {/* Enhanced Fund House Filter */}
                <div className="min-w-[160px]">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-purple-500">🏛️</span>
                    Fund House
                  </label>
                  <FilterSelect
                    value={selectedFundHouse}
                    onValueChange={(value) => setSelectedFundHouse(value)}
                    placeholder="All Fund Houses"
                    variant="form"
                    options={fundHouses.map((fundHouse) => ({
                      value: fundHouse,
                      label: fundHouse === 'all' ? 'All Fund Houses' : fundHouse,
                    }))}
                  />
                </div>

                {/* Enhanced Sort Control */}
                <div className="min-w-[160px]">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <span className="text-orange-500">⚡</span>
                    Sort By
                  </label>
                  <FilterSelect
                    value={sortBy}
                    onValueChange={(value) => setSortBy(value)}
                    placeholder="Sort Option"
                    variant="form"
                    options={[
                      { value: 'returns1Y', label: '📈 1 Year Returns' },
                      { value: 'returns3Y', label: '📊 3 Year Returns' },
                      { value: 'returns5Y', label: '🚀 5 Year Returns' },
                      { value: 'nav', label: '💰 NAV (High to Low)' },
                      { value: 'aum', label: '🏦 AUM (High to Low)' },
                      { value: 'expenseRatio', label: '💸 Expense Ratio (Low to High)' },
                    ]}
                  />
                </div>
              </div>
            </div>
            
          {/* Active Filters */}
          {(selectedCategory !== 'all' || selectedFundHouse !== 'all' || searchQuery) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 mr-2">Active Filters:</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                    {selectedCategory}
                    <button 
                      onClick={() => setSelectedCategory('all')}
                      className="ml-2 w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center transition-all duration-200"
                    >
                      <span className="text-blue-700 text-xs font-bold">×</span>
                    </button>
                  </span>
                )}
                {selectedFundHouse !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {selectedFundHouse}
                    <button 
                      onClick={() => setSelectedFundHouse('all')}
                      className="ml-2 w-4 h-4 rounded-full bg-emerald-200 hover:bg-emerald-300 flex items-center justify-center transition-all duration-200"
                    >
                      <span className="text-emerald-700 text-xs font-bold">×</span>
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                    "{searchQuery.length > 15 ? searchQuery.substring(0, 15) + '...' : searchQuery}"
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="ml-2 w-4 h-4 rounded-full bg-purple-200 hover:bg-purple-300 flex items-center justify-center transition-all duration-200"
                    >
                      <span className="text-purple-700 text-xs font-bold">×</span>
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedFundHouse('all');
                    setSearchQuery('');
                  }}
                  className="ml-2 px-3 py-1 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
          </div>
        </div>


        {/* Premium Main Content Container */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/70 shadow-3xl relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-cyan-500 via-indigo-500 to-purple-500"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-cyan-50/20 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">💎</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                    Premium Fund Collection
                  </h2>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                        {selectedCategory === 'all' ? '🏷️ All Categories' : `🏷️ ${selectedCategory}`}
                      </span>
                      {selectedFundHouse !== 'all' && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                          🏛️ {selectedFundHouse}
                        </span>
                      )}
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                        ⚡ Sorted by {sortBy === 'returns1Y' ? '1Y Returns' : 
                                      sortBy === 'returns3Y' ? '3Y Returns' :
                                      sortBy === 'returns5Y' ? '5Y Returns' :
                                      sortBy === 'nav' ? 'NAV' :
                                      sortBy === 'aum' ? 'AUM' : 'Expense Ratio'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                {processedFunds && processedFunds.length > 0 && (
                  <div className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl border border-gray-300 shadow-lg">
                    <div className="text-xl font-bold text-gray-800">{processedFunds.length}</div>
                    <div className="text-sm font-medium text-gray-600">Funds Found</div>
                  </div>
                )}
              </div>
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
    return value >= 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const getReturnBgColor = (value?: number) => {
    if (!value) return 'bg-gray-100';
    return value >= 0 ? 'bg-gradient-to-r from-emerald-50 to-teal-50' : 'bg-gradient-to-r from-red-50 to-orange-50';
  };

  const getFundIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Large Cap': '🏢',
      'Mid Cap': '🏗️',
      'Small Cap': '🌟',
      'Flexi Cap': '🎯',
      'Index Fund': '📊',
      'Debt': '🏛️',
      'Hybrid': '⚖️',
      'Equity': '📈',
      'ELSS': '💰',
    };
    return icons[category] || '💎';
  };

  return (
    <Link href={`/mutual-funds/${fund.schemeCode}`} className="block group">
      <div className="relative bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-white/60 hover:border-blue-200 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden">
        {/* Subtle decorative gradient */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
        
        <div className="relative z-10">
          {/* Enhanced Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <span className="text-white text-base">{getFundIcon(fund.category)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
                  {fund.schemeName.length > 45 ? fund.schemeName.substring(0, 45) + '...' : fund.schemeName}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-lg border border-blue-200 font-semibold">
                    {fund.fundHouse || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Prominent NAV/Price Section */}
            <div className="text-right bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl px-3 py-2 border border-blue-200 shadow-md">
              <div className="text-lg font-black text-gray-900 mb-0.5">
                {fund.nav ? `₹${fund.nav.toFixed(4)}` : 'N/A'}
              </div>
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">NAV</div>
            </div>
          </div>

          {/* Enhanced Performance Section */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`text-center py-2 px-2 rounded-lg border ${getReturnBgColor(fund.returns1Y)} ${fund.returns1Y && fund.returns1Y >= 0 ? 'border-emerald-200' : 'border-red-200'}`}>
              <div className="text-xs text-gray-600 mb-1 font-medium">1Y</div>
              <div className={`text-sm font-bold ${getReturnColor(fund.returns1Y)}`}>
                {fund.returns1Y ? `${fund.returns1Y >= 0 ? '+' : ''}${fund.returns1Y.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className={`text-center py-2 px-2 rounded-lg border ${getReturnBgColor(fund.returns3Y)} ${fund.returns3Y && fund.returns3Y >= 0 ? 'border-emerald-200' : 'border-red-200'}`}>
              <div className="text-xs text-gray-600 mb-1 font-medium">3Y</div>
              <div className={`text-sm font-bold ${getReturnColor(fund.returns3Y)}`}>
                {fund.returns3Y ? `${fund.returns3Y >= 0 ? '+' : ''}${fund.returns3Y.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className={`text-center py-2 px-2 rounded-lg border ${getReturnBgColor(fund.returns5Y)} ${fund.returns5Y && fund.returns5Y >= 0 ? 'border-emerald-200' : 'border-red-200'}`}>
              <div className="text-xs text-gray-600 mb-1 font-medium">5Y</div>
              <div className={`text-sm font-bold ${getReturnColor(fund.returns5Y)}`}>
                {fund.returns5Y ? `${fund.returns5Y >= 0 ? '+' : ''}${fund.returns5Y.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
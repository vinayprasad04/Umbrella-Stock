'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { useState } from 'react';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FilterSelect } from '@/components/ui/custom-select';
import { Sector } from '@/types';

export default function SectorsPage() {
  const [sortBy, setSortBy] = useState('performance');
  const [filterPerformance, setFilterPerformance] = useState('all');

  const { data: sectors, isLoading, refetch } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const response = await axios.get('/api/sectors');
      return response.data.data as Sector[];
    },
    refetchInterval: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    retryDelay: 5000,
  });

  // Filter and sort sectors
  const processedSectors = sectors
    ?.filter(sector => {
      if (filterPerformance === 'positive') return sector.performance >= 0;
      if (filterPerformance === 'negative') return sector.performance < 0;
      return true;
    })
    ?.sort((a, b) => {
      if (sortBy === 'performance') return b.performance - a.performance;
      if (sortBy === 'stockCount') return b.stockCount - a.stockCount;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    }) || [];

  const getSectorIcon = (name: string) => {
    const icons: Record<string, string> = {
      'Information Technology': '💻',
      'Banking & Financial Services': '💰',
      'Healthcare & Pharmaceuticals': '🏥',
      'Consumer Goods': '🛒',
      'Automotive': '🚗',
      'Energy & Power': '⚡',
      'Metals & Mining': '🏗️',
      'Telecom': '📡',
      'Infrastructure': '🏢',
      'Textiles': '👔',
    };
    return icons[name] || '📊';
  };

  const getBestWorstSectors = () => {
    if (!sectors || sectors.length === 0) return { best: null, worst: null };
    const sorted = [...sectors].sort((a, b) => b.performance - a.performance);
    return { best: sorted[0], worst: sorted[sorted.length - 1] };
  };

  const { best, worst } = getBestWorstSectors();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-6 py-12 pt-[104px] md:pt-[123px] lg:pt-[67px]">
        {/* Enhanced Header Section */}
        <div className="mb-12 pt-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <span className="mr-2">←</span>
                <span className="font-medium">Back to Home</span>
              </Link>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300"
            >
              <span className="mr-2">🔄</span>
              Refresh Data
            </button>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 rounded-full text-sm font-medium text-gray-700 mb-6 backdrop-blur-sm border border-indigo-200/50">
              <div className="w-2 h-2 rounded-full mr-2 bg-indigo-400"></div>
              Market Sectors • Live Performance Tracker
            </div>
            
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-800 mb-4 leading-tight">
              Indian Market Sectors
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Track performance across all major Indian market sectors with real-time data and comprehensive analytics
            </p>
          </div>
        </div>

        {/* Market Overview Cards */}
        {sectors && sectors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🏆</span>
                </div>
                <div>
                  <h3 className="font-bold text-green-700">Best Performer</h3>
                  <p className="text-sm text-green-600">Today's top sector</p>
                </div>
              </div>
              {best && (
                <>
                  <p className="font-bold text-lg text-gray-900 mb-1">{best.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">+{best.performance.toFixed(2)}%</span>
                    <span className="text-sm text-gray-500">{best.stockCount} stocks</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-100 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">📉</span>
                </div>
                <div>
                  <h3 className="font-bold text-red-700">Needs Attention</h3>
                  <p className="text-sm text-red-600">Underperforming sector</p>
                </div>
              </div>
              {worst && (
                <>
                  <p className="font-bold text-lg text-gray-900 mb-1">{worst.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-red-600">{worst.performance.toFixed(2)}%</span>
                    <span className="text-sm text-gray-500">{worst.stockCount} stocks</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">📊</span>
                </div>
                <div>
                  <h3 className="font-bold text-blue-700">Market Overview</h3>
                  <p className="text-sm text-blue-600">Total sectors tracked</p>
                </div>
              </div>
              <p className="font-bold text-lg text-gray-900 mb-1">Indian Markets</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">{sectors.length}</span>
                <span className="text-sm text-gray-500">Active sectors</span>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Sort Controls */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Performance Filter */}
            <FilterSelect
              label="Filter by Performance:"
              value={filterPerformance}
              onValueChange={(value) => setFilterPerformance(value)}
              placeholder="Select performance filter"
              variant="filter"
              options={[
                { value: 'all', label: 'All Sectors' },
                { value: 'positive', label: 'Positive Performance' },
                { value: 'negative', label: 'Negative Performance' },
              ]}
            />

            {/* Sort Control */}
            <FilterSelect
              label="Sort by:"
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
              placeholder="Select sort option"
              variant="filter"
              options={[
                { value: 'performance', label: 'Performance' },
                { value: 'stockCount', label: 'Stock Count' },
                { value: 'name', label: 'Alphabetical' },
              ]}
            />

            {/* Results Summary */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {processedSectors.length} of {sectors?.length || 0} sectors
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Sectors Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="bg-white/50 rounded-2xl p-6 border border-white/50 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-3 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedSectors.map((sector, index) => (
              <SectorCard key={sector.name} sector={sector} rank={index + 1} getSectorIcon={getSectorIcon} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface SectorCardProps {
  sector: Sector;
  rank: number;
  getSectorIcon: (name: string) => string;
}

function SectorCard({ sector, rank, getSectorIcon }: SectorCardProps) {
  const isPositive = sector.performance >= 0;

  const getPerformanceColor = (performance: number) => {
    if (performance >= 2) return 'from-emerald-500 to-green-500';
    if (performance >= 1) return 'from-green-400 to-emerald-400';
    if (performance >= 0) return 'from-yellow-400 to-orange-400';
    if (performance >= -1) return 'from-orange-400 to-red-400';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 p-6 hover:bg-white/90 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
      {/* Gradient Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Rank Badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          #{rank}
        </div>
      </div>

      <div className="relative z-10">
        {/* Header with Icon and Info */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <span className="text-xl">
              {getSectorIcon(sector.name)}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2 group-hover:text-indigo-700 transition-colors duration-300">
              {sector.name}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {sector.stockCount} stocks
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Today's Performance</span>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
              isPositive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <span className="mr-1 text-xs">
                {isPositive ? '📈' : '📉'}
              </span>
              {isPositive ? '+' : ''}{sector.performance.toFixed(2)}%
            </div>
          </div>
          
          {/* Performance Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full bg-gradient-to-r ${getPerformanceColor(sector.performance)} transition-all duration-500 shadow-inner`}
              style={{ width: `${Math.min(Math.abs(sector.performance) * 20, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Top Stocks */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Top Indian Stocks</h4>
          <div className="space-y-2">
            {sector.topStocks.slice(0, 5).map((stock) => (
              <Link
                key={stock}
                href={`/stocks/${stock}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200 group/stock"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">{stock.charAt(0)}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover/stock:text-indigo-600 transition-colors duration-200">
                    {stock}
                  </span>
                </div>
                <span className="text-xs text-gray-400 group-hover/stock:text-indigo-400 transition-colors duration-200">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last updated</span>
            <span>{new Date(sector.lastUpdated).toLocaleDateString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
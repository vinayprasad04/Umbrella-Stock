'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import StockCard from '@/components/StockCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { Stock } from '@/types';

export default function TopGainersPage() {
  const [limit, setLimit] = useState(20);

  const { data: gainers, isLoading, error, refetch } = useQuery({
    queryKey: ['topGainers', limit],
    queryFn: async () => {
      const response = await axios.get(`/api/stocks/top-gainers?limit=${limit}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch top gainers');
      }
      return response.data.data as Stock[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
    retryDelay: 5000,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-300"
            >
              <span className="mr-2">🔄</span>
              Refresh Data
            </button>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-600/10 rounded-full text-sm font-medium text-gray-700 mb-6 backdrop-blur-sm border border-green-200/50">
              <div className="w-2 h-2 rounded-full mr-2 bg-green-400"></div>
              Live Market Data • Updated every 30 seconds
            </div>
            
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-700 to-green-800 mb-4 leading-tight">
              Top Gainers
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover the best performing stocks in the market today with real-time price movements and percentage gains
            </p>

            {/* Filter Controls */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="text-gray-600 font-medium">Show:</span>
              {[10, 20, 30, 50].map((count) => (
                <button
                  key={count}
                  onClick={() => setLimit(count)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    limit === count
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white/70 text-gray-700 hover:bg-green-100'
                  }`}
                >
                  {count} stocks
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {gainers && gainers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {gainers.length}
              </div>
              <div className="text-sm text-gray-600">Total Gainers</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                +{gainers[0]?.changePercent.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">Top Performer</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                +{(gainers.reduce((sum, stock) => sum + stock.changePercent, 0) / gainers.length).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">Average Gain</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                ₹{Math.max(...gainers.map(s => s.volume)).toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-gray-600">Highest Volume</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">🚀</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Market Leaders</h2>
              <p className="text-sm text-gray-600">Stocks with highest percentage gains today</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: limit }).map((_, index) => (
                <div key={index} className="bg-white/50 rounded-2xl p-4 border border-white/50 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-300 rounded mb-1 w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-12">
              <ErrorMessage 
                title="Unable to load top gainers"
                message={(error as Error)?.message || 'Failed to fetch live market data. Please try again later.'}
              />
              <div className="text-center mt-6">
                <button
                  onClick={() => refetch()}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-300"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : gainers && gainers.length > 0 ? (
            <div className="space-y-3">
              {gainers.map((stock, index) => (
                <StockCard key={stock.symbol} stock={stock} rank={index + 1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Gainers Found</h3>
              <p className="text-gray-600">No stocks are showing positive performance at this time.</p>
            </div>
          )}
        </div>

        {/* Action Section */}
        {gainers && gainers.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Want to see more market data?</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/stocks/losers"
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all duration-300"
                >
                  View Top Losers
                </Link>
                <Link
                  href="/sectors"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-300"
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
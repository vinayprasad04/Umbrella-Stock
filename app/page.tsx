'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import StockCard from '@/components/StockCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import StockTicker from '@/components/StockTicker';
import ETFCard from '@/components/ETFCard';
import ErrorMessage from '@/components/ErrorMessage';
import { Stock, Sector } from '@/types';
import { isIndianMarketOpen } from '@/lib/indian-stocks-api';
import { IndexData } from '@/pages/api/indices/live';
import IndexCard from '@/components/IndexCard';

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
  schemeCode?: number;
  fundHouse?: string;
}

export default function HomePage() {
  const [marketOpen, setMarketOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Check market status on component mount and every minute
  useEffect(() => {
    const checkMarketStatus = () => {
      const isOpen = isIndianMarketOpen();
      setMarketOpen(isOpen);
      setLastUpdated(new Date());
    };
    
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Dynamic refetch interval based on market hours
  const getRefetchInterval = () => {
    return marketOpen ? 5000 : 5 * 60 * 1000; // 5 seconds if market open, 5 minutes if closed
  };

  const { data: top50Data, isLoading: loadingTop50, error: top50Error } = useQuery({
    queryKey: ['top50'],
    queryFn: async () => {
      const response = await axios.get('/api/stocks/top-50');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch data');
      }
      return response.data.data as Stock[];
    },
    refetchInterval: getRefetchInterval(),
    retry: 3,
    retryDelay: 5000,
  });

  // Filter top gainers and losers from top 50 data
  const topGainers = top50Data?.filter(stock => stock.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 6) || [];
  
  const topLosers = top50Data?.filter(stock => stock.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 6) || [];

  const loadingGainers = loadingTop50;
  const loadingLosers = loadingTop50;
  const gainersError = top50Error;
  const losersError = top50Error;

  const { data: sectors, isLoading: loadingSectors } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const response = await axios.get('/api/sectors');
      return response.data.data as Sector[];
    },
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });

  const { data: etfs, isLoading: loadingETFs, error: etfsError } = useQuery({
    queryKey: ['etfs'],
    queryFn: async () => {
      const response = await axios.get('/api/etfs?limit=6');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch ETF data');
      }
      return response.data.data as ETF[];
    },
    refetchInterval: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 10000,
  });

  const { data: mutualFunds, isLoading: loadingMutualFunds, error: mutualFundsError } = useQuery({
    queryKey: ['mutualFunds'],
    queryFn: async () => {
      const response = await axios.get('/api/mutual-funds?limit=6');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch mutual fund data');
      }
      return response.data.data.funds;
    },
    refetchInterval: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 10000,
  });

  const { data: indicesData, isLoading: loadingIndices } = useQuery({
    queryKey: ['indices'],
    queryFn: async () => {
      const response = await axios.get('/api/indices/live');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch indices data');
      }
      return response.data.data as IndexData[];
    },
    refetchInterval: getRefetchInterval(),
    retry: 3,
    retryDelay: 5000,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      <Header />
      {/* Content wrapper with top padding to account for fixed header */}
      <div className="pt-[60px] md:pt-[70px]">
        <StockTicker />

      {/* Hero Section */}
      <section className="w-full max-w-[1400px] mx-auto px-3 md:px-6 py-6 md:py-12">
        <div className="text-center mb-6 md:mb-12">
          <div className="inline-flex items-center px-3 md:px-4 py-2 bg-gradient-to-r from-[#FF6B2C]/10 to-blue-600/10 rounded-full text-xs md:text-sm font-medium text-gray-700 mb-4 md:mb-6 backdrop-blur-sm border border-white/50">
            <div className={`w-2 h-2 rounded-full mr-2 ${marketOpen ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="hidden sm:inline">{marketOpen ? '🟢 Market Open' : '🔴 Market Closed'} • Live Updates • </span>{lastUpdated.toLocaleTimeString('en-IN')}
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 mb-3 md:mb-4 leading-tight px-2">
            Indian Stock Market
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
            Track real-time market data, discover top-performing stocks, and make informed investment decisions with our comprehensive analytics platform
          </p>
          
          {/* Live NIFTY Indices Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-12">
            {loadingIndices ? (
              // Loading placeholders
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white/70 backdrop-blur-md rounded-2xl p-3 border border-white/50 shadow-lg animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : indicesData && indicesData.length >= 4 ? (
              // Live indices data with charts
              indicesData.slice(0, 4).map((index, idx) => (
                <IndexCard key={index.symbol} index={index} size="small" />
              ))
            ) : (
              // Fallback static cards
              <>
                <div className="bg-white/70 backdrop-blur-md rounded-lg md:rounded-2xl p-3 md:p-4 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">50+</div>
                  <div className="text-xs text-gray-600">NIFTY Stocks</div>
                </div>
                <div className="bg-white/70 backdrop-blur-md rounded-lg md:rounded-2xl p-3 md:p-4 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-base sm:text-lg md:text-2xl font-bold text-green-600">₹320.5L Cr</div>
                  <div className="text-xs text-gray-600">Market Cap</div>
                </div>
                <div className="bg-white/70 backdrop-blur-md rounded-lg md:rounded-2xl p-3 md:p-4 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-base sm:text-lg md:text-2xl font-bold text-blue-600">5 Sec</div>
                  <div className="text-xs text-gray-600">Live Updates</div>
                </div>
                <div className="bg-white/70 backdrop-blur-md rounded-lg md:rounded-2xl p-3 md:p-4 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-base sm:text-lg md:text-2xl font-bold text-purple-600">Real-time</div>
                  <div className="text-xs text-gray-600">Data Feed</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <main className="w-full max-w-[1400px] mx-auto px-3 md:px-6 pb-6 md:pb-12">

        {/* Market Movers Section */}
        <section className="mb-8 md:mb-12">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-blue-800 mb-3 md:mb-4">
              Market Movers
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Track the best and worst performing stocks in real-time with live market data
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8">
            {/* Top Gainers */}
            <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-8 border border-green-100/50 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="flex items-center justify-between mb-4 md:mb-8">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg md:text-2xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Top Gainers</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Best performing stocks today</p>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      {topGainers.length} stocks • Live updates
                    </p>
                  </div>
                </div>
                <div className="bg-green-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200">
                  <span className="flex items-center whitespace-nowrap">
                    <span className="mr-1">▲</span>
                    <span>{topGainers.length > 0 ? `+${topGainers[0]?.changePercent.toFixed(1)}%` : '--'}</span>
                  </span>
                </div>
              </div>

              {loadingGainers ? (
                <div className="space-y-3 md:space-y-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="bg-white/50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/50 animate-pulse">
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
              ) : gainersError ? (
                <ErrorMessage 
                  title="Unable to load top gainers"
                  message={(gainersError as Error)?.message || 'Failed to fetch live market data. Please try again later.'}
                />
              ) : (
                <div className="space-y-3">
                  {topGainers?.map((stock, index) => (
                    <StockCard key={stock.symbol} stock={stock} rank={index + 1} />
                  ))}
                </div>
              )}

              {!loadingGainers && !gainersError && topGainers.length > 0 && (
                <div className="mt-6 pt-4 border-t border-green-200">
                  <div className="text-center">
                    <a
                      href="/stocks/gainers"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      View All Gainers
                      <span className="ml-2">→</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Top Losers */}
            <div className="bg-gradient-to-br from-red-50/80 to-rose-50/80 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-8 border border-red-100/50 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="flex items-center justify-between mb-4 md:mb-8">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg md:text-2xl">📉</span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Top Losers</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Worst performing stocks today</p>
                    <p className="text-xs text-red-600 font-medium mt-1">
                      {topLosers.length} stocks • Live updates
                    </p>
                  </div>
                </div>
                <div className="bg-red-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200">
                  <span className="flex items-center whitespace-nowrap">
                    <span className="mr-1">▼</span>
                    <span>{topLosers.length > 0 ? `${topLosers[0]?.changePercent.toFixed(1)}%` : '--'}</span>
                  </span>
                </div>
              </div>

              {loadingLosers ? (
                <div className="space-y-3 md:space-y-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="bg-white/50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/50 animate-pulse">
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
              ) : losersError ? (
                <ErrorMessage 
                  title="Unable to load top losers"
                  message={(losersError as Error)?.message || 'Failed to fetch live market data. Please try again later.'}
                />
              ) : (
                <div className="space-y-3">
                  {topLosers?.map((stock, index) => (
                    <StockCard key={stock.symbol} stock={stock} rank={index + 1} />
                  ))}
                </div>
              )}

              {!loadingLosers && !losersError && topLosers.length > 0 && (
                <div className="mt-6 pt-4 border-t border-red-200">
                  <div className="text-center">
                    <a
                      href="/stocks/losers"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      View All Losers
                      <span className="ml-2">→</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>


        {/* Investment Opportunities */}
        <section>
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-blue-800 mb-3 md:mb-4">
              Investment Opportunities
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Explore diversified investment options including ETFs and mutual funds to build your portfolio
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* ETFs Section */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-8 border border-white/50 shadow-xl">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm md:text-xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900">Top ETFs</h3>
                  <p className="text-xs md:text-sm text-gray-600">Exchange Traded Funds</p>
                </div>
              </div>

              {loadingETFs ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : etfsError ? (
                <ErrorMessage 
                  title="Unable to load ETFs"
                  message={(etfsError as Error)?.message || 'Failed to fetch ETF data. Please try again later.'}
                />
              ) : (
                <div className="space-y-4">
                  {etfs?.slice(0, 4).map((etf, index) => (
                    <ETFCard key={etf.symbol || index} etf={etf} />
                  ))}
                </div>
              )}

              <div className="mt-4 md:mt-8">
                <a
                  href="/etfs"
                  className="block text-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base hover:shadow-lg transition-all duration-300"
                >
                  Explore All ETFs
                </a>
              </div>
            </div>

            {/* Right Column: Mutual Funds + Sectors */}
            <div className="space-y-4 md:space-y-8">
              {/* Mutual Funds Section */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-8 border border-white/50 shadow-xl">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm md:text-xl">💎</span>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-2xl font-bold text-gray-900">Mutual Funds</h3>
                    <p className="text-xs md:text-sm text-gray-600">Professional fund management</p>
                  </div>
                </div>

                {loadingMutualFunds ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : mutualFundsError ? (
                  <ErrorMessage 
                    title="Unable to load mutual funds"
                    message={(mutualFundsError as Error)?.message || 'Failed to fetch mutual fund data. Please try again later.'}
                  />
                ) : (
                  <div className="space-y-4">
                    {mutualFunds?.slice(0, 4).map((fund: any, index: number) => (
                      <Link 
                        key={fund.name || fund.schemeCode || index} 
                        href={fund.schemeCode ? `/mutual-funds/${fund.schemeCode}` : '/mutual-funds'}
                        className="block"
                      >
                        <div className="bg-white/50 rounded-lg md:rounded-2xl border border-white/50 p-2 md:p-4 hover:bg-white/70 hover:scale-105 transition-all duration-300 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-xs md:text-sm leading-tight mb-1">
                                {fund.name || fund.schemeName}
                              </h4>
                              <p className="text-xs text-gray-500 hidden md:block">
                                {fund.category} • {fund.fundHouse}
                              </p>
                              <p className="text-xs text-gray-500 md:hidden">
                                {fund.fundHouse}
                              </p>
                            </div>
                            <div className="text-right ml-2 md:ml-4">
                              <p className="text-xs md:text-sm font-bold text-gray-900">
                                ₹{fund.nav ? fund.nav.toFixed(2) : 'N/A'}
                              </p>
                              <p className={`text-xs font-medium ${
                                fund.returns1Y && fund.returns1Y >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {fund.returns1Y ? `${fund.returns1Y >= 0 ? '+' : ''}${fund.returns1Y.toFixed(1)}%` : 'N/A'} (1Y)
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-4 md:mt-8">
                  <a
                    href="/mutual-funds"
                    className="block text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base hover:shadow-lg transition-all duration-300"
                  >
                    Discover Mutual Funds
                  </a>
                </div>
              </div>

              {/* Sector Performance Section */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-8 border border-white/50 shadow-xl">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm md:text-xl">🏢</span>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-2xl font-bold text-gray-900">Sectors</h3>
                    <p className="text-xs md:text-sm text-gray-600">Performance by industry</p>
                  </div>
                </div>
                
                {loadingSectors ? (
                  <div className="flex justify-center py-6 md:py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {sectors?.slice(0, 6).map((sector) => (
                      <div key={sector.name} className="flex justify-between items-center p-2 md:p-3 rounded-lg md:rounded-2xl hover:bg-white/50 transition-all duration-300">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm md:text-base">{sector.name}</h4>
                          <p className="text-xs text-gray-500">{sector.stockCount} stocks</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-xs md:text-sm ${
                            sector.performance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 md:mt-8">
                  <a
                    href="/sectors"
                    className="block text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base hover:shadow-lg transition-all duration-300"
                  >
                    View All Sectors
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Market Insights Section */}
        <section className="mt-8 md:mt-16 mb-8 md:mb-12">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-8 border border-white/50 shadow-xl">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-sm md:text-lg">📊</span>
              </div>
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">Market Insights</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <div className="text-center p-2 md:p-4 rounded-lg md:rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <div className="text-lg md:text-2xl font-bold text-blue-600">1,847</div>
                <div className="text-xs md:text-sm text-gray-600">NSE Listed</div>
              </div>
              <div className="text-center p-2 md:p-4 rounded-lg md:rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                <div className="text-lg md:text-2xl font-bold text-purple-600">5,234</div>
                <div className="text-xs md:text-sm text-gray-600">BSE Listed</div>
              </div>
              <div className="text-center p-2 md:p-4 rounded-lg md:rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                <div className="text-sm md:text-lg font-bold text-green-600">9:15-3:30</div>
                <div className="text-xs md:text-sm text-gray-600">Trading Hours</div>
              </div>
              <div className="text-center p-2 md:p-4 rounded-lg md:rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100">
                <div className={`text-sm md:text-lg font-bold ${
                  marketOpen ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {marketOpen ? '5 Sec' : '5 Min'}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Updates</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}
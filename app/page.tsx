'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StockCard from '@/components/StockCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import StockTicker from '@/components/StockTicker';
import ETFCard from '@/components/ETFCard';
import ErrorMessage from '@/components/ErrorMessage';
import { Stock, Sector } from '@/types';
import { isIndianMarketOpen } from '@/lib/indian-stocks-api';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <StockTicker />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Indian Stock Market Overview
              </h1>
              <p className="text-lg text-gray-600">
                Track the latest NSE & BSE stock market trends and sector performance
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                marketOpen 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  marketOpen ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                {marketOpen ? 'Market Open' : 'Market Closed'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
              </p>
              {marketOpen && (
                <p className="text-xs text-green-600 mt-1">
                  Live updates every 5 seconds
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Top Gainers</h2>
                <span className="text-sm text-green-600 font-medium">▲ Trending Up</span>
              </div>

              {loadingGainers ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : gainersError ? (
                <ErrorMessage 
                  title="Unable to load top gainers"
                  message={(gainersError as Error)?.message || 'Failed to fetch live market data. Please try again later.'}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {topGainers?.map((stock) => (
                    <StockCard key={stock.symbol} stock={stock} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Top Losers</h2>
                <span className="text-sm text-red-600 font-medium">▼ Trending Down</span>
              </div>

              {loadingLosers ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : losersError ? (
                <ErrorMessage 
                  title="Unable to load top losers"
                  message={(losersError as Error)?.message || 'Failed to fetch live market data. Please try again later.'}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {topLosers?.map((stock) => (
                    <StockCard key={stock.symbol} stock={stock} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Sector Performance</h2>
              
              {loadingSectors ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-4">
                  {sectors?.slice(0, 8).map((sector) => (
                    <div key={sector.name} className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{sector.name}</h3>
                        <p className="text-xs text-gray-500">{sector.stockCount} stocks</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-medium ${
                            sector.performance >= 0 ? 'stock-positive' : 'stock-negative'
                          }`}
                        >
                          {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <a
                    href="/sectors"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View all sectors →
                  </a>
                  <a
                    href="/mutual-funds"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Mutual Funds →
                  </a>
                </div>
              </div>
            </div>

            <div className="card mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Indian Market Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">NSE Listed</span>
                  <span className="font-medium">1,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">BSE Listed</span>
                  <span className="font-medium">5,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Cap</span>
                  <span className="font-medium">₹320.5L Cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trading Hours</span>
                  <span className="font-medium text-blue-600">9:15 AM - 3:30 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Update Frequency</span>
                  <span className={`font-medium ${
                    marketOpen ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {marketOpen ? '5 seconds' : '5 minutes'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ETFs and Mutual Funds Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Top ETFs</h2>
              <span className="text-sm text-blue-600 font-medium">📊 Exchange Traded Funds</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {etfs?.map((etf, index) => (
                  <ETFCard key={etf.symbol || index} etf={etf} />
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <a
                href="/etfs"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all ETFs →
              </a>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Top Mutual Funds</h2>
              <span className="text-sm text-purple-600 font-medium">💎 Fund Houses</span>
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
              <div className="space-y-3">
                {mutualFunds?.slice(0, 8).map((fund: any, index: number) => (
                  <div key={fund.name || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm leading-tight">
                          {fund.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {fund.category} • {fund.fundHouse}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-bold text-gray-900">
                          ₹{fund.nav.toFixed(2)}
                        </p>
                        <p className={`text-xs font-medium ${
                          fund.returns1Y >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {fund.returns1Y >= 0 ? '+' : ''}{fund.returns1Y.toFixed(1)}% (1Y)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <a
                href="/mutual-funds"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all Mutual Funds →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
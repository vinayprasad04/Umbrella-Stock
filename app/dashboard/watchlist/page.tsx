'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import UserDashboardLayout from '@/components/layouts/UserDashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/api-utils';
import { useAuth } from '@/lib/AuthContext';
import { ClientAuth } from '@/lib/auth';

interface WatchlistItem {
  _id: string;
  symbol: string;
  companyName: string;
  type: 'STOCK' | 'MUTUAL_FUND';
  addedAt: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

interface LiveData {
  [symbol: string]: {
    price: number;
    change: number;
    changePercent: number;
    lastUpdated: string;
    detectedType?: 'STOCK' | 'MUTUAL_FUND';
  };
}

export default function WatchlistPage() {
  const { user, isAuthenticated } = useAuth();
  const [liveData, setLiveData] = useState<LiveData>({});
  const [loadingLive, setLoadingLive] = useState(false);

  const { data: watchlistData, isLoading, error, refetch } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const token = ClientAuth.getAccessToken();
      const response = await axios.get('/api/user/watchlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch live data for watchlist items
  useEffect(() => {
    const fetchLiveData = async () => {
      if (!watchlistData?.watchlist?.length) return;

      setLoadingLive(true);
      const promises = watchlistData.watchlist.map(async (item: WatchlistItem) => {
        let detectedType = item.type;

        // If type is not set, try to detect it
        if (!detectedType) {
          try {
            // First try as stock
            const stockResponse = await axios.get(`/api/stocks/live/${item.symbol}`);
            if (stockResponse.data.success) {
              detectedType = 'STOCK';
            }
          } catch (stockError) {
            try {
              // If stock fails, try as mutual fund
              const mfResponse = await axios.get(`/api/mutual-funds/${item.symbol}/verified`);
              if (mfResponse.data.success) {
                detectedType = 'MUTUAL_FUND';
              }
            } catch (mfError) {
              // If both fail, default to STOCK
              detectedType = 'STOCK';
            }
          }
        }

        try {
          let response;
          if (detectedType === 'STOCK') {
            response = await axios.get(`/api/stocks/live/${item.symbol}`);
          } else {
            // For mutual funds, fetch NAV data
            response = await axios.get(`/api/mutual-funds/${item.symbol}/verified`);
          }
          return {
            symbol: item.symbol,
            type: detectedType,
            data: response.data.data
          };
        } catch (error) {
          console.error(`Error fetching live data for ${item.symbol}:`, error);
          return {
            symbol: item.symbol,
            type: detectedType,
            data: null
          };
        }
      });

      const results = await Promise.all(promises);
      const liveDataMap: LiveData = {};

      results.forEach(result => {
        if (result.data) {
          if (result.type === 'STOCK') {
            liveDataMap[result.symbol] = {
              ...result.data,
              detectedType: result.type
            };
          } else {
            // For mutual funds, map NAV data to price format
            liveDataMap[result.symbol] = {
              price: result.data.currentNav || result.data.nav || 0,
              change: 0, // Mutual funds don't typically have change data
              changePercent: 0,
              lastUpdated: result.data.navDate || new Date().toISOString(),
              detectedType: result.type
            };
          }
        }
      });

      setLiveData(liveDataMap);
      setLoadingLive(false);
    };

    fetchLiveData();

    // Refresh live data every 30 seconds
    const interval = setInterval(fetchLiveData, 30 * 1000);
    return () => clearInterval(interval);
  }, [watchlistData]);

  const handleRemoveFromWatchlist = async (symbol: string) => {
    try {
      const token = ClientAuth.getAccessToken();
      await axios.delete(`/api/user/watchlist?symbol=${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      refetch();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <UserDashboardLayout currentPage="watchlist">
        <div className="flex justify-center items-center py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h1>
            <p className="text-gray-600 mb-8">Please log in to view your watchlist.</p>
            <a href="/login" className="btn-primary">
              Login
            </a>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <UserDashboardLayout currentPage="watchlist">
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </UserDashboardLayout>
    );
  }

  if (error) {
    return (
      <UserDashboardLayout currentPage="watchlist">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Watchlist</h1>
          <p className="text-gray-600 mb-8">Something went wrong while loading your watchlist.</p>
          <button onClick={() => refetch()} className="btn-primary">
            Try Again
          </button>
        </div>
      </UserDashboardLayout>
    );
  }

  const watchlist = watchlistData?.watchlist || [];

  return (
    <UserDashboardLayout currentPage="watchlist">
      <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Watchlist</h1>
            <p className="text-gray-600 mt-2">
              Track your favorite stocks and monitor their performance
            </p>
          </div>

          {watchlist.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Watchlist is Empty</h3>
              <p className="text-gray-600 mb-6">
                Start building your watchlist by adding stocks you want to track.
              </p>
              <a href="/stocks" className="btn-primary">
                Browse Stocks
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} in your watchlist
                </p>
                {loadingLive && (
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating prices...
                  </div>
                )}
              </div>

              <div className="grid gap-4">
                {watchlist.map((item: WatchlistItem) => {
                  const live = liveData[item.symbol];
                  const isPositive = live ? live.change >= 0 : false;

                  // Use the detected type from the live data fetch, or fall back to item.type or STOCK
                  const itemType = live?.detectedType || item.type || 'STOCK';
                  const detailsUrl = itemType === 'STOCK' ? `/stocks/${item.symbol}` : `/mutual-funds/${item.symbol}`;

                  console.log('Watchlist item:', { symbol: item.symbol, originalType: item.type, detectedType: live?.detectedType, finalType: itemType });

                  return (
                    <div key={item._id} className="card hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  <a
                                    href={detailsUrl}
                                    className="hover:text-blue-600 transition-colors"
                                  >
                                    {item.symbol}
                                  </a>
                                </h3>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  itemType === 'STOCK'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {itemType === 'STOCK' ? 'Stock' : 'Mutual Fund'}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mt-1">{item.companyName}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Added: {new Date(item.addedAt).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="text-right">
                              {live ? (
                                <>
                                  <div className="text-xl font-bold text-gray-900">
                                    {itemType === 'STOCK' ? formatCurrency(live.price) : `₹${live.price.toFixed(4)}`}
                                  </div>
                                  {itemType === 'STOCK' && (
                                    <div className={`text-sm font-medium ${isPositive ? 'stock-positive' : 'stock-negative'}`}>
                                      {formatCurrency(live.change)} ({formatPercentage(live.changePercent)})
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 mt-1">
                                    {itemType === 'STOCK'
                                      ? `Updated: ${new Date(live.lastUpdated).toLocaleTimeString()}`
                                      : `NAV Date: ${live.lastUpdated ? new Date(live.lastUpdated.split('-').reverse().join('-')).toLocaleDateString('en-IN') : 'N/A'}`
                                    }
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  {loadingLive ? 'Loading...' : `${itemType === 'STOCK' ? 'Price' : 'NAV'} unavailable`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col space-y-2">
                          <a
                            href={detailsUrl}
                            className="btn-secondary text-xs px-3 py-1"
                          >
                            View Details
                          </a>
                          <button
                            onClick={() => handleRemoveFromWatchlist(item.symbol)}
                            className="text-xs text-red-600 hover:text-red-800 px-3 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>
    </UserDashboardLayout>
  );
}
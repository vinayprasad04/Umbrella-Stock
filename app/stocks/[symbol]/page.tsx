'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Header from '@/components/Header';
import AdvancedStockChart from '@/components/AdvancedStockChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/api-utils';

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params?.symbol as string;

  const { data: liveData, isLoading: loadingLive, error: liveError } = useQuery({
    queryKey: ['stockLive', symbol],
    queryFn: async () => {
      const response = await axios.get(`/api/stocks/live/${symbol}`);
      return response.data.data;
    },
    refetchInterval: 30 * 1000, // 30 seconds
    enabled: !!symbol,
  });

  const { data: detailData, isLoading: loadingDetails, error: detailError } = useQuery({
    queryKey: ['stockDetails', symbol],
    queryFn: async () => {
      const response = await axios.get(`/api/stocks/details/${symbol}`);
      return response.data.data;
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (loadingLive && loadingDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (liveError || detailError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Stock Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              We couldn't find information for "{symbol}". Please check the symbol and try again.
            </p>
            <a href="/" className="btn-primary">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const overview = detailData?.overview;
  const history = detailData?.history || [];
  const isPositive = liveData?.change >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-6 py-8 pt-[104px] md:pt-[123px] lg:pt-[67px]">
        <div className="mb-12 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{symbol}</h1>
              <p className="text-lg text-gray-600 mt-1">{overview?.name}</p>
            </div>
            
            {liveData && (
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(liveData.price)}
                </div>
                <div className={`text-lg font-medium ${isPositive ? 'stock-positive' : 'stock-negative'}`}>
                  {formatCurrency(liveData.change)} ({formatPercentage(liveData.changePercent)})
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Last updated: {new Date(liveData.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {loadingDetails ? (
              <div className="card">
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
                <p className="text-center text-gray-600 mt-4">Loading chart data...</p>
              </div>
            ) : history.length > 0 ? (
              <AdvancedStockChart data={history} symbol={symbol} />
            ) : (
              <div className="card">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Chart Not Available</h3>
                  <p className="text-gray-600">Historical data is not available for this stock at the moment.</p>
                </div>
              </div>
            )}

            {liveData && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Today's Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Open</p>
                    <p className="font-semibold">{formatCurrency(liveData.open)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">High</p>
                    <p className="font-semibold">{formatCurrency(liveData.high)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Low</p>
                    <p className="font-semibold">{formatCurrency(liveData.low)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Volume</p>
                    <p className="font-semibold">{formatNumber(liveData.volume)}</p>
                  </div>
                </div>
              </div>
            )}

            {overview?.description && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">About {overview.name}</h3>
                <p className="text-gray-700 leading-relaxed">{overview.description}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {overview && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
                <div className="space-y-3">
                  {overview.sector && typeof overview.sector === 'string' && overview.sector !== '000' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sector</span>
                      <span className="font-medium">{overview.sector}</span>
                    </div>
                  )}
                  {overview.marketCap ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Cap</span>
                      <span className="font-medium">{formatNumber(overview.marketCap)}</span>
                    </div>
                  ):""}
                  {overview.pe ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">P/E Ratio</span>
                      <span className="font-medium">{overview.pe.toFixed(2)}</span>
                    </div>
                  ):""}
                  {overview.eps ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">EPS</span>
                      <span className="font-medium">{formatCurrency(overview.eps)}</span>
                    </div>
                  ):""}
                  {overview.dividend > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dividend Yield</span>
                      <span className="font-medium">{overview.dividend.toFixed(2)}%</span>
                    </div>
                  )}
                  {overview.high52Week && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">52W High</span>
                      <span className="font-medium">{formatCurrency(overview.high52Week)}</span>
                    </div>
                  )}
                  {overview.low52Week && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">52W Low</span>
                      <span className="font-medium">{formatCurrency(overview.low52Week)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full btn-primary">
                  Add to Watchlist
                </button>
                <button className="w-full btn-secondary">
                  Set Price Alert
                </button>
                <button className="w-full btn-secondary">
                  View News
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
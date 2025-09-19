'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AdvancedStockChart from '@/components/AdvancedStockChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/api-utils';
import { useAuth } from '@/lib/AuthContext';
import { ClientAuth } from '@/lib/auth';

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params?.symbol as string;
  const { user, isAuthenticated } = useAuth();
  const [watchlistStatus, setWatchlistStatus] = useState({
    inWatchlist: false,
    loading: false
  });

  const { data: liveData, isLoading: loadingLive, error: liveError } = useQuery({
    queryKey: ['stockLive', symbol],
    queryFn: async () => {
      const response = await axios.get(`/api/stocks/live/${symbol}`);
      return response.data.data;
    },
    refetchInterval: 30 * 1000, // 30 seconds
    enabled: !!symbol,
  });

  // Try verified data first, fall back to regular data
  const { data: verifiedData, isLoading: loadingVerified } = useQuery({
    queryKey: ['stockVerified', symbol],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/stocks/verified/${symbol}`);
        return response.data.data;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if verified data not found
  });

  const { data: detailData, isLoading: loadingDetails, error: detailError } = useQuery({
    queryKey: ['stockDetails', symbol],
    queryFn: async () => {
      const response = await axios.get(`/api/stocks/details/${symbol}`);
      return response.data.data;
    },
    enabled: !!symbol && !verifiedData, // Only fetch if verified data not available
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check watchlist status
  const { data: watchlistData } = useQuery({
    queryKey: ['watchlistCheck', symbol],
    queryFn: async () => {
      try {
        const token = ClientAuth.getAccessToken();
        const response = await axios.get(`/api/user/watchlist/check/${symbol}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data.data;
      } catch (error) {
        return { inWatchlist: false };
      }
    },
    enabled: !!symbol && isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch ratios data for verified stocks - moved here to maintain hook order
  const { data: ratiosData } = useQuery({
    queryKey: ['stockRatios', symbol],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/stocks/verified/${symbol}/ratios`);
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!symbol && !!verifiedData, // Check verifiedData directly instead of isVerified
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update watchlist status when data changes
  useEffect(() => {
    if (watchlistData) {
      setWatchlistStatus(prev => ({
        ...prev,
        inWatchlist: watchlistData.inWatchlist
      }));
    }
  }, [watchlistData]);

  if (loadingLive && (loadingVerified || loadingDetails)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (liveError || (detailError && !verifiedData)) {
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

  // Use verified data if available, otherwise fall back to regular data
  const currentData = verifiedData || detailData;
  const overview = verifiedData?.parsedStockDetail ? {
    symbol: verifiedData.parsedStockDetail.symbol,
    name: verifiedData.parsedStockDetail.companyName,
    sector: verifiedData.parsedStockDetail.additionalInfo?.sector || 'Unknown',
    industry: verifiedData.parsedStockDetail.additionalInfo?.industry,
    description: verifiedData.parsedStockDetail.additionalInfo?.description || `${verifiedData.parsedStockDetail.companyName} is a verified stock with comprehensive financial data available.`,
    website: verifiedData.parsedStockDetail.additionalInfo?.website,
    marketCap: verifiedData.parsedStockDetail.meta?.marketCapitalization,
    currentPrice: verifiedData.parsedStockDetail.meta?.currentPrice,
    faceValue: verifiedData.parsedStockDetail.meta?.faceValue,
    exchange: verifiedData.parsedStockDetail.additionalInfo?.exchange || 'NSE'
  } : currentData?.overview;
  const history = detailData?.history || [];
  const isPositive = liveData?.change >= 0;
  const isVerified = !!verifiedData;

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    setWatchlistStatus(prev => ({ ...prev, loading: true }));

    try {
      const token = ClientAuth.getAccessToken();

      if (watchlistStatus.inWatchlist) {
        // Remove from watchlist
        await axios.delete(`/api/user/watchlist?symbol=${symbol}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWatchlistStatus({ inWatchlist: false, loading: false });
      } else {
        // Add to watchlist
        console.log('🚀 Adding to watchlist:', { symbol, companyName: overview?.name, type: 'STOCK' });
        await axios.post('/api/user/watchlist',
          {
            symbol,
            companyName: overview?.name || symbol,
            type: 'STOCK'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWatchlistStatus({ inWatchlist: true, loading: false });
      }
    } catch (error: any) {
      console.error('❌ Watchlist error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      setWatchlistStatus(prev => ({ ...prev, loading: false }));

      if (error.response?.status === 401) {
        window.location.href = '/login';
      } else {
        // Show the actual error message
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
        alert(`Failed to add stock to watchlist: ${errorMessage}`);
      }
    }
  };

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
            {
              ratiosData?.ratios && (
               <div className="card">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Key Financial Ratios</h3>
                  <div className="grid grid-cols-3 gap-x-8">
                    {Object.entries(ratiosData.ratios).map(([key, value], index) => {
                      // Calculate background color based on position in 6-item groups
                      // Positions 0,1,2 (6n+1, 6n+2, 6n+3) get white background
                      // Positions 3,4,5 (6n+4, 6n+5, 6n+6) get #f8f8fc background
                      const positionInGroup = index % 6;
                      const backgroundColor = positionInGroup < 3 ? 'white' : '#f8f8fc';

                      return (
                        <div
                          key={key}
                          className="flex justify-between items-center"
                          style={{
                            backgroundColor,
                            padding: '12px',
                            marginTop: '0',
                            marginBottom: '0',
                            borderRadius: '6px'
                          }}
                        >
                          <span className="font-normal" style={{fontSize: '15px', color: '#606f7b'}}>{key}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {typeof value === 'number' ?
                              (key.includes('(₹)') ? `₹ ${value.toLocaleString()}` :
                               key.includes('(%)') ? `${value} %` :
                               key.includes('(Cr)') ? `₹ ${value.toLocaleString()} Cr.` : value) :
                              String(value)
                            }
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center text-xs text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Verified financial ratios</span>
                    </div>
                  </div>
                </div>
                )
            }


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
            {/* Data Quality Badge */}
            {isVerified && (
              <div className="card border-green-200 bg-green-50">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-800 font-semibold">Verified Data</span>
                </div>
                <p className="text-sm text-green-700">
                  This stock has verified comprehensive financial data available with detailed analysis.
                </p>
              </div>
            )}

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
                  {overview.industry && isVerified && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Industry</span>
                      <span className="font-medium">{overview.industry}</span>
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
                  {overview.profitMargin && isVerified && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit Margin</span>
                      <span className="font-medium">{overview.profitMargin.toFixed(2)}%</span>
                    </div>
                  )}
                  {overview.dividend && overview.dividend > 0 && (
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
                  {overview.faceValue && isVerified && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Face Value</span>
                      <span className="font-medium">{formatCurrency(overview.faceValue)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Financial Metrics for Verified Stocks */}
            {isVerified && overview && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Financial Performance</h3>
                <div className="space-y-3">
                  {overview.latestSales && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Latest Sales</span>
                      <span className="font-medium">{formatNumber(overview.latestSales)}</span>
                    </div>
                  )}
                  {overview.latestNetProfit && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net Profit</span>
                      <span className="font-medium">{formatNumber(overview.latestNetProfit)}</span>
                    </div>
                  )}
                  {overview.salesGrowth && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sales Growth (YoY)</span>
                      <span className={`font-medium ${overview.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {overview.salesGrowth.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {overview.profitGrowth && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit Growth (YoY)</span>
                      <span className={`font-medium ${overview.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {overview.profitGrowth.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {overview.numberOfShares && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shares Outstanding</span>
                      <span className="font-medium">{formatNumber(overview.numberOfShares)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleWatchlistToggle}
                  disabled={watchlistStatus.loading}
                  className={`w-full ${watchlistStatus.inWatchlist ? 'btn-secondary bg-green-600 text-white hover:bg-green-700' : 'btn-primary'} disabled:opacity-50`}
                >
                  {watchlistStatus.loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : watchlistStatus.inWatchlist ? (
                    '✓ In Watchlist'
                  ) : (
                    '+ Add to Watchlist'
                  )}
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

        {/* Comprehensive Financial Data for Verified Stocks - Match Admin Dashboard Exactly */}
        {isVerified && verifiedData?.parsedStockDetail && (
          <div className="mt-12 space-y-8">
            {/* Meta Information */}
            {verifiedData.parsedStockDetail.meta && (
              <div className="card">
                <h4 className="text-xl font-bold mb-6 flex items-center">
                  <span className="w-2 h-6 bg-blue-500 mr-3"></span>
                  📈 Company Overview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Face Value</p>
                    <p className="text-lg font-semibold text-gray-900">₹{verifiedData.parsedStockDetail.meta.faceValue}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Current Price</p>
                    <p className="text-lg font-semibold text-gray-900">₹{verifiedData.parsedStockDetail.meta.currentPrice}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Market Cap</p>
                    <p className="text-lg font-semibold text-gray-900">₹{verifiedData.parsedStockDetail.meta.marketCapitalization.toLocaleString()} Cr</p>
                  </div>
                  {verifiedData.parsedStockDetail.meta.numberOfShares && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Number of Shares</p>
                      <p className="text-lg font-semibold text-gray-900">{verifiedData.parsedStockDetail.meta.numberOfShares.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Profit & Loss Data */}
            {verifiedData.parsedStockDetail.profitAndLoss && (
              <div className="card">
                <h4 className="text-xl font-bold mb-6 flex items-center">
                  <span className="w-2 h-6 bg-green-500 mr-3"></span>
                  💰 Profit & Loss (Latest 5 Years)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                        {verifiedData.parsedStockDetail.profitAndLoss.sales.slice(-5).map((item: any) => (
                          <th key={item.year} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {item.year}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(verifiedData.parsedStockDetail.profitAndLoss).map(([key, values]: [string, any]) => {
                        if (!Array.isArray(values) || values.length === 0) return null;
                        const displayName = key.replace(/([A-Z])/g, ' $1').trim()
                          .replace('raw material cost', 'Raw Material Cost')
                          .replace('change in inventory', 'Change in Inventory')
                          .replace('power and fuel', 'Power and Fuel')
                          .replace('other mfr exp', 'Other Manufacturing Expenses')
                          .replace('employee cost', 'Employee Cost')
                          .replace('selling and admin', 'Selling & Administration')
                          .replace('other expenses', 'Other Expenses')
                          .replace('other income', 'Other Income')
                          .replace('profit before tax', 'Profit Before Tax')
                          .replace('net profit', 'Net Profit')
                          .replace('dividend amount', 'Dividend Amount');

                        return (
                          <tr key={key} className={key === 'sales' || key === 'netProfit' ? 'bg-blue-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {displayName}
                            </td>
                            {values.slice(-5).map((item: any) => (
                              <td key={item.year} className={`px-6 py-4 whitespace-nowrap text-sm ${key === 'netProfit' ? 'text-green-600 font-semibold' : 'text-gray-900'}`}>
                                {item.value ? `₹${item.value.toLocaleString()} Cr` : '-'}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Balance Sheet Data */}
            {verifiedData.parsedStockDetail.balanceSheet && (
              <div className="card">
                <h4 className="text-xl font-bold mb-6 flex items-center">
                  <span className="w-2 h-6 bg-blue-500 mr-3"></span>
                  🏦 Balance Sheet (Latest 5 Years)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        {verifiedData.parsedStockDetail.balanceSheet.equityShareCapital.slice(-5).map((item: any) => (
                          <th key={item.year} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {item.year}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(verifiedData.parsedStockDetail.balanceSheet).map(([key, values]: [string, any]) => {
                        if (!Array.isArray(values) || values.length === 0) return null;
                        const displayName = key.replace(/([A-Z])/g, ' $1').trim()
                          .replace('equity share capital', 'Equity Share Capital')
                          .replace('other liabilities', 'Other Liabilities')
                          .replace('net block', 'Net Block')
                          .replace('capital work in progress', 'Capital Work in Progress')
                          .replace('other assets', 'Other Assets')
                          .replace('cash and bank', 'Cash & Bank')
                          .replace('number of equity shares', 'Number of Equity Shares')
                          .replace('new bonus shares', 'New Bonus Shares')
                          .replace('face value', 'Face Value')
                          .replace('adjusted equity shares', 'Adjusted Equity Shares');

                        const isKeyMetric = ['total', 'cashAndBank', 'numberOfEquityShares'].includes(key);

                        return (
                          <tr key={key} className={isKeyMetric ? 'bg-yellow-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {displayName}
                            </td>
                            {values.slice(-5).map((item: any) => (
                              <td key={item.year} className={`px-6 py-4 whitespace-nowrap text-sm ${isKeyMetric ? 'text-blue-600 font-semibold' : 'text-gray-900'}`}>
                                {key === 'numberOfEquityShares' || key === 'newBonusShares' ?
                                  (item.value ? item.value.toLocaleString() : '-') :
                                  (item.value ? `₹${item.value.toLocaleString()} Cr` : '-')
                                }
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cash Flow Data */}
            {verifiedData.parsedStockDetail.cashFlow && (
              <div className="card">
                <h4 className="text-xl font-bold mb-6 flex items-center">
                  <span className="w-2 h-6 bg-purple-500 mr-3"></span>
                  💸 Cash Flow (Latest 5 Years)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                        {verifiedData.parsedStockDetail.cashFlow.cashFromOperatingActivity.slice(-5).map((item: any) => (
                          <th key={item.year} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {item.year}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(verifiedData.parsedStockDetail.cashFlow).map(([key, values]: [string, any]) => {
                        if (!Array.isArray(values) || values.length === 0) return null;
                        return (
                          <tr key={key}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </td>
                            {values.slice(-5).map((item: any) => (
                              <td key={item.year} className={`px-6 py-4 whitespace-nowrap text-sm ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.value ? `₹${item.value.toLocaleString()} Cr` : '-'}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quarterly Data */}
            {verifiedData.parsedStockDetail.quarterlyData && verifiedData.parsedStockDetail.quarterlyData.sales?.length > 0 && (
              <div className="card">
                <h4 className="text-xl font-bold mb-6 flex items-center">
                  <span className="w-2 h-6 bg-orange-500 mr-3"></span>
                  📅 Quarterly Performance
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                        {verifiedData.parsedStockDetail.quarterlyData.sales.map((item: any) => (
                          <th key={item.quarter} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {item.quarter}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(verifiedData.parsedStockDetail.quarterlyData).map(([key, values]: [string, any]) => {
                        if (!Array.isArray(values) || values.length === 0) return null;
                        return (
                          <tr key={key}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </td>
                            {values.map((item: any) => (
                              <td key={item.quarter} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.value ? `₹${item.value.toLocaleString()} Cr` : '-'}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Historical Prices */}
            {verifiedData.parsedStockDetail.priceData && verifiedData.parsedStockDetail.priceData.length > 0 && (
              <div className="card">
                <h4 className="text-xl font-bold mb-6 flex items-center">
                  <span className="w-2 h-6 bg-indigo-500 mr-3"></span>
                  📈 Historical Prices
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {verifiedData.parsedStockDetail.priceData.slice(-10).map((item: any) => (
                    <div key={item.year} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 font-medium">{item.year}</p>
                      <p className="text-lg font-bold text-indigo-600">₹{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import AdvancedStockChart from '@/components/AdvancedStockChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import StockNews from '@/components/StockNews';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/api-utils';
import { useAuth } from '@/lib/AuthContext';
import { ClientAuth } from '@/lib/auth';

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params?.symbol as string;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [watchlistStatus, setWatchlistStatus] = useState({
    inWatchlist: false,
    loading: false
  });

  // Simple directional sticky sidebar
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Financial data tabs state
  const [activeFinancialTab, setActiveFinancialTab] = useState<'profit-loss' | 'balance-sheet' | 'cash-flow' | 'quarterly'>('profit-loss');

  // News tabs state
  const [activeNewsTab, setActiveNewsTab] = useState<'news' | 'dividends' | 'announcements' | 'legal-orders'>('news');

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
  const { data: watchlistData, refetch: refetchWatchlistStatus } = useQuery({
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
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the result
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
    if (watchlistData !== undefined) {
      console.log('🔄 Updating watchlist status from query data:', watchlistData);
      setWatchlistStatus(prev => ({
        ...prev,
        inWatchlist: watchlistData.inWatchlist
      }));
    }
  }, [watchlistData]);

  // Simple scroll direction tracking
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
            const scrollingDown = currentScrollY > lastScrollY.current;
            if (scrollingDown !== isScrollingDown) {
              setIsScrollingDown(scrollingDown);
            }
            lastScrollY.current = currentScrollY;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrollingDown]);

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

  // Stock Analysis Calculation Functions
  const calculatePerformance = (ratios: any, overview: any) => {
    try {
      // Extract ROE, ROCE, ROA, Profit Growth from ratios
      const roe = parseFloat(ratios['ROE (%)']) || parseFloat(ratios['Return on Equity (%)']) || 0;
      const roce = parseFloat(ratios['ROCE (%)']) || parseFloat(ratios['Return on Capital Employed (%)']) || 0;
      const roa = parseFloat(ratios['ROA (%)']) || parseFloat(ratios['Return on Assets (%)']) || 0;
      const profitGrowth = parseFloat(ratios['Profit Growth (%)']) || parseFloat(ratios['Net Profit Growth (%)']) || 0;

      let score = 0;

      // ROE scoring (>15% good, 10-15% average, <10% bad)
      if (roe > 15) score += 2;
      else if (roe > 10) score += 1;

      // ROCE scoring (>12% good for most sectors, 8-12% average, <8% bad)
      if (roce > 12) score += 2;
      else if (roce > 8) score += 1;

      // ROA scoring (>5% good, 2-5% average, <2% bad for non-banking)
      if (roa > 5) score += 2;
      else if (roa > 2) score += 1;

      // Profit Growth scoring (>15% good, 5-15% average, <5% bad)
      if (profitGrowth > 15) score += 2;
      else if (profitGrowth > 5) score += 1;

      // Total score out of 8
      if (score >= 6) return 'Good';
      if (score >= 3) return 'Average';
      return 'Bad';
    } catch (error) {
      return 'Average';
    }
  };

  const calculateValuation = (ratios: any, overview: any, liveData: any) => {
    try {
      const pe = parseFloat(ratios['P/E Ratio']) || parseFloat(ratios['PE Ratio']) || overview?.pe || 0;
      const pb = parseFloat(ratios['P/B Ratio']) || parseFloat(ratios['Price to Book']) || 0;
      const earningsYield = parseFloat(ratios['Earnings Yield (%)']) || (pe > 0 ? (100/pe) : 0);

      let score = 0;

      // P/E scoring (industry-relative, general thresholds)
      if (pe > 0 && pe < 15) score += 2;
      else if (pe >= 15 && pe < 25) score += 1;

      // P/B scoring (<1.5 good, 1.5-3 average, >3 high)
      if (pb > 0 && pb < 1.5) score += 2;
      else if (pb >= 1.5 && pb < 3) score += 1;

      // Earnings Yield scoring (>8% good, 4-8% average, <4% low)
      if (earningsYield > 8) score += 2;
      else if (earningsYield > 4) score += 1;

      if (score >= 4) return 'Low';  // Low valuation = good for investors
      if (score >= 2) return 'Medium';
      return 'High';  // High valuation = expensive
    } catch (error) {
      return 'Medium';
    }
  };

  const calculateGrowth = (ratios: any, overview: any) => {
    try {
      const salesGrowth = parseFloat(ratios['Sales Growth (%)']) || parseFloat(ratios['Revenue Growth (%)']) || 0;
      const profitGrowth = parseFloat(ratios['Profit Growth (%)']) || parseFloat(ratios['Net Profit Growth (%)']) || 0;
      const epsGrowth = parseFloat(ratios['EPS Growth (%)']) || 0;

      let score = 0;

      // Sales Growth scoring (>15% good, 5-15% average, <5% bad)
      if (salesGrowth > 15) score += 2;
      else if (salesGrowth > 5) score += 1;

      // Profit Growth scoring (>20% good, 8-20% average, <8% bad)
      if (profitGrowth > 20) score += 2;
      else if (profitGrowth > 8) score += 1;

      // EPS Growth scoring if available
      if (epsGrowth > 15) score += 1;
      else if (epsGrowth > 5) score += 0.5;

      if (score >= 3.5) return 'Good';
      if (score >= 1.5) return 'Average';
      return 'Bad';
    } catch (error) {
      return 'Average';
    }
  };

  const calculateProfitability = (ratios: any, overview: any) => {
    try {
      const roe = parseFloat(ratios['ROE (%)']) || parseFloat(ratios['Return on Equity (%)']) || 0;
      const roa = parseFloat(ratios['ROA (%)']) || parseFloat(ratios['Return on Assets (%)']) || 0;
      const netMargin = parseFloat(ratios['Net Margin (%)']) || parseFloat(ratios['Net Profit Margin (%)']) || 0;
      const grossMargin = parseFloat(ratios['Gross Margin (%)']) || parseFloat(ratios['Gross Profit Margin (%)']) || 0;

      let score = 0;

      // ROE scoring
      if (roe > 18) score += 2;
      else if (roe > 12) score += 1;

      // ROA scoring
      if (roa > 8) score += 2;
      else if (roa > 4) score += 1;

      // Net Margin scoring
      if (netMargin > 15) score += 2;
      else if (netMargin > 8) score += 1;

      // Gross Margin scoring
      if (grossMargin > 40) score += 1;
      else if (grossMargin > 25) score += 0.5;

      if (score >= 5) return 'High';
      if (score >= 2.5) return 'Medium';
      return 'Low';
    } catch (error) {
      return 'Medium';
    }
  };

  const calculateEntryPoint = (ratios: any, overview: any, liveData: any) => {
    try {
      const currentPrice = liveData?.price || overview?.currentPrice || 0;
      const high52Week = parseFloat(ratios['52 Week High']) || overview?.high52Week || 0;
      const low52Week = parseFloat(ratios['52 Week Low']) || overview?.low52Week || 0;

      let score = 0;

      // Price position in 52-week range
      if (high52Week > 0 && low52Week > 0 && currentPrice > 0) {
        const pricePosition = (currentPrice - low52Week) / (high52Week - low52Week);

        if (pricePosition < 0.3) score += 2; // Near 52-week low
        else if (pricePosition < 0.6) score += 1; // In middle range
        // Near 52-week high gets 0 points
      }

      // Valuation factor
      const valuation = calculateValuation(ratios, overview, liveData);
      if (valuation === 'Low') score += 2;
      else if (valuation === 'Medium') score += 1;

      // Performance factor
      const performance = calculatePerformance(ratios, overview);
      if (performance === 'Good') score += 1;
      else if (performance === 'Average') score += 0.5;

      if (score >= 4) return 'Good';
      if (score >= 2) return 'Average';
      return 'Bad';
    } catch (error) {
      return 'Average';
    }
  };

  const calculateRedFlags = (ratios: any, overview: any) => {
    try {
      const debtToEquity = parseFloat(ratios['Debt to Equity']) || parseFloat(ratios['D/E Ratio']) || 0;
      const promoterHolding = parseFloat(ratios['Promoter Holding (%)']) || 0;
      const pledgedShares = parseFloat(ratios['Pledged Shares (%)']) || 0;
      const profitGrowth = parseFloat(ratios['Profit Growth (%)']) || parseFloat(ratios['Net Profit Growth (%)']) || 0;
      const currentRatio = parseFloat(ratios['Current Ratio']) || 0;

      let redFlags = 0;

      // High Debt to Equity (>2 for most sectors, >6 for banks is concerning)
      const sector = overview?.sector?.toLowerCase() || '';
      const isBank = sector.includes('bank') || sector.includes('financial');
      if (isBank && debtToEquity > 8) redFlags += 2;
      else if (!isBank && debtToEquity > 3) redFlags += 2;
      else if (isBank && debtToEquity > 6) redFlags += 1;
      else if (!isBank && debtToEquity > 2) redFlags += 1;

      // Low/High Promoter Holding
      if (promoterHolding > 0) {
        if (promoterHolding < 25) redFlags += 1; // Very low promoter holding
        else if (promoterHolding > 75) redFlags += 0.5; // Very high promoter holding
      }

      // Pledged Shares
      if (pledgedShares > 50) redFlags += 2;
      else if (pledgedShares > 25) redFlags += 1;

      // Negative or very low profit growth
      if (profitGrowth < -10) redFlags += 2;
      else if (profitGrowth < 0) redFlags += 1;

      // Poor liquidity
      if (currentRatio > 0 && currentRatio < 1) redFlags += 1;

      if (redFlags >= 3) return 'High';
      if (redFlags >= 1) return 'Medium';
      return 'Low';
    } catch (error) {
      return 'Medium';
    }
  };

  // Description functions for each metric
  const getPerformanceDescription = (rating: string) => {
    switch (rating) {
      case 'Good': return 'Strong returns and efficiency across key metrics';
      case 'Average': return 'Price return has been average, nothing exciting';
      case 'Bad': return 'Weak performance indicators need attention';
      default: return 'Performance data being analyzed';
    }
  };

  const getValuationDescription = (rating: string) => {
    switch (rating) {
      case 'Low': return 'Attractively valued compared to fundamentals';
      case 'Medium': return 'Fairly valued at current market levels';
      case 'High': return 'Seems to be overvalued vs the market average';
      default: return 'Valuation assessment in progress';
    }
  };

  const getGrowthDescription = (rating: string) => {
    switch (rating) {
      case 'Good': return 'Strong growth trajectory in key business metrics';
      case 'Average': return 'Financials growth has been moderate for a few years';
      case 'Bad': return 'Growth has been disappointing or declining';
      default: return 'Growth analysis in progress';
    }
  };

  const getProfitabilityDescription = (rating: string) => {
    switch (rating) {
      case 'High': return 'Showing good signs of profitability & efficiency';
      case 'Medium': return 'Decent profitability with room for improvement';
      case 'Low': return 'Profitability metrics are concerning';
      default: return 'Profitability assessment in progress';
    }
  };

  const getEntryPointDescription = (rating: string) => {
    switch (rating) {
      case 'Good': return 'The stock is underpriced and is not in the overbought zone';
      case 'Average': return 'Entry timing is reasonable but not optimal';
      case 'Bad': return 'Current price levels may not offer good entry opportunity';
      default: return 'Entry point analysis in progress';
    }
  };

  const getRedFlagsDescription = (rating: string) => {
    switch (rating) {
      case 'Low': return 'No red flag found';
      case 'Medium': return 'Some concerns identified, monitor closely';
      case 'High': return 'Multiple red flags detected, exercise caution';
      default: return 'Risk assessment in progress';
    }
  };

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    // Prevent multiple simultaneous requests
    if (watchlistStatus.loading) {
      console.log('⏳ Watchlist operation already in progress, ignoring click');
      return;
    }

    console.log('🔄 Watchlist toggle started. Current local state:', watchlistStatus);
    console.log('🔄 Current query data:', watchlistData);

    setWatchlistStatus(prev => ({ ...prev, loading: true }));

    try {
      const token = ClientAuth.getAccessToken();

      // ALWAYS check current status from backend first to avoid conflicts
      console.log('🔍 Checking current status from backend...');
      const statusResponse = await axios.get(`/api/user/watchlist/check/${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentStatus = statusResponse.data.data.inWatchlist;
      console.log('🔍 Backend says current status is:', currentStatus);

      if (currentStatus) {
        // Remove from watchlist (this removes from ALL tabs)
        console.log('🗑️ Removing from watchlist:', symbol);
        await axios.delete(`/api/user/watchlist?symbol=${symbol}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Removed from watchlist successfully');
      } else {
        // Add to watchlist (will add to default tab or first available tab)
        console.log('🚀 Adding to watchlist:', { symbol, companyName: overview?.name, type: 'STOCK' });
        const response = await axios.post('/api/user/watchlist',
          {
            symbol,
            companyName: overview?.name || symbol,
            type: 'STOCK'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Added to watchlist successfully:', response.data);
      }

      // Refetch the status immediately after operation
      console.log('🔄 Refetching watchlist status...');
      await refetchWatchlistStatus();
      setWatchlistStatus(prev => ({ ...prev, loading: false }));

    } catch (error: any) {
      console.error('❌ Watchlist error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Current local state was:', watchlistStatus);
      console.error('❌ Current query data was:', watchlistData);

      setWatchlistStatus(prev => ({ ...prev, loading: false }));

      if (error.response?.status === 401) {
        window.location.href = '/login';
      } else {
        // Show the actual error message
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';

        // Force a refetch to get the actual state
        console.log('🔄 Error occurred, refetching status to sync UI...');
        await refetchWatchlistStatus();

        alert(`Watchlist operation failed: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-6 py-8 pt-[104px] md:pt-[123px] lg:pt-[67px]">
        {/* <div className="mb-12 pt-8">
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
        </div> */}


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
         
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
                    {Object.entries(ratiosData.ratios)
                      .filter(([key]) => key !== 'Current Price' && key !== 'High / Low')
                      .map(([key, value], index) => {
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

            {/* Comprehensive Financial Data for Verified Stocks - Move to left column */}
            {isVerified && verifiedData?.parsedStockDetail && (
              <div className="space-y-6">
                {/* Tabbed Financial Data */}
                <div className="card">
                  {/* Tab Headers */}
                  <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveFinancialTab('profit-loss')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          activeFinancialTab === 'profit-loss'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        💰 Profit & Loss
                      </button>
                      <button
                        onClick={() => setActiveFinancialTab('balance-sheet')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          activeFinancialTab === 'balance-sheet'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        🏦 Balance Sheet
                      </button>
                      <button
                        onClick={() => setActiveFinancialTab('cash-flow')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          activeFinancialTab === 'cash-flow'
                            ? 'border-purple-500 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        💸 Cash Flow
                      </button>
                      <button
                        onClick={() => setActiveFinancialTab('quarterly')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          activeFinancialTab === 'quarterly'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        📅 Quarterly
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="tab-content">
                    {/* Profit & Loss Tab */}
                    {activeFinancialTab === 'profit-loss' && verifiedData.parsedStockDetail.profitAndLoss && (
                      <div>
                        <h4 className="text-xl font-bold mb-6 flex items-center">
                          <span className="w-2 h-6 bg-green-500 mr-3"></span>
                          Profit & Loss (Latest 5 Years)
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

                    {/* Balance Sheet Tab */}
                    {activeFinancialTab === 'balance-sheet' && verifiedData.parsedStockDetail.balanceSheet && (
                      <div>
                        <h4 className="text-xl font-bold mb-6 flex items-center">
                          <span className="w-2 h-6 bg-blue-500 mr-3"></span>
                          Balance Sheet (Latest 5 Years)
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

                    {/* Cash Flow Tab */}
                    {activeFinancialTab === 'cash-flow' && verifiedData.parsedStockDetail.cashFlow && (
                      <div>
                        <h4 className="text-xl font-bold mb-6 flex items-center">
                          <span className="w-2 h-6 bg-purple-500 mr-3"></span>
                          Cash Flow (Latest 5 Years)
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

                    {/* Quarterly Performance Tab */}
                    {activeFinancialTab === 'quarterly' && verifiedData.parsedStockDetail.quarterlyData && verifiedData.parsedStockDetail.quarterlyData.sales?.length > 0 && (
                      <div>
                        <h4 className="text-xl font-bold mb-6 flex items-center">
                          <span className="w-2 h-6 bg-orange-500 mr-3"></span>
                          Quarterly Performance
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
                  </div>
                </div>

                {/* Historical Prices (separate from tabs) */}
                {verifiedData.parsedStockDetail.priceData && verifiedData.parsedStockDetail.priceData.length > 0 && (
                  <div className="card">
                    <h4 className="text-xl font-bold mb-6 flex items-center">
                      <span className="w-2 h-6 bg-indigo-500 mr-3"></span>
                      📈 Historical Prices
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

            {/* Stock News Component with Tabs - Moved to last */}
            <div className="card">
              {/* Tab Headers */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveNewsTab('news')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeNewsTab === 'news'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📰 News
                  </button>
                  <button
                    onClick={() => setActiveNewsTab('dividends')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeNewsTab === 'dividends'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    💰 Dividends
                  </button>
                  <button
                    onClick={() => setActiveNewsTab('announcements')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeNewsTab === 'announcements'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📢 Announcements
                  </button>
                  <button
                    onClick={() => setActiveNewsTab('legal-orders')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeNewsTab === 'legal-orders'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    ⚖️ Legal Orders
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeNewsTab === 'news' && (
                  <StockNews symbol={symbol} activityType="news-article" />
                )}
                {activeNewsTab === 'dividends' && (
                  <StockNews symbol={symbol} activityType="dividend" />
                )}
                {activeNewsTab === 'announcements' && (
                  <StockNews symbol={symbol} activityType="announcement" />
                )}
                {activeNewsTab === 'legal-orders' && (
                  <StockNews symbol={symbol} activityType="legal-order" />
                )}
              </div>
            </div>
          </div>

          <div
            ref={sidebarRef}
            className={`lg:col-span-1 space-y-6 transition-all duration-200 ease-out ${
              isScrollingDown
                ? 'lg:sticky lg:bottom-6 lg:self-end'
                : 'lg:sticky lg:top-6 lg:self-start'
            }`}
          >
            {/* Modern Stock Info Section */}
            <div className="relative overflow-visible">
              {/* Verification Badge Overlay */}
              {isVerified && (
                <div className="absolute -top-4 -right-4 z-20">
                  <div
                    className="w-16 h-16"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-full"
                    >
                      <path
                        d="M8.5 12.5L10.0089 14.0089C10.3526 14.3526 10.5245 14.5245 10.7198 14.5822C10.8914 14.6328 11.0749 14.6245 11.2412 14.5585C11.4305 14.4834 11.5861 14.2967 11.8973 13.9232L16 9M16.3287 4.75855C17.0676 4.77963 17.8001 5.07212 18.364 5.636C18.9278 6.19989 19.2203 6.9324 19.2414 7.67121C19.2623 8.40232 19.2727 8.76787 19.2942 8.85296C19.3401 9.0351 19.2867 8.90625 19.383 9.06752C19.428 9.14286 19.6792 9.40876 20.1814 9.94045C20.6889 10.4778 21 11.2026 21 12C21 12.7974 20.6889 13.5222 20.1814 14.0595C19.6792 14.5912 19.428 14.8571 19.383 14.9325C19.2867 15.0937 19.3401 14.9649 19.2942 15.147C19.2727 15.2321 19.2623 15.5977 19.2414 16.3288C19.2203 17.0676 18.9278 17.8001 18.364 18.364C17.8001 18.9279 17.0676 19.2204 16.3287 19.2414C15.5976 19.2623 15.2321 19.2727 15.147 19.2942C14.9649 19.3401 15.0937 19.2868 14.9325 19.3831C14.8571 19.4281 14.5912 19.6792 14.0595 20.1814C13.5222 20.6889 12.7974 21 12 21C11.2026 21 10.4778 20.6889 9.94047 20.1814C9.40874 19.6792 9.14287 19.4281 9.06753 19.3831C8.90626 19.2868 9.0351 19.3401 8.85296 19.2942C8.76788 19.2727 8.40225 19.2623 7.67121 19.2414C6.93238 19.2204 6.19986 18.9279 5.63597 18.364C5.07207 17.8001 4.77959 17.0676 4.75852 16.3287C4.73766 15.5976 4.72724 15.2321 4.70578 15.147C4.65985 14.9649 4.71322 15.0937 4.61691 14.9324C4.57192 14.8571 4.32082 14.5912 3.81862 14.0595C3.31113 13.5222 3 12.7974 3 12C3 11.2026 3.31113 10.4778 3.81862 9.94048C4.32082 9.40876 4.57192 9.14289 4.61691 9.06755C4.71322 8.90628 4.65985 9.03512 4.70578 8.85299C4.72724 8.7679 4.73766 8.40235 4.75852 7.67126C4.77959 6.93243 5.07207 6.1999 5.63597 5.636C6.19986 5.07211 6.93238 4.77963 7.67121 4.75855C8.40232 4.73769 8.76788 4.72727 8.85296 4.70581C9.0351 4.65988 8.90626 4.71325 9.06753 4.61694C9.14287 4.57195 9.40876 4.32082 9.94047 3.81863C10.4778 3.31113 11.2026 3 12 3C12.7974 3 13.5222 3.31114 14.0595 3.81864C14.5913 4.32084 14.8571 4.57194 14.9325 4.61693C15.0937 4.71324 14.9649 4.65988 15.147 4.70581C15.2321 4.72726 15.5976 4.73769 16.3287 4.75855Z"
                        stroke="#16A34A"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="#FFFFFF"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Gradient Background Card */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-gray-200/50 shadow-lg relative">

                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-xl"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full blur-lg"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 text-center">
                  {/* Company Info */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                      {overview?.name || symbol}
                    </h2>
                    <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 shadow-sm">
                      <span className="text-sm font-medium text-gray-600 tracking-wide">{symbol}</span>
                    </div>
                  </div>

                  {/* Price Section */}
                  {liveData && (
                    <div className="space-y-4">
                      {/* Main Price */}
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-sm">
                        <div className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                          {formatCurrency(liveData.price)}
                        </div>

                        {/* Change Indicator */}
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                          isPositive
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          <span className={`mr-1 ${isPositive ? '↗' : '↘'}`}>
                            {isPositive ? '↗' : '↘'}
                          </span>
                          {formatCurrency(liveData.change)} ({formatPercentage(liveData.changePercent)})
                        </div>
                      </div>

                      {/* Last Updated */}
                      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 bg-white/40 backdrop-blur-sm px-3 py-2 rounded-full inline-flex">
                        <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                        <span>Last updated: {new Date(liveData.lastUpdated).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Accent Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-b-2xl"></div>
              </div>
            </div>



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

            {/* Stock Analysis Dashboard */}
            {(isVerified && ratiosData?.ratios) && (
              <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Investment Scorecard</h3>
                      <p className="text-indigo-100 text-sm mt-1">AI-Powered Financial Analysis</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white text-sm font-semibold">VERIFIED</span>
                    </div>
                  </div>
                </div>

                {/* Grid Layout */}
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Performance */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            calculatePerformance(ratiosData.ratios, overview) === 'Good' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                            calculatePerformance(ratiosData.ratios, overview) === 'Average' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            'bg-gradient-to-br from-rose-400 to-rose-600'
                          }`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-base mb-1">Performance</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {getPerformanceDescription(calculatePerformance(ratiosData.ratios, overview))}
                            </p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap ${
                          calculatePerformance(ratiosData.ratios, overview) === 'Good' ? 'bg-emerald-100 text-emerald-800' :
                          calculatePerformance(ratiosData.ratios, overview) === 'Average' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {calculatePerformance(ratiosData.ratios, overview) === 'Average' ? 'AVG' : calculatePerformance(ratiosData.ratios, overview)}
                        </div>
                      </div>
                    </div>

                    {/* Valuation */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            calculateValuation(ratiosData.ratios, overview, liveData) === 'Low' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                            calculateValuation(ratiosData.ratios, overview, liveData) === 'Medium' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            'bg-gradient-to-br from-rose-400 to-rose-600'
                          }`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-base mb-1">Valuation</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {getValuationDescription(calculateValuation(ratiosData.ratios, overview, liveData))}
                            </p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap ${
                          calculateValuation(ratiosData.ratios, overview, liveData) === 'Low' ? 'bg-emerald-100 text-emerald-800' :
                          calculateValuation(ratiosData.ratios, overview, liveData) === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {calculateValuation(ratiosData.ratios, overview, liveData)}
                        </div>
                      </div>
                    </div>

                    {/* Growth */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            calculateGrowth(ratiosData.ratios, overview) === 'Good' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                            calculateGrowth(ratiosData.ratios, overview) === 'Average' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            'bg-gradient-to-br from-rose-400 to-rose-600'
                          }`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-base mb-1">Growth</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {getGrowthDescription(calculateGrowth(ratiosData.ratios, overview))}
                            </p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap ${
                          calculateGrowth(ratiosData.ratios, overview) === 'Good' ? 'bg-emerald-100 text-emerald-800' :
                          calculateGrowth(ratiosData.ratios, overview) === 'Average' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {calculateGrowth(ratiosData.ratios, overview) === 'Average' ? 'AVG' : calculateGrowth(ratiosData.ratios, overview)}
                        </div>
                      </div>
                    </div>

                    {/* Profitability */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            calculateProfitability(ratiosData.ratios, overview) === 'High' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                            calculateProfitability(ratiosData.ratios, overview) === 'Medium' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            'bg-gradient-to-br from-rose-400 to-rose-600'
                          }`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-base mb-1">Profitability</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {getProfitabilityDescription(calculateProfitability(ratiosData.ratios, overview))}
                            </p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap ${
                          calculateProfitability(ratiosData.ratios, overview) === 'High' ? 'bg-emerald-100 text-emerald-800' :
                          calculateProfitability(ratiosData.ratios, overview) === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {calculateProfitability(ratiosData.ratios, overview)}
                        </div>
                      </div>
                    </div>

                    {/* Entry Point */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            calculateEntryPoint(ratiosData.ratios, overview, liveData) === 'Good' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                            calculateEntryPoint(ratiosData.ratios, overview, liveData) === 'Average' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            'bg-gradient-to-br from-rose-400 to-rose-600'
                          }`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-base mb-1">Entry Point</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {getEntryPointDescription(calculateEntryPoint(ratiosData.ratios, overview, liveData))}
                            </p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap ${
                          calculateEntryPoint(ratiosData.ratios, overview, liveData) === 'Good' ? 'bg-emerald-100 text-emerald-800' :
                          calculateEntryPoint(ratiosData.ratios, overview, liveData) === 'Average' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {calculateEntryPoint(ratiosData.ratios, overview, liveData)}
                        </div>
                      </div>
                    </div>

                    {/* Red Flags */}
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            calculateRedFlags(ratiosData.ratios, overview) === 'Low' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                            calculateRedFlags(ratiosData.ratios, overview) === 'Medium' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            'bg-gradient-to-br from-rose-400 to-rose-600'
                          }`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-base mb-1">Red Flags</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {getRedFlagsDescription(calculateRedFlags(ratiosData.ratios, overview))}
                            </p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap ${
                          calculateRedFlags(ratiosData.ratios, overview) === 'Low' ? 'bg-emerald-100 text-emerald-800' :
                          calculateRedFlags(ratiosData.ratios, overview) === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {calculateRedFlags(ratiosData.ratios, overview)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span>Last updated: {new Date().toLocaleDateString()}</span>
                    <span className="text-indigo-600 font-medium">6 Metrics Analyzed</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
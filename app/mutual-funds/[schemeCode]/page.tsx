'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import AdvancedMutualFundChart from '@/components/AdvancedMutualFundChart';
import TopHoldings3DChart from '@/components/TopHoldings3DChart';
import { useAuth } from '@/lib/AuthContext';
import { ClientAuth } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald  
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#64748B'  // Slate (for Others)
];

interface Holding {
  company: string;
  allocation: number;
}

interface SectorAllocation {
  sector: string;
  allocation: number;
}

interface FundManager {
  name: string;
  experience?: string;
  qualification?: string;
}

interface FundDetails {
  minimumInvestment?: number;
  minimumSIP?: number;
  exitLoad?: string;
  fundManager?: FundManager[];
  sectors?: SectorAllocation[];
  launchDate?: string;
}

interface MutualFundDetail {
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
  isinGrowth?: string;
  isinDivReinvestment?: string;
  currentNav?: number;
  navDate?: string;
  historicalData?: Array<{
    date: string;
    nav: string;
  }>;
  fundHouseFull?: string;
  schemeType?: string;
  schemeCategory?: string;
  schemeNameFull?: string;
  // New enhanced features
  scrapedAUM?: number;
  scrapedExpenseRatio?: number;
  isPlaceholderData?: boolean;
  topHoldings?: Holding[];
  fundDetails?: FundDetails;
  additionalDataAvailable?: boolean;
  scrapedAt?: string;
  lastFetched?: string;
  dataSources?: {
    basic: string;
    nav: string;
    additional: string;
    scrapingSources?: string[];
  };
}

export default function MutualFundDetailPage() {
  const params = useParams();
  const schemeCode = params?.schemeCode as string;
  const { user, isAuthenticated } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState('1Y');
  const [expandedManagers, setExpandedManagers] = useState<Record<number, boolean>>({});
  const [watchlistStatus, setWatchlistStatus] = useState({
    inWatchlist: false,
    loading: false
  });

  const toggleManagerExpansion = (managerIndex: number) => {
    setExpandedManagers(prev => ({
      ...prev,
      [managerIndex]: !prev[managerIndex]
    }));
  };

  // Check watchlist status for mutual funds (using scheme code as symbol)
  const { data: watchlistData } = useQuery({
    queryKey: ['watchlistCheck', schemeCode],
    queryFn: async () => {
      try {
        const token = ClientAuth.getAccessToken();
        const response = await axios.get(`/api/user/watchlist/check/${schemeCode}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data.data;
      } catch (error) {
        return { inWatchlist: false };
      }
    },
    enabled: !!schemeCode && isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
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

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    setWatchlistStatus(prev => ({ ...prev, loading: true }));

    try {
      const token = ClientAuth.getAccessToken();
      const fundName = mutualFund?.schemeNameFull || mutualFund?.schemeName || 'Unknown Fund';

      if (watchlistStatus.inWatchlist) {
        // Remove from watchlist
        await axios.delete(`/api/user/watchlist?symbol=${schemeCode}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWatchlistStatus({ inWatchlist: false, loading: false });
      } else {
        // Add to watchlist - we'll need to modify the API to handle mutual funds
        await axios.post('/api/user/watchlist',
          {
            symbol: schemeCode,
            companyName: fundName,
            type: 'MUTUAL_FUND'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWatchlistStatus({ inWatchlist: true, loading: false });
      }
    } catch (error: any) {
      console.error('Watchlist error:', error);
      setWatchlistStatus(prev => ({ ...prev, loading: false }));

      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    }
  };

  const { data: mutualFund, isLoading, error, refetch } = useQuery({
    queryKey: ['mutual-fund-detail-verified', schemeCode],
    queryFn: async () => {
      const response = await axios.get(`/api/mutual-funds/${schemeCode}/verified`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch mutual fund details');
      }
      return response.data.data as MutualFundDetail & {
        isVerifiedData?: boolean;
        dataSource?: string;
        lastVerified?: string;
        verifiedBy?: string;
        assetAllocation?: any;
        portfolioAggregates?: any;
        creditRating?: any;
        sectorWiseHoldings?: any[];
        topEquityHoldings?: any[];
        topDebtHoldings?: any[];
        riskometer?: string;
        openEnded?: boolean;
        lockInPeriod?: string;
        fundInfo?: any;
        actualFundManagers?: any[];
      };
    },
    enabled: !!schemeCode,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 3,
    retryDelay: 5000,
  });

  // Prepare chart data based on selected period
  const chartData = mutualFund?.historicalData 
    ? mutualFund.historicalData
        .slice(0, selectedPeriod === '1Y' ? 365 : selectedPeriod === '6M' ? 180 : selectedPeriod === '3M' ? 90 : 30)
        .map(item => ({
          date: new Date(item.date.split('-').reverse().join('-')).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          nav: parseFloat(item.nav),
          fullDate: item.date
        }))
    : [];

  const formatCurrency = (amount?: number): string => {
    if (!amount) return 'N/A';
    
    // Convert to crores and show full values (no "k" abbreviations)
    const crores = amount / 10000000; // 1 crore = 10,000,000
    
    if (crores >= 1000) {
      return `₹${crores.toFixed(0)} Cr`;
    } else if (crores >= 100) {
      return `₹${crores.toFixed(0)} Cr`;
    } else if (crores >= 10) {
      return `₹${crores.toFixed(1)} Cr`;
    } else if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };

  const getReturnColor = (value?: number) => {
    if (!value) return 'text-gray-500';
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (!schemeCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <Header />
        <main className="w-full max-w-[1600px] mx-auto px-6 py-12 pt-[104px] md:pt-[123px] lg:pt-[67px]">
          <ErrorMessage 
            title="Invalid Mutual Fund"
            message="Please provide a valid scheme code"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <Header />
      
      <main className="w-full max-w-[1600px] mx-auto px-6 py-12 pt-[104px] md:pt-[123px] lg:pt-[67px]">
        {/* Header Section */}
        <div className="mb-12 pt-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/mutual-funds" 
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span className="mr-2">←</span>
                <span className="font-medium">Back to Mutual Funds</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleWatchlistToggle}
                disabled={watchlistStatus.loading}
                className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 ${
                  watchlistStatus.inWatchlist
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {watchlistStatus.loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : watchlistStatus.inWatchlist ? (
                  <>
                    <span className="mr-2">✓</span>
                    In Watchlist
                  </>
                ) : (
                  <>
                    <span className="mr-2">+</span>
                    Add to Watchlist
                  </>
                )}
              </button>
              <button
                onClick={() => refetch()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-300"
              >
                <span className="mr-2">🔄</span>
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="py-12">
            <ErrorMessage 
              title="Unable to load mutual fund details"
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
        ) : mutualFund ? (
          <>
            {/* Fund Header */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl mb-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-bold">
                        {mutualFund.fundHouse.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {mutualFund.schemeNameFull || mutualFund.schemeName}
                      </h1>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg text-gray-600 font-medium">
                          {mutualFund.fundHouseFull || mutualFund.fundHouse}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {mutualFund.schemeCategory || mutualFund.category}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          Code: {mutualFund.schemeCode}
                        </span>
                        {mutualFund.isVerifiedData && (
                          <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1 border border-green-200">
                            <span className="text-green-600">✓</span>
                            Verified Data
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    ₹{(mutualFund.currentNav || mutualFund.nav || 0).toFixed(4)}
                  </div>
                  <div className="text-sm text-gray-500">
                    NAV as on {mutualFund.navDate ? new Date(mutualFund.navDate.split('-').reverse().join('-')).toLocaleDateString('en-IN') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center min-h-[120px] flex flex-col justify-center">
                <div className={`text-2xl font-bold mb-2 ${getReturnColor(mutualFund.returns1Y)}`}>
                  {mutualFund.returns1Y ? `${mutualFund.returns1Y >= 0 ? '+' : ''}${mutualFund.returns1Y.toFixed(2)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">1 Year CAGR</div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center min-h-[120px] flex flex-col justify-center">
                <div className={`text-2xl font-bold mb-2 ${getReturnColor(mutualFund.returns3Y)}`}>
                  {mutualFund.returns3Y ? `${mutualFund.returns3Y >= 0 ? '+' : ''}${mutualFund.returns3Y.toFixed(2)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">3 Year CAGR</div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center min-h-[120px] flex flex-col justify-center">
                <div className={`text-2xl font-bold mb-2 ${getReturnColor(mutualFund.returns5Y)}`}>
                  {mutualFund.returns5Y ? `${mutualFund.returns5Y >= 0 ? '+' : ''}${mutualFund.returns5Y.toFixed(2)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">5 Year CAGR</div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center min-h-[120px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {mutualFund.scrapedExpenseRatio 
                    ? `${mutualFund.scrapedExpenseRatio.toFixed(2)}%`
                    : mutualFund.expenseRatio
                    ? `${mutualFund.expenseRatio.toFixed(2)}%`
                    : 'N/A'
                  }
                </div>
                <div className="text-sm text-gray-600">
                  Expense Ratio {mutualFund.scrapedExpenseRatio ? '(Live)' : '(Est.)'}
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center min-h-[120px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {mutualFund.isVerifiedData && mutualFund.portfolioAggregates?.avgMarketCap 
                    ? `₹${mutualFund.portfolioAggregates.avgMarketCap.toLocaleString('en-IN')} Cr`
                    : formatCurrency(mutualFund.scrapedAUM || mutualFund.aum)
                  }
                </div>
                <div className="text-sm text-gray-600">
                  AUM {mutualFund.scrapedAUM ? '(Live)' : '(Est.)'}
                </div>
              </div>
            </div>

            {/* NAV Chart */}
            {mutualFund.historicalData && mutualFund.historicalData.length > 0 && (
              <div className="mb-12">
                <AdvancedMutualFundChart 
                  data={mutualFund.historicalData} 
                  fundName={mutualFund.schemeName}
                  currentNav={mutualFund.currentNav || mutualFund.nav}
                />
              </div>
            )}

            {/* Fund Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Fund Information */}
              <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Fund Information</h3>
                
                {/* Basic Fund Info Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="text-xs text-blue-600 font-medium mb-1">Fund House</div>
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {mutualFund.fundHouseFull || mutualFund.fundHouse}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="text-xs text-green-600 font-medium mb-1">Category</div>
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {mutualFund.schemeCategory || mutualFund.category}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <div className="text-xs text-purple-600 font-medium mb-1">Scheme Type</div>
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {mutualFund.schemeType || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                    <div className="text-xs text-orange-600 font-medium mb-1">AUM</div>
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {mutualFund.isVerifiedData && mutualFund.portfolioAggregates?.avgMarketCap 
                        ? `₹${mutualFund.portfolioAggregates.avgMarketCap.toLocaleString('en-IN')} Cr`
                        : formatCurrency(mutualFund.scrapedAUM || mutualFund.aum)
                      }
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                    <div className="text-xs text-red-600 font-medium mb-1">Expense Ratio</div>
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {mutualFund.scrapedExpenseRatio 
                        ? `${mutualFund.scrapedExpenseRatio.toFixed(2)}%`
                        : mutualFund.expenseRatio
                        ? `${mutualFund.expenseRatio.toFixed(2)}%`
                        : 'N/A'
                      }
                    </div>
                  </div>
                  
                  {/* Launch Date - Always show */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                    <div className="text-xs text-indigo-600 font-medium mb-1">Launch Date</div>
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {(mutualFund as any).launchDate || mutualFund.fundDetails?.launchDate || 'N/A'}
                    </div>
                  </div>
                  
                  {/* Exit Load - Always show */}
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                    <div className="text-xs text-yellow-600 font-medium mb-1">Exit Load</div>
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {(mutualFund as any).exitLoad || mutualFund.fundDetails?.exitLoad || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium mb-1">ISIN Growth</div>
                    <div className="text-xs font-mono text-gray-900 leading-tight break-all">
                      {mutualFund.isinGrowth || 'N/A'}
                    </div>
                  </div>
                </div>
                
                {/* Additional Fund Information from verified data */}
                {mutualFund.isVerifiedData && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200">
                        <div className="text-xs text-teal-600 font-medium mb-1">Fund Type</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {mutualFund.openEnded ? 'Open-ended' : 'Close-ended'}
                        </div>
                      </div>
                      
                      {mutualFund.lockInPeriod && (
                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl border border-pink-200">
                          <div className="text-xs text-pink-600 font-medium mb-1">Lock-in Period</div>
                          <div className="text-sm font-semibold text-gray-900">{mutualFund.lockInPeriod}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* AMC Contact Information */}
                    {mutualFund.fundInfo && (
                      <>
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            AMC Contact Information
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {mutualFund.fundInfo.phone && (
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                              <div className="text-xs text-blue-600 font-medium mb-2">Phone</div>
                              <div className="text-sm font-semibold text-gray-900">{mutualFund.fundInfo.phone}</div>
                            </div>
                          )}
                          
                          {mutualFund.fundInfo.email && (
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                              <div className="text-xs text-green-600 font-medium mb-2">Email</div>
                              <a href={`mailto:${mutualFund.fundInfo.email}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors break-all">
                                {mutualFund.fundInfo.email}
                              </a>
                            </div>
                          )}
                          
                          {mutualFund.fundInfo.website && (
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                              <div className="text-xs text-purple-600 font-medium mb-2">Website</div>
                              <a href={mutualFund.fundInfo.website.startsWith('http') ? mutualFund.fundInfo.website : `https://${mutualFund.fundInfo.website}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer" 
                                 className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2">
                                Visit Website
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}
                          
                          {mutualFund.fundInfo.fax && (
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                              <div className="text-xs text-gray-600 font-medium mb-2">Fax</div>
                              <div className="text-sm font-semibold text-gray-900">{mutualFund.fundInfo.fax}</div>
                            </div>
                          )}
                        </div>
                        
                        {mutualFund.fundInfo.address && (
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                            <div className="text-xs text-gray-600 font-medium mb-2">Address</div>
                            <div className="text-sm text-gray-900 leading-relaxed">{mutualFund.fundInfo.address}</div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Investment Analysis */}
              <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Investment Analysis</h3>
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Performance Summary</h4>
                    <p className="text-sm text-green-700">
                      {mutualFund.returns1Y && mutualFund.returns1Y > 10 
                        ? "Strong performance with double-digit returns" 
                        : mutualFund.returns1Y && mutualFund.returns1Y > 0
                        ? "Positive returns showing steady growth"
                        : "Performance under review"
                      }
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Cost Analysis</h4>
                    <p className="text-sm text-blue-700">
                      {mutualFund.expenseRatio && mutualFund.expenseRatio < 1.0
                        ? "Low expense ratio - cost effective investment"
                        : mutualFund.expenseRatio && mutualFund.expenseRatio < 2.0
                        ? "Moderate expense ratio within industry standards"
                        : "Review expense ratio against category average"
                      }
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">Fund Size</h4>
                    <p className="text-sm text-purple-700">
                      {mutualFund.aum && mutualFund.aum > 500000000000
                        ? "Large fund size indicating strong investor confidence"
                        : mutualFund.aum && mutualFund.aum > 100000000000
                        ? "Well-sized fund with good market presence"
                        : "Growing fund with potential for expansion"
                      }
                    </p>
                  </div>
                  
                  {/* Risk Level from verified data */}
                  {mutualFund.isVerifiedData && mutualFund.riskometer && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-2">Risk Level</h4>
                      <p className="text-lg font-bold text-red-600">{mutualFund.riskometer}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Verified Data Sections */}
            {mutualFund.isVerifiedData && (
              <>

                {/* Asset Allocation */}
                {mutualFund.assetAllocation && (
                  <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl mb-8 mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Asset Allocation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {mutualFund.assetAllocation.equity}%
                        </div>
                        <div className="text-gray-600">Equity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {mutualFund.assetAllocation.debt}%
                        </div>
                        <div className="text-gray-600">Debt</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-600 mb-2">
                          {mutualFund.assetAllocation.cashAndCashEq}%
                        </div>
                        <div className="text-gray-600">Cash & Cash Eq.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Portfolio Aggregates */}
                {mutualFund.portfolioAggregates && (
                  <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Portfolio Aggregates</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {mutualFund.portfolioAggregates.giant}%
                        </div>
                        <div className="text-xs text-gray-600">Giant</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {mutualFund.portfolioAggregates.large}%
                        </div>
                        <div className="text-xs text-gray-600">Large</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {mutualFund.portfolioAggregates.mid}%
                        </div>
                        <div className="text-xs text-gray-600">Mid</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                        <div className="text-2xl font-bold text-yellow-600 mb-1">
                          {mutualFund.portfolioAggregates.small}%
                        </div>
                        <div className="text-xs text-gray-600">Small</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {mutualFund.portfolioAggregates.tiny}%
                        </div>
                        <div className="text-xs text-gray-600">Tiny</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                        <div className="text-2xl font-bold text-indigo-600 mb-1">
                          ₹{mutualFund.portfolioAggregates.avgMarketCap.toLocaleString('en-IN')} Cr
                        </div>
                        <div className="text-xs text-gray-600">Avg Market Cap</div>
                      </div>
                    </div>
                  </div>
                )}


                {/* Credit Rating - Only show for debt/mixed funds with actual data */}
                {mutualFund.creditRating && (() => {
                  // Helper function to determine if fund is primarily equity-based
                  const isEquityFund = mutualFund.assetAllocation && mutualFund.assetAllocation.equity >= 80;
                  
                  // Helper function to check if credit rating has meaningful data
                  const hasCreditRatingData = mutualFund.creditRating && 
                    (mutualFund.creditRating.aaa > 0 || 
                     mutualFund.creditRating.sov > 0 || 
                     mutualFund.creditRating.cashEquivalent > 0 || 
                     mutualFund.creditRating.aa > 0);
                  
                  // Only show if it's not an equity fund AND has meaningful credit rating data
                  return !isEquityFund && hasCreditRatingData;
                })() && (
                  <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Credit Rating Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                        <div className="text-2xl font-bold text-green-600 mb-1">{mutualFund.creditRating.aaa}%</div>
                        <div className="text-sm text-gray-600">AAA</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600 mb-1">{mutualFund.creditRating.sov}%</div>
                        <div className="text-sm text-gray-600">Sovereign</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                        <div className="text-2xl font-bold text-yellow-600 mb-1">{mutualFund.creditRating.cashEquivalent}%</div>
                        <div className="text-sm text-gray-600">Cash Equivalent</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                        <div className="text-2xl font-bold text-purple-600 mb-1">{mutualFund.creditRating.aa}%</div>
                        <div className="text-sm text-gray-600">AA</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fund Managers */}
                {mutualFund.actualFundManagers && mutualFund.actualFundManagers.length > 0 && (
                  <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Fund Managers</h3>
                    <div className="space-y-6">
                      {mutualFund.actualFundManagers.map((manager, index) => (
                        <div key={index} className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-bold text-gray-800">{manager.name}</h4>
                              {manager.since && (
                                <p className="text-sm text-gray-600">Managing since {manager.since}</p>
                              )}
                            </div>
                          </div>
                          
                          {manager.education && (
                            <div className="mb-3">
                              <h5 className="font-semibold text-gray-700 mb-1">Education</h5>
                              <p className="text-sm text-gray-600">{manager.education}</p>
                            </div>
                          )}
                          
                          {manager.experience && (
                            <div className="mb-3">
                              <h5 className="font-semibold text-gray-700 mb-1">Experience</h5>
                              <p className="text-sm text-gray-600">{manager.experience}</p>
                            </div>
                          )}
                          
                          {manager.fundsManaged && manager.fundsManaged.length > 0 && manager.fundsManaged[0] && (
                            <div>
                              <h5 className="font-semibold text-gray-700 mb-2">Other Funds Managed</h5>
                              <div className="flex flex-wrap gap-2">
                                {(() => {
                                  const filteredFunds = manager.fundsManaged.filter((fund: string) => fund && fund.trim());
                                  const isExpanded = expandedManagers[index];
                                  const displayFunds = isExpanded ? filteredFunds : filteredFunds.slice(0, 3);
                                  
                                  return (
                                    <>
                                      {displayFunds.map((fund: string, fundIndex: number) => (
                                        <span key={fundIndex} className="px-3 py-1 bg-white text-gray-700 rounded-full text-xs border border-gray-200">
                                          {fund}
                                        </span>
                                      ))}
                                      {filteredFunds.length > 3 && (
                                        <button
                                          onClick={() => toggleManagerExpansion(index)}
                                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs border border-indigo-200 hover:bg-indigo-200 transition-colors duration-200 flex items-center gap-1"
                                        >
                                          {isExpanded ? (
                                            <>
                                              Show Less
                                              <svg className="w-3 h-3 transform rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                              </svg>
                                            </>
                                          ) : (
                                            <>
                                              +{filteredFunds.length - 3} more
                                              <svg className="w-3 h-3 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                              </svg>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </>
            )}

            {/* Top Holdings - Use verified data if available, otherwise fallback to original */}
            <div className="mt-8">
              {mutualFund.isVerifiedData && mutualFund.topEquityHoldings && mutualFund.topEquityHoldings.length > 0 ? (
                <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl">
                  <div className="space-y-8">
                    {/* Main Content Grid - Holdings on Left, Sectors on Right */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Side - Top Equity Holdings (Verified Data) */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Top Holdings</h3>
                        {mutualFund.topEquityHoldings.slice(0, 10).map((holding, index) => (
                          <div 
                            key={index}
                            className="group relative overflow-hidden bg-gradient-to-r from-white to-gray-50/50 rounded-2xl p-6 border transition-all duration-500 cursor-pointer border-gray-200 hover:border-gray-300 hover:shadow-lg"
                          >
                            {/* Background Animation */}
                            <div 
                              className="absolute inset-0 opacity-10 transition-all duration-700 ease-out"
                              style={{
                                background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}22, ${COLORS[index % COLORS.length]}44)`,
                              }}
                            />
                            
                            {/* Content */}
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    <div 
                                      className="w-12 h-12 rounded-2xl shadow-lg border-4 border-white transition-all duration-300"
                                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white text-sm rounded-full flex items-center justify-center font-bold">
                                      {index + 1}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-1">
                                      {holding.companyName}
                                    </h4>
                                    <p className="text-sm text-gray-500">{holding.sector}</p>
                                    <p className="text-xs text-blue-600">PE: {holding.peRatio}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div 
                                    className="text-3xl font-bold transition-all duration-300"
                                    style={{ color: COLORS[index % COLORS.length] }}
                                  >
                                    {holding.assetsPercentage.toFixed(2)}%
                                  </div>
                                  <div className="text-sm text-gray-500">Allocation</div>
                                </div>
                              </div>

                              {/* Visual Progress Bar */}
                              <div className="relative">
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                                    style={{
                                      background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)`,
                                      width: `${Math.min(holding.assetsPercentage * 2, 100)}%`,
                                      boxShadow: `0 2px 8px ${COLORS[index % COLORS.length]}30`
                                    }}
                                  >
                                    {/* Shine effect */}
                                    <div 
                                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Summary Stats for Holdings */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100/80 rounded-2xl p-4 text-center border border-blue-200/50">
                            <div className="text-2xl font-bold text-blue-700 mb-1">
                              {mutualFund.topEquityHoldings.reduce((sum, h) => sum + h.assetsPercentage, 0).toFixed(1)}%
                            </div>
                            <div className="text-xs font-medium text-blue-600">Top Holdings</div>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100/80 rounded-2xl p-4 text-center border border-purple-200/50">
                            <div className="text-2xl font-bold text-purple-700 mb-1">
                              {mutualFund.topEquityHoldings.length}
                            </div>
                            <div className="text-xs font-medium text-purple-600">Companies</div>
                          </div>
                        </div>

                        {/* View All Holdings Button */}
                        {mutualFund.topEquityHoldings.length > 10 && (
                          <div className="mt-6">
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2">
                                  <span>View All {mutualFund.topEquityHoldings.length} Holdings</span>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden p-0 gap-0 rounded-3xl shadow-2xl">
                                <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 space-y-2">
                                  <DialogTitle className="text-2xl font-bold text-white">All Top Holdings</DialogTitle>
                                  <DialogDescription className="text-blue-100">
                                    {mutualFund.schemeName}
                                  </DialogDescription>
                                </DialogHeader>

                                {/* Modal Body */}
                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {mutualFund.topEquityHoldings.map((holding, index) => (
                                      <div 
                                        key={index}
                                        className="group relative overflow-hidden bg-gradient-to-r from-white to-gray-50/50 rounded-2xl p-6 border transition-all duration-300 cursor-pointer border-gray-200 hover:border-gray-300 hover:shadow-lg"
                                      >
                                        {/* Background Animation */}
                                        <div 
                                          className="absolute inset-0 opacity-10 transition-all duration-500 ease-out"
                                          style={{
                                            background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}22, ${COLORS[index % COLORS.length]}44)`,
                                          }}
                                        />
                                        
                                        {/* Content */}
                                        <div className="relative z-10">
                                          <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                              <div className="relative">
                                                <div 
                                                  className="w-12 h-12 rounded-2xl shadow-lg border-4 border-white transition-all duration-300"
                                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white text-sm rounded-full flex items-center justify-center font-bold">
                                                  {index + 1}
                                                </div>
                                              </div>
                                              <div>
                                                <h4 className="text-lg font-bold text-gray-900 mb-1">
                                                  {holding.companyName}
                                                </h4>
                                                <p className="text-sm text-gray-500">{holding.sector}</p>
                                                <p className="text-xs text-blue-600">PE: {holding.peRatio}</p>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <div 
                                                className="text-2xl font-bold transition-all duration-300"
                                                style={{ color: COLORS[index % COLORS.length] }}
                                              >
                                                {holding.assetsPercentage.toFixed(2)}%
                                              </div>
                                              <div className="text-sm text-gray-500">Allocation</div>
                                            </div>
                                          </div>

                                          {/* Visual Progress Bar */}
                                          <div className="relative">
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                              <div 
                                                className="h-full rounded-full transition-all duration-1000 ease-out relative"
                                                style={{
                                                  background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)`,
                                                  width: `${Math.min(holding.assetsPercentage * 2, 100)}%`,
                                                  boxShadow: `0 2px 8px ${COLORS[index % COLORS.length]}30`
                                                }}
                                              >
                                                {/* Shine effect */}
                                                <div 
                                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Summary at bottom */}
                                  <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/80 rounded-2xl p-4 text-center border border-blue-200/50">
                                      <div className="text-xl font-bold text-blue-700 mb-1">
                                        {mutualFund.topEquityHoldings.length}
                                      </div>
                                      <div className="text-xs font-medium text-blue-600">Total Companies</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-green-100/80 rounded-2xl p-4 text-center border border-green-200/50">
                                      <div className="text-xl font-bold text-green-700 mb-1">
                                        {mutualFund.topEquityHoldings.reduce((sum, h) => sum + h.assetsPercentage, 0).toFixed(1)}%
                                      </div>
                                      <div className="text-xs font-medium text-green-600">Total Allocation</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/80 rounded-2xl p-4 text-center border border-purple-200/50">
                                      <div className="text-xl font-bold text-purple-700 mb-1">
                                        {Math.max(...mutualFund.topEquityHoldings.map(h => h.assetsPercentage)).toFixed(2)}%
                                      </div>
                                      <div className="text-xs font-medium text-purple-600">Highest Allocation</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/80 rounded-2xl p-4 text-center border border-orange-200/50">
                                      <div className="text-xl font-bold text-orange-700 mb-1">
                                        {(mutualFund.topEquityHoldings.reduce((sum, h) => sum + h.assetsPercentage, 0) / mutualFund.topEquityHoldings.length).toFixed(2)}%
                                      </div>
                                      <div className="text-xs font-medium text-orange-600">Average Allocation</div>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>

                      {/* Right Side - Sector Wise Holdings (Verified Data) */}
                      <div className="space-y-4">
                        {mutualFund.sectorWiseHoldings && mutualFund.sectorWiseHoldings.length > 0 && (
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Sector-wise Allocation</h3>
                            <div className="space-y-4">
                              {mutualFund.sectorWiseHoldings.slice(0, 10).map((sector, index) => (
                                <div 
                                  key={index}
                                  className="group relative overflow-hidden bg-gradient-to-r from-white to-gray-50/50 rounded-2xl p-6 border transition-all duration-500 cursor-pointer border-gray-200 hover:border-gray-300 hover:shadow-lg"
                                >
                                  {/* Background Animation */}
                                  <div 
                                    className="absolute inset-0 opacity-10 transition-all duration-700 ease-out"
                                    style={{
                                      background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}22, ${COLORS[index % COLORS.length]}44)`,
                                    }}
                                  />
                                  
                                  {/* Content */}
                                  <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-4">
                                        <div className="relative">
                                          <div 
                                            className="w-12 h-12 rounded-2xl shadow-lg border-4 border-white transition-all duration-300"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                          />
                                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white text-sm rounded-full flex items-center justify-center font-bold">
                                            {index + 1}
                                          </div>
                                        </div>
                                        <div>
                                          <h4 className="text-xl font-bold text-gray-900 mb-1">
                                            {sector.sector}
                                          </h4>
                                          <p className="text-sm text-gray-500">vs {sector.categoryPercentage}% category avg</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div 
                                          className="text-3xl font-bold transition-all duration-300"
                                          style={{ color: COLORS[index % COLORS.length] }}
                                        >
                                          {sector.fundPercentage.toFixed(2)}%
                                        </div>
                                        <div className="text-sm text-gray-500">Fund Allocation</div>
                                      </div>
                                    </div>

                                    {/* Visual Progress Bar */}
                                    <div className="relative">
                                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                        <div 
                                          className="h-full rounded-full transition-all duration-1000 ease-out relative"
                                          style={{
                                            background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)`,
                                            width: `${Math.min(sector.fundPercentage * 2, 100)}%`,
                                            boxShadow: `0 2px 8px ${COLORS[index % COLORS.length]}30`
                                          }}
                                        >
                                          {/* Shine effect */}
                                          <div 
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Sector Summary */}
                            <div className="grid grid-cols-1 gap-4 mt-6">
                              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/80 rounded-2xl p-4 text-center border border-indigo-200/50">
                                <div className="text-2xl font-bold text-indigo-700 mb-1">
                                  {mutualFund.sectorWiseHoldings.length}
                                </div>
                                <div className="text-xs font-medium text-indigo-600">Sectors Covered</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <TopHoldings3DChart 
                  holdings={mutualFund.topHoldings || []}
                  fundDetails={mutualFund.fundDetails}
                  isPlaceholder={mutualFund.isPlaceholderData || false}
                />
              )}
            </div>

            {/* Data Sources Footer */}
            {mutualFund.dataSources && (
              <div className={`mt-8 rounded-2xl p-6 border ${
                mutualFund.isVerifiedData 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50/30 border-green-200/50' 
                  : 'bg-gradient-to-r from-gray-50 to-blue-50/30 border-gray-200/50'
              }`}>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span>{mutualFund.isVerifiedData ? '✅' : '🔗'}</span>
                  Data Sources {mutualFund.isVerifiedData && '(Verified)'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Basic Info:</span>
                    <span className={`font-medium ${mutualFund.isVerifiedData ? 'text-green-800' : 'text-gray-800'}`}>
                      {mutualFund.dataSources.basic}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">NAV & Returns:</span>
                    <span className="font-medium text-gray-800">{mutualFund.dataSources.nav}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Additional Details:</span>
                    <span className={`font-medium ${mutualFund.isVerifiedData ? 'text-green-800' : 'text-gray-800'}`}>
                      {mutualFund.dataSources.additional}
                    </span>
                  </div>
                </div>
                {mutualFund.isVerifiedData && mutualFund.verifiedBy && (
                  <div className="text-xs text-green-600 mt-4 text-center">
                    Verified by: {mutualFund.verifiedBy}
                    {mutualFund.lastVerified && (
                      <> • Last verified: {new Date(mutualFund.lastVerified).toLocaleDateString('en-IN')}</>
                    )}
                  </div>
                )}
                {mutualFund.lastFetched && (
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    Last update: {new Date(mutualFund.lastFetched).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Mutual Fund Not Found</h3>
            <p className="text-gray-600">The requested mutual fund could not be found.</p>
          </div>
        )}
      </main>

    </div>
  );
}
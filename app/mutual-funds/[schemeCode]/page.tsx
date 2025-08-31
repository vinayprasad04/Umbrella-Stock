'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
}

export default function MutualFundDetailPage() {
  const params = useParams();
  const schemeCode = params?.schemeCode as string;
  
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');

  const { data: mutualFund, isLoading, error, refetch } = useQuery({
    queryKey: ['mutual-fund-detail', schemeCode],
    queryFn: async () => {
      const response = await axios.get(`/api/mutual-funds/${schemeCode}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch mutual fund details');
      }
      return response.data.data as MutualFundDetail;
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
        .reverse()
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
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (!schemeCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <Header />
        <main className="w-full max-w-[1600px] mx-auto px-6 py-12">
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
      
      <main className="w-full max-w-[1600px] mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
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
            <button
              onClick={() => refetch()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-300"
            >
              <span className="mr-2">🔄</span>
              Refresh Data
            </button>
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
                      <div className="flex items-center gap-3">
                        <span className="text-lg text-gray-600 font-medium">
                          {mutualFund.fundHouseFull || mutualFund.fundHouse}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {mutualFund.schemeCategory || mutualFund.category}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          Code: {mutualFund.schemeCode}
                        </span>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
                <div className={`text-2xl font-bold mb-2 ${getReturnColor(mutualFund.returns1Y)}`}>
                  {mutualFund.returns1Y ? `${mutualFund.returns1Y >= 0 ? '+' : ''}${mutualFund.returns1Y.toFixed(2)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">1 Year Return</div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
                <div className={`text-2xl font-bold mb-2 ${getReturnColor(mutualFund.returns3Y)}`}>
                  {mutualFund.returns3Y ? `${mutualFund.returns3Y >= 0 ? '+' : ''}${mutualFund.returns3Y.toFixed(2)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">3 Year Return</div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
                <div className={`text-2xl font-bold mb-2 ${getReturnColor(mutualFund.returns5Y)}`}>
                  {mutualFund.returns5Y ? `${mutualFund.returns5Y >= 0 ? '+' : ''}${mutualFund.returns5Y.toFixed(2)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">5 Year Return</div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {mutualFund.expenseRatio ? `${mutualFund.expenseRatio.toFixed(2)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Expense Ratio</div>
              </div>
            </div>

            {/* NAV Chart */}
            {chartData.length > 0 && (
              <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">NAV Performance</h2>
                  <div className="flex gap-2">
                    {['1M', '3M', '6M', '1Y'].map((period) => (
                      <button
                        key={period}
                        onClick={() => setSelectedPeriod(period)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          selectedPeriod === period
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white/70 text-gray-700 hover:bg-blue-100'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs text-gray-600"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        className="text-xs text-gray-600"
                        axisLine={false}
                        tickLine={false}
                        domain={['dataMin - 5', 'dataMax + 5']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: 'none', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any) => [`₹${value.toFixed(4)}`, 'NAV']}
                        labelFormatter={(label: any) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="nav" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#3B82F6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Fund Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Fund Information */}
              <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Fund Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Fund House</span>
                    <span className="font-medium text-gray-900">{mutualFund.fundHouseFull || mutualFund.fundHouse}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium text-gray-900">{mutualFund.schemeCategory || mutualFund.category}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Scheme Type</span>
                    <span className="font-medium text-gray-900">{mutualFund.schemeType || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">AUM</span>
                    <span className="font-medium text-gray-900">{formatCurrency(mutualFund.aum)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">ISIN (Growth)</span>
                    <span className="font-medium text-gray-900 text-sm">{mutualFund.isinGrowth || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600">ISIN (Dividend)</span>
                    <span className="font-medium text-gray-900 text-sm">{mutualFund.isinDivReinvestment || 'N/A'}</span>
                  </div>
                </div>
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
                </div>
              </div>
            </div>
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
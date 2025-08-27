'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import axios from 'axios';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency, formatNumber } from '@/lib/api-utils';
import { MutualFund } from '@/types';

export default function MutualFundsPage() {
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: fundsData, isLoading } = useQuery({
    queryKey: ['mutualFunds', selectedCategory],
    queryFn: async () => {
      const response = await axios.get(`/api/mutual-funds${selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : ''}`);
      return response.data.data;
    },
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });

  const funds = fundsData?.funds || [];
  const categories = fundsData?.categories || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mutual Funds
          </h1>
          <p className="text-lg text-gray-600">
            Discover top-performing mutual funds and ETFs
          </p>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              All Categories
            </button>
            {categories.map((category: string) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funds.map((fund: MutualFund) => (
              <MutualFundCard key={fund.name} fund={fund} />
            ))}
          </div>
        )}

        {funds.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">No mutual funds found for the selected category.</p>
          </div>
        )}
      </main>
    </div>
  );
}

interface MutualFundCardProps {
  fund: MutualFund;
}

function MutualFundCard({ fund }: MutualFundCardProps) {
  const returns1YPositive = fund.returns1Y >= 0;

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2">{fund.name}</h3>
        <p className="text-sm text-gray-600">{fund.category}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">NAV</p>
          <p className="font-semibold text-lg">{formatCurrency(fund.nav)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">1Y Return</p>
          <p className={`font-semibold text-lg ${returns1YPositive ? 'stock-positive' : 'stock-negative'}`}>
            {returns1YPositive ? '+' : ''}{fund.returns1Y.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">3Y Return</span>
          <span className={`font-medium ${fund.returns3Y >= 0 ? 'stock-positive' : 'stock-negative'}`}>
            {fund.returns3Y >= 0 ? '+' : ''}{fund.returns3Y.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">5Y Return</span>
          <span className={`font-medium ${fund.returns5Y >= 0 ? 'stock-positive' : 'stock-negative'}`}>
            {fund.returns5Y >= 0 ? '+' : ''}{fund.returns5Y.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Expense Ratio</span>
          <span className="font-medium">{fund.expenseRatio.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">AUM</span>
          <span className="font-medium">{formatNumber(fund.aum)}</span>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center">
          <button className="btn-primary text-sm px-4 py-2">
            Add to Watchlist
          </button>
          <span className="text-xs text-gray-500">
            Updated {new Date(fund.lastUpdated).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
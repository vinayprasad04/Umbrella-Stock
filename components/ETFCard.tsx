'use client';

import Link from 'next/link';

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
  schemeCode?: number;  // For linking to detail page
  fundHouse?: string;
}

interface ETFCardProps {
  etf: ETF;
}

export default function ETFCard({ etf }: ETFCardProps) {
  const formatAUM = (amount: number): string => {
    if (amount >= 10000000000) { // 1000 crores
      return `₹${(amount / 10000000000).toFixed(1)}k Cr`;
    } else if (amount >= 1000000000) { // 100 crores  
      return `₹${(amount / 10000000000).toFixed(2)}k Cr`;
    } else if (amount >= 10000000) { // 1 crore
      return `₹${(amount / 10000000).toFixed(0)} Cr`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };

  // Create the link URL - if we have schemeCode, go to mutual fund detail page, otherwise show ETF info
  const linkUrl = etf.schemeCode ? `/mutual-funds/${etf.schemeCode}` : '#';
  const isClickable = !!etf.schemeCode;

  const cardContent = (
    <div className={`bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 ${isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''}`}>
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight mb-1">
              {etf.name}
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <p className="text-xs md:text-sm text-gray-500 font-medium">{etf.symbol}</p>
              {etf.fundHouse && (
                <p className="text-xs md:text-sm text-blue-600 font-medium">{etf.fundHouse}</p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg md:text-xl font-bold text-gray-900">
              ₹{etf.nav.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 font-medium">NAV</p>
          </div>
        </div>
        
        {/* Category and Index Row */}
        <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Tracking Index</p>
            <p className="text-xs md:text-sm font-semibold text-blue-700 leading-tight">{etf.trackingIndex}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Category</p>
            <p className="text-xs md:text-sm font-semibold text-gray-800">{etf.category}</p>
          </div>
        </div>
      </div>

      {/* Returns Section */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Performance Returns</h4>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="bg-white border rounded-lg p-2 md:p-3 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">1 Year</p>
            <p className={`text-sm md:text-base font-bold ${
              etf.returns1Y >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {etf.returns1Y >= 0 ? '+' : ''}{etf.returns1Y.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white border rounded-lg p-2 md:p-3 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">3 Years</p>
            <p className={`text-sm md:text-base font-bold ${
              etf.returns3Y >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {etf.returns3Y >= 0 ? '+' : ''}{etf.returns3Y.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white border rounded-lg p-2 md:p-3 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">5 Years</p>
            <p className={`text-sm md:text-base font-bold ${
              etf.returns5Y >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {etf.returns5Y >= 0 ? '+' : ''}{etf.returns5Y.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Statistics */}
      <div className="border-t border-gray-100 pt-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-2 md:p-3">
            <p className="text-xs text-orange-600 font-medium mb-1">Expense Ratio</p>
            <p className="text-sm md:text-base font-bold text-orange-700">{etf.expenseRatio}%</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 md:p-3">
            <p className="text-xs text-blue-600 font-medium mb-1">AUM</p>
            <p className="text-sm md:text-base font-bold text-blue-700">{formatAUM(etf.aum)}</p>
          </div>
        </div>
      </div>
      
    </div>
  );

  return isClickable ? (
    <Link href={linkUrl} className="block">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}
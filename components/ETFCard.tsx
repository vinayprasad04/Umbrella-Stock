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
    <div className={`card hover:shadow-lg transition-all duration-300 ${isClickable ? 'cursor-pointer hover:scale-105' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
            {etf.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{etf.symbol}</p>
          {etf.fundHouse && (
            <p className="text-xs text-blue-600 mt-1 font-medium">{etf.fundHouse}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ₹{etf.nav.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">NAV</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500">Tracking Index</p>
          <p className="text-xs font-medium text-blue-600">{etf.trackingIndex}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Category</p>
          <p className="text-xs font-medium">{etf.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <p className="text-xs text-gray-500">1Y Return</p>
          <p className={`text-xs font-medium ${
            etf.returns1Y >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {etf.returns1Y >= 0 ? '+' : ''}{etf.returns1Y.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">3Y Return</p>
          <p className={`text-xs font-medium ${
            etf.returns3Y >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {etf.returns3Y >= 0 ? '+' : ''}{etf.returns3Y.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">5Y Return</p>
          <p className={`text-xs font-medium ${
            etf.returns5Y >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {etf.returns5Y >= 0 ? '+' : ''}{etf.returns5Y.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="border-t pt-3">
        <div className="flex justify-between text-xs">
          <div>
            <span className="text-gray-500">Expense Ratio: </span>
            <span className="font-medium">{etf.expenseRatio}%</span>
          </div>
          <div>
            <span className="text-gray-500">AUM: </span>
            <span className="font-medium">{formatAUM(etf.aum)}</span>
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
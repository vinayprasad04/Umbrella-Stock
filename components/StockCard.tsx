'use client';

import Link from 'next/link';
import { formatCurrency, formatPercentage } from '@/lib/api-utils';
import { Stock } from '@/types';

interface StockCardProps {
  stock: Stock;
  rank?: number;
}

export default function StockCard({ stock, rank }: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <Link href={`/stocks/${stock.symbol}`} className="block">
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-center gap-4">
          {/* Rank Badge */}
          {rank && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${
              isPositive ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'
            }`}>
              {rank}
            </div>
          )}

          {/* Stock Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                  {stock.symbol}
                </h3>
                <p className="text-sm text-gray-600 truncate max-w-[200px]">{stock.name}</p>
                <p className="text-xs text-gray-500 mt-1">{stock.sector}</p>
              </div>
              
              <div className="text-right ml-4">
                <p className="font-bold text-lg text-gray-900">
                  ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                  isPositive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <span className="mr-1">{isPositive ? '↗' : '↘'}</span>
                  <span>{isPositive ? '+' : ''}₹{Math.abs(stock.change).toFixed(2)}</span>
                  <span className="ml-1">({Math.abs(stock.changePercent).toFixed(2)}%)</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isPositive 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-red-500 to-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(stock.changePercent) * 8, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Vol: {stock.volume.toLocaleString('en-IN')}</span>
                <span className="text-gray-400">
                  {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
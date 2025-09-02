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
      <div className="bg-white/50 backdrop-blur-sm rounded-lg md:rounded-2xl p-2 md:p-4 border border-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Rank Badge */}
          {rank && (
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-md ${
              isPositive ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'
            }`}>
              {rank}
            </div>
          )}

          {/* Stock Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm md:text-lg group-hover:text-blue-600 transition-colors">
                  {stock.symbol}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 truncate max-w-[120px] md:max-w-[200px]">{stock.name}</p>
                <p className="text-xs text-gray-500 mt-1 hidden md:block">{stock.sector}</p>
              </div>
              
              <div className="text-right ml-2 md:ml-4">
                <p className="font-bold text-sm md:text-lg text-gray-900">
                  ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <div className={`inline-flex items-center px-2 md:px-2 py-1 md:py-1 rounded-lg md:rounded-full text-xs md:text-sm font-bold shadow-sm ${
                  isPositive 
                    ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300/50' 
                    : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300/50'
                }`}>
                  <span className="text-sm md:text-xs mr-1">{isPositive ? '↗' : '↘'}</span>
                  <span className="hidden md:inline">{isPositive ? '+' : ''}₹{Math.abs(stock.change).toFixed(2)}</span>
                  <span className={`font-bold ${Math.abs(stock.changePercent).toFixed(2).length > 4 ? 'md:ml-1' : 'ml-1'}`}>({Math.abs(stock.changePercent).toFixed(2)}%)</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 md:mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1 md:h-2">
                <div
                  className={`h-1 md:h-2 rounded-full transition-all duration-500 ${
                    isPositive 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-red-500 to-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(stock.changePercent) * 8, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1 md:mt-2">
                <span className="hidden md:inline">Vol: {stock.volume.toLocaleString('en-IN')}</span>
                <span className="md:hidden text-gray-400 text-xs">Vol: {(stock.volume / 1000000).toFixed(1)}M</span>
                <span className="text-gray-400 text-xs">
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
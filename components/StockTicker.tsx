'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { isIndianMarketOpen } from '@/lib/indian-stocks-api';
import ErrorMessage from './ErrorMessage';

interface StockTickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
}

export default function StockTicker() {
  const [marketOpen, setMarketOpen] = useState(false);

  useEffect(() => {
    const checkMarketStatus = () => {
      setMarketOpen(isIndianMarketOpen());
    };
    
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const { data: stocks, isLoading, error } = useQuery({
    queryKey: ['top50Stocks'],
    queryFn: async () => {
      const response = await axios.get('/api/stocks/top-50');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch NIFTY 50 data');
      }
      return response.data.data as StockTickerData[];
    },
    refetchInterval: marketOpen ? 5000 : 5 * 60 * 1000,
    retry: 3,
    retryDelay: 5000,
  });

  if (error) {
    return (
      <div className="bg-red-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <span className="text-sm font-medium mr-2">⚠️</span>
            <span className="text-sm">
              NIFTY 50 data unavailable - {(error as Error)?.message || 'Something went wrong'}
            </span>
            <button 
              onClick={() => window.location.reload()}
              className="ml-4 text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !stocks) {
    return (
      <div className="bg-gray-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-4">Loading NSE Top 50...</span>
            <div className="animate-pulse flex space-x-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-700 h-4 w-24 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white py-2 overflow-hidden">
      <div className="whitespace-nowrap animate-marquee">
        <div className="inline-flex items-center space-x-8">
          <span className="text-sm font-medium px-4">
            📈 NSE Top 50 - {marketOpen ? 'LIVE' : 'LAST PRICES'}
          </span>
          {stocks.map((stock) => (
            <div key={stock.symbol} className="inline-flex items-center space-x-2 px-2">
              <span className="text-sm font-medium text-blue-300">
                {stock.symbol}
              </span>
              <span className="text-sm">
                ₹{stock.price.toFixed(2)}
              </span>
              <span
                className={`text-sm font-medium ${
                  stock.changePercent >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {stock.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
              </span>
              <span className="text-gray-400 text-xs">|</span>
            </div>
          ))}
          {/* Duplicate for seamless scrolling */}
          {stocks.map((stock) => (
            <div key={`${stock.symbol}-dup`} className="inline-flex items-center space-x-2 px-2">
              <span className="text-sm font-medium text-blue-300">
                {stock.symbol}
              </span>
              <span className="text-sm">
                ₹{stock.price.toFixed(2)}
              </span>
              <span
                className={`text-sm font-medium ${
                  stock.changePercent >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {stock.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
              </span>
              <span className="text-gray-400 text-xs">|</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
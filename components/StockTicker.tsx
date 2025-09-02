'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
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
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

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

  // Smooth scrolling animation
  useEffect(() => {
    if (!stocks || stocks.length === 0 || isPaused) return;

    const animate = () => {
      setScrollPosition(prev => {
        const newPosition = prev + 1.5; // Speed: pixels per frame
        const containerWidth = scrollRef.current?.scrollWidth || 0;
        const viewportWidth = scrollRef.current?.clientWidth || 0;
        
        // Reset when content completely scrolls out
        if (newPosition >= containerWidth / 2) {
          return 0;
        }
        return newPosition;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stocks, isPaused]);

  // Handle mouse events for pause functionality
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  if (error) {
    return (
      <div className="bg-red-900 text-white py-2">
        <div className="max-w-full mx-auto px-3 md:px-4 overflow-hidden">
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
        <div className="max-w-full mx-auto px-3 md:px-4 overflow-hidden">
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
    <div 
      className="bg-gray-900 text-white py-1 md:py-2 overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={scrollRef}
        className="whitespace-nowrap"
        style={{ 
          transform: `translateX(-${scrollPosition}px)`,
          transition: isPaused ? 'none' : undefined
        }}
      >
        <div className="inline-flex items-center space-x-3 md:space-x-6">
          <span className="text-xs md:text-sm font-medium px-2 md:px-4">
            📈 <span className="hidden sm:inline">NSE Top {stocks.length} - </span>{marketOpen ? 'LIVE' : 'LAST PRICES'}
          </span>
          {stocks.map((stock, index) => (
            <>
              <div key={stock.symbol} className="inline-flex items-center space-x-1 md:space-x-2 px-1 md:px-2">
                <span className="text-xs md:text-sm font-medium text-blue-300">
                  {stock.symbol}
                </span>
                <span className="text-xs md:text-sm">
                  ₹{stock.price.toFixed(2)}
                </span>
                <span
                  className={`text-xs md:text-sm font-medium ${
                    stock.changePercent >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {stock.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
                </span>
              </div>
              {index < stocks.length - 1 && (
                <span className="text-gray-400 text-xs mx-1 md:mx-3">|</span>
              )}
            </>
          ))}
          
          {/* Duplicate for seamless scrolling */}
          {stocks.map((stock, index) => (
            <>
              <div key={`${stock.symbol}-dup`} className="inline-flex items-center space-x-1 md:space-x-2 px-1 md:px-2">
                <span className="text-xs md:text-sm font-medium text-blue-300">
                  {stock.symbol}
                </span>
                <span className="text-xs md:text-sm">
                  ₹{stock.price.toFixed(2)}
                </span>
                <span
                  className={`text-xs md:text-sm font-medium ${
                    stock.changePercent >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {stock.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
                </span>
              </div>
              {index < stocks.length - 1 && (
                <span className="text-gray-400 text-xs mx-1 md:mx-3">|</span>
              )}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
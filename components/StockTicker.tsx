'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { isIndianMarketOpen } from '@/lib/indian-stocks-api';
import ErrorMessage from './ErrorMessage';

// Animated counter component - counts up slowly until actual value arrives
const AnimatedPrice = ({
  value,
  hasActualValue,
  startValue
}: {
  value: number;
  hasActualValue: boolean;
  startValue: number;
}) => {
  const [displayValue, setDisplayValue] = useState(startValue);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // If we have actual value, show it immediately
    if (hasActualValue) {
      setDisplayValue(value);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // Start counting animation from startValue
    setDisplayValue(startValue);

    // Increment by 3 every second
    intervalRef.current = setInterval(() => {
      setDisplayValue(prev => prev + 3);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [value, hasActualValue, startValue]);

  // Split the number into digits for individual animation
  const formattedValue = displayValue.toFixed(2);

  return (
    <span className="inline-flex overflow-hidden">
      {formattedValue.split('').map((char, index) => (
        <span
          key={`${char}-${displayValue}-${index}`}
          className="inline-block"
          style={{
            animation: !hasActualValue && char !== '.'
              ? `slideUp 0.3s ease-out ${index * 0.03}s`
              : 'none'
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

interface StockTickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
}

// Fixed list of stocks to display
const TICKER_STOCKS = [
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'HINDUNILVR',
  'ICICIBANK',
  'SBIN',
  'BHARTIARTL',
  'ITC'
];

export default function StockTicker() {
  const [marketOpen, setMarketOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const stockSymbols = TICKER_STOCKS; // Use constant list directly
  const [stockData, setStockData] = useState<Map<string, StockTickerData>>(new Map());
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

  // Fetch full stock list (once per day or when list changes)
  const { data: fullStockList } = useQuery(
    ['top50StocksList'],
    async () => {
      const response = await axios.get('/api/stocks/top-50');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch NIFTY 50 data');
      }
      return response.data.data as StockTickerData[];
    },
    {
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: 24 * 60 * 60 * 1000,
      retry: 3,
      retryDelay: 5000,
    }
  );

  // Initialize stock symbols and data
  useEffect(() => {
    if (!fullStockList) {
      // Data not loaded yet - counting animation will continue
      return;
    }

    // Filter only the stocks we want to display
    const filteredStocks = fullStockList.filter(stock =>
      TICKER_STOCKS.includes(stock.symbol)
    );

    // Update stock data - this will stop the counting animation and show real values
    setStockData(prevData => {
      const updatedData = new Map(prevData);
      filteredStocks.forEach(stock => {
        updatedData.set(stock.symbol, stock);
      });
      return updatedData;
    });
  }, [fullStockList]);

  // Fetch individual stock data (continuous updates)
  useQuery(
    ['tickerStocksLive'],
    async () => {
      if (stockSymbols.length === 0) return null;

      const response = await axios.get('/api/stocks/top-50');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch NIFTY 50 data');
      }

      const allStocks = response.data.data as StockTickerData[];

      // Filter only our ticker stocks
      const stocks = allStocks.filter(stock => TICKER_STOCKS.includes(stock.symbol));

      // Update stock data (without animation for continuous updates)
      setStockData(prevData => {
        const newData = new Map(prevData);

        stocks.forEach(stock => {
          newData.set(stock.symbol, stock);
        });

        return newData;
      });

      return stocks;
    },
    {
      enabled: stockSymbols.length > 0 && stockData.size > 0, // Only fetch after initial load
      refetchInterval: marketOpen ? 5000 : 5 * 60 * 1000,
      retry: 3,
      retryDelay: 5000,
    }
  );

  // Smooth scrolling animation
  useEffect(() => {
    // Don't scroll when paused or when stocks are still loading
    const isLoading = stockData.size < TICKER_STOCKS.length;
    if (stockSymbols.length === 0 || isPaused || isLoading) return;

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
  }, [stockSymbols, isPaused, stockData.size]);

  // Handle mouse events for pause functionality
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Render individual stock item
  const renderStockItem = (symbol: string, key: string, index: number) => {
    const stock = stockData.get(symbol);
    const hasActualValue = !!stock;

    // Calculate start value: 900, 910, 920, 930, 940, 950, 960, 970, 980
    const startValue = 900 + (index * 10);

    return (
      <div key={key} className="inline-flex items-center space-x-1 md:space-x-2 px-1 md:px-2">
        <span className="text-xs md:text-sm font-medium text-blue-300">
          {symbol}
        </span>
        <span className="text-xs md:text-sm">
          ₹<AnimatedPrice
            value={stock?.price || 0}
            hasActualValue={hasActualValue}
            startValue={startValue}
          />
        </span>
        {hasActualValue && (
          <span
            className={`text-xs md:text-sm font-medium ${
              stock.changePercent >= 0
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {stock.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
          </span>
        )}
        {!hasActualValue && (
          <span className="text-xs md:text-sm font-medium text-green-400">
            ▲ 0.00%
          </span>
        )}
      </div>
    );
  };

  // Don't show early loading state - let individual stocks show with their loading skeletons
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
            📈 <span className="hidden sm:inline">NSE Top Stocks - </span>{marketOpen ? 'LIVE' : 'LAST PRICES'}
          </span>
          {stockSymbols.map((symbol, index) => (
            <React.Fragment key={symbol}>
              {renderStockItem(symbol, symbol, index)}
              {index < stockSymbols.length - 1 && (
                <span className="text-gray-400 text-xs mx-1 md:mx-3">|</span>
              )}
            </React.Fragment>
          ))}

          {/* Duplicate for seamless scrolling */}
          {stockSymbols.map((symbol, index) => (
            <React.Fragment key={`${symbol}-dup`}>
              {renderStockItem(symbol, `${symbol}-dup`, index)}
              {index < stockSymbols.length - 1 && (
                <span className="text-gray-400 text-xs mx-1 md:mx-3">|</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
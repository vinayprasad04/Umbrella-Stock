'use client';

import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, 
  Line, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { StockHistory } from '@/types';

interface AdvancedStockChartProps {
  data: StockHistory[];
  symbol: string;
}

export default function AdvancedStockChart({ data, symbol }: AdvancedStockChartProps) {
  const [showVolume, setShowVolume] = useState(true);
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');

  // Calculate Simple Moving Average
  const calculateSMA = (prices: number[], period: number = 20): (number | null)[] => {
    const result: (number | null)[] = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
        result.push(sum / period);
      }
    }
    return result;
  };

  // Calculate Exponential Moving Average
  const calculateEMA = (prices: number[], period: number = 12): (number | null)[] => {
    const result: (number | null)[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        result.push(prices[i]);
      } else {
        const prev = result[i - 1] || prices[i - 1];
        result.push((prices[i] * multiplier) + (prev * (1 - multiplier)));
      }
    }
    return result;
  };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const prices = sortedData.map(item => item.close);
    const smaValues = showSMA ? calculateSMA(prices, 20) : [];
    const emaValues = showEMA ? calculateEMA(prices, 12) : [];

    return sortedData.map((item, index) => ({
      date: new Date(item.date).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short' 
      }),
      fullDate: new Date(item.date),
      price: item.close,
      open: item.open,
      high: item.high,
      low: item.low,
      volume: item.volume,
      sma: showSMA ? smaValues[index] : null,
      ema: showEMA ? emaValues[index] : null,
      // Calculate candle body for visualization
      candleBody: item.close >= item.open ? item.close - item.open : item.open - item.close,
      candleColor: item.close >= item.open ? 'bullish' : 'bearish',
      // Volume color based on price movement
      volumeColor: item.close >= item.open ? '#10b981' : '#ef4444',
    }));
  }, [data, showSMA, showEMA]);

  const formatTooltip = (value: any, name: string, props: any) => {
    if (name === 'price') {
      return [`₹${Number(value).toFixed(2)}`, 'Close'];
    }
    if (name === 'sma') {
      return [`₹${Number(value).toFixed(2)}`, 'SMA(20)'];
    }
    if (name === 'ema') {
      return [`₹${Number(value).toFixed(2)}`, 'EMA(12)'];
    }
    if (name === 'volume') {
      return [Number(value).toLocaleString(), 'Volume'];
    }
    return [value, name];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Open:</span>
              <span className="font-medium">₹{data.open?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">High:</span>
              <span className="font-medium text-green-600">₹{data.high?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Low:</span>
              <span className="font-medium text-red-600">₹{data.low?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Close:</span>
              <span className="font-medium">₹{data.price?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Volume:</span>
              <span className="font-medium">{data.volume?.toLocaleString()}</span>
            </div>
            {showSMA && data.sma && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">SMA(20):</span>
                <span className="font-medium text-orange-600">₹{data.sma.toFixed(2)}</span>
              </div>
            )}
            {showEMA && data.ema && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">EMA(12):</span>
                <span className="font-medium text-purple-600">₹{data.ema.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const toggleIndicator = (indicator: 'volume' | 'sma' | 'ema') => {
    switch (indicator) {
      case 'volume':
        setShowVolume(!showVolume);
        break;
      case 'sma':
        setShowSMA(!showSMA);
        break;
      case 'ema':
        setShowEMA(!showEMA);
        break;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No historical data available for {symbol}</p>
        </div>
      </div>
    );
  }

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1]?.price : 0;
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2]?.price : 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {symbol} Technical Analysis
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-gray-900">
              ₹{currentPrice.toFixed(2)}
            </span>
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              isPositive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isPositive ? '↗' : '↘'}
              ₹{Math.abs(priceChange).toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toggleIndicator('volume')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              showVolume 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Volume
          </button>
          <button
            onClick={() => toggleIndicator('sma')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              showSMA 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            SMA(20)
          </button>
          <button
            onClick={() => toggleIndicator('ema')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              showEMA 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            EMA(12)
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-[400px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="price"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 10', 'dataMax + 10']}
              tickFormatter={(value) => `₹${value.toFixed(0)}`}
            />
            {showVolume && (
              <YAxis 
                yAxisId="volume"
                orientation="right"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 'dataMax * 4']}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
            )}
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Volume bars */}
            {showVolume && (
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="#60a5fa"
                opacity={0.3}
                radius={[1, 1, 0, 0]}
              />
            )}
            
            {/* Price line */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: isPositive ? '#10b981' : '#ef4444' }}
            />
            
            {/* SMA line */}
            {showSMA && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sma"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                strokeDasharray="5 5"
              />
            )}
            
            {/* EMA line */}
            {showEMA && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="ema"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                strokeDasharray="3 3"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-green-500"></div>
          <span className="text-gray-600">Price</span>
        </div>
        {showVolume && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 opacity-30"></div>
            <span className="text-gray-600">Volume</span>
          </div>
        )}
        {showSMA && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-orange-500 border-dashed border-t-2 border-orange-500"></div>
            <span className="text-gray-600">SMA(20)</span>
          </div>
        )}
        {showEMA && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-purple-500 border-dashed border-t-2 border-purple-500"></div>
            <span className="text-gray-600">EMA(12)</span>
          </div>
        )}
      </div>

      {/* Market Summary */}
      {chartData.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Open</p>
              <p className="font-semibold">₹{chartData[chartData.length - 1]?.open.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">High</p>
              <p className="font-semibold text-green-600">₹{chartData[chartData.length - 1]?.high.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Low</p>
              <p className="font-semibold text-red-600">₹{chartData[chartData.length - 1]?.low.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Volume</p>
              <p className="font-semibold">{chartData[chartData.length - 1]?.volume.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
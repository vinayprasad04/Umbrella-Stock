'use client';

import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';

interface HistoricalData {
  date: string;
  nav: string;
}

interface AdvancedMutualFundChartProps {
  data: HistoricalData[];
  fundName: string;
  currentNav?: number;
}

export default function AdvancedMutualFundChart({ data, fundName, currentNav }: AdvancedMutualFundChartProps) {
  const [showSMA, setShowSMA] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');
  const [chartStyle, setChartStyle] = useState<'line' | 'area'>('area');

  // Calculate Simple Moving Average
  const calculateSMA = (prices: number[], period: number = 30): (number | null)[] => {
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

  // Filter data based on time period
  const filterDataByPeriod = (data: HistoricalData[], period: string): HistoricalData[] => {
    if (period === 'ALL') return data;
    
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1M':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6M':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return data;
    }
    
    return data.filter(item => new Date(item.date) >= startDate);
  };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const filteredData = filterDataByPeriod(data, timePeriod);
    const sortedData = [...filteredData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const navValues = sortedData.map(item => parseFloat(item.nav));
    const smaValues = showSMA ? calculateSMA(navValues, 30) : [];

    return sortedData.map((item, index) => ({
      date: new Date(item.date).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short',
        year: timePeriod === '1Y' || timePeriod === 'ALL' ? '2-digit' : undefined 
      }),
      fullDate: new Date(item.date),
      nav: parseFloat(item.nav),
      sma: showSMA ? smaValues[index] : null,
    }));
  }, [data, timePeriod, showSMA]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">NAV:</span>
              <span className="font-medium text-blue-600">₹{data.nav?.toFixed(4)}</span>
            </div>
            {showSMA && data.sma && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">SMA(30):</span>
                <span className="font-medium text-yellow-600">₹{data.sma.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No historical data available</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No data available for selected time period</p>
          <button 
            onClick={() => setTimePeriod('ALL')} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Show All Data
          </button>
        </div>
      </div>
    );
  }

  const firstNav = chartData.length > 0 ? chartData[0]?.nav : 0;
  const lastNav = chartData.length > 0 ? chartData[chartData.length - 1]?.nav : 0;
  const totalReturn = firstNav ? ((lastNav - firstNav) / firstNav) * 100 : 0;
  const isPositive = totalReturn >= 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            NAV Performance
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-gray-900">
              ₹{currentNav?.toFixed(4) || lastNav.toFixed(4)}
            </span>
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              isPositive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isPositive ? '↗' : '↘'}
              {totalReturn.toFixed(2)}% ({timePeriod})
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {/* Time Period Buttons */}
          {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                timePeriod === period
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
          
          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              showSMA 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            SMA(30)
          </button>

          <button
            onClick={() => setChartStyle(chartStyle === 'line' ? 'area' : 'line')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            {chartStyle === 'line' ? '📊' : '📈'}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartStyle === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 0.1', 'dataMax + 0.1']}
                tickFormatter={(value) => `₹${value.toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Area
                type="monotone"
                dataKey="nav"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#navGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#3B82F6' }}
              />
              
              {showSMA && (
                <Line
                  type="monotone"
                  dataKey="sma"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  strokeDasharray="5 5"
                />
              )}
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 0.1', 'dataMax + 0.1']}
                tickFormatter={(value) => `₹${value.toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Line
                type="monotone"
                dataKey="nav"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3B82F6' }}
              />
              
              {showSMA && (
                <Line
                  type="monotone"
                  dataKey="sma"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  strokeDasharray="5 5"
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-1 ${chartStyle === 'area' ? 'bg-blue-500 opacity-50' : 'bg-blue-500'}`}></div>
          <span className="text-gray-600">NAV</span>
        </div>
        {showSMA && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-yellow-500 border-dashed border-t-2 border-yellow-500"></div>
            <span className="text-gray-600">SMA(30)</span>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Current NAV</p>
            <p className="font-semibold">₹{currentNav?.toFixed(4) || lastNav.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Period Low</p>
            <p className="font-semibold text-red-600">₹{Math.min(...chartData.map(d => d.nav)).toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Period High</p>
            <p className="font-semibold text-green-600">₹{Math.max(...chartData.map(d => d.nav)).toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total Return</p>
            <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{totalReturn.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
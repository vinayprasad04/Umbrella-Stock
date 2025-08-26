'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StockHistory } from '@/types';

interface StockChartProps {
  data: StockHistory[];
  symbol: string;
}

export default function StockChart({ data, symbol }: StockChartProps) {
  const chartData = data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      price: item.close,
      volume: item.volume,
    }));

  const formatTooltip = (value: any, name: string) => {
    if (name === 'price') {
      return [`₹${value.toFixed(2)}`, 'Price'];
    }
    return [value, name];
  };

  const isPositiveTrend = chartData.length > 1 && 
    chartData[chartData.length - 1].price > chartData[0].price;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">
        {symbol} Price Chart (30 Days)
      </h3>
      
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={['dataMin - 5', 'dataMax + 5']}
              tickFormatter={(value) => `₹${value.toFixed(0)}`}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositiveTrend ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: isPositiveTrend ? '#10b981' : '#ef4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
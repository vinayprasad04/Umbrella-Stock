'use client';

import { LineChart, Line, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { IndexData } from '@/pages/api/indices/live';

interface IndexMiniChartProps {
  index: IndexData;
  className?: string;
}

// Generate mock historical data points for the chart
function generateMockChartData(currentPrice: number, changePercent: number) {
  const dataPoints = 25; // Number of data points for the mini chart
  const data = [];
  
  // Start from a price that would result in the current change
  const startPrice = currentPrice - (currentPrice * changePercent / 100);
  
  // Create a more realistic intraday pattern
  for (let i = 0; i < dataPoints; i++) {
    const progress = i / (dataPoints - 1);
    
    // Create a curved progression that simulates real market movement
    let priceProgress;
    if (changePercent >= 0) {
      // For positive changes, create an upward trend with some volatility
      priceProgress = Math.pow(progress, 0.8); // Slight curve upward
    } else {
      // For negative changes, create a downward trend
      priceProgress = 1 - Math.pow(1 - progress, 0.8); // Slight curve downward
    }
    
    const basePrice = startPrice + (currentPrice - startPrice) * priceProgress;
    
    // Add realistic intraday volatility (decreases towards the end)
    const volatilityFactor = (1 - progress * 0.3); // Less volatility as day progresses
    const volatility = basePrice * 0.008 * volatilityFactor * (Math.random() - 0.5);
    const price = basePrice + volatility;
    
    data.push({
      time: i,
      price: Math.max(startPrice * 0.95, price), // Prevent unrealistic price drops
    });
  }
  
  // Ensure the last point matches the current price
  data[dataPoints - 1].price = currentPrice;
  
  return data;
}

export default function IndexMiniChart({ index, className = '' }: IndexMiniChartProps) {
  const chartData = generateMockChartData(index.price, index.changePercent);
  const isPositive = index.changePercent >= 0;
  
  return (
    <div className={`w-full h-12 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${index.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="0%" 
                stopColor={isPositive ? '#22c55e' : '#ef4444'} 
                stopOpacity={0.3}
              />
              <stop 
                offset="100%" 
                stopColor={isPositive ? '#22c55e' : '#ef4444'} 
                stopOpacity={0.0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth={2}
            fill={`url(#gradient-${index.symbol})`}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
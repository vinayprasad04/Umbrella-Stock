'use client';

import { IndexData } from '@/pages/api/indices/live';
import IndexMiniChart from './IndexMiniChart';

interface IndexCardProps {
  index: IndexData;
  size?: 'small' | 'medium' | 'large';
}

export default function IndexCard({ index, size = 'medium' }: IndexCardProps) {
  const isPositive = index.changePercent >= 0;
  
  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };
  
  const textSizes = {
    small: {
      price: 'text-lg',
      name: 'text-sm',
      change: 'text-xs'
    },
    medium: {
      price: 'text-xl',
      name: 'text-sm',
      change: 'text-xs'
    },
    large: {
      price: 'text-2xl',
      name: 'text-base',
      change: 'text-sm'
    }
  };

  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 ${sizeClasses[size]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-gray-900 ${textSizes[size].name} mb-1 truncate`}>
            {index.name}
          </div>
          <div className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'} ${textSizes[size].price}`}>
            ₹{index.price.toLocaleString('en-IN', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-white font-medium ${textSizes[size].change} ${
          isPositive ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {isPositive ? '↗' : '↘'} {Math.abs(index.changePercent).toFixed(2)}%
        </div>
      </div>


      {/* Bottom Info */}
      <div className="flex items-center justify-between">
        <div className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'} ${textSizes[size].change}`}>
          {isPositive ? '+' : ''}₹{index.change.toFixed(2)}
        </div>
        <div className={`text-gray-500 ${textSizes[size].change}`}>
          {new Date(index.lastUpdated).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}
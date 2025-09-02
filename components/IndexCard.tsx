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
    small: 'p-3 md:p-3',
    medium: 'p-4 md:p-4',
    large: 'p-6 md:p-6'
  };
  
  const textSizes = {
    small: {
      price: 'text-lg md:text-lg font-bold',
      name: 'text-sm md:text-sm font-semibold',
      change: 'text-xs md:text-xs font-bold'
    },
    medium: {
      price: 'text-xl md:text-xl font-bold',
      name: 'text-sm md:text-sm font-semibold',
      change: 'text-xs md:text-xs font-bold'
    },
    large: {
      price: 'text-2xl md:text-2xl font-bold',
      name: 'text-base md:text-base font-semibold',
      change: 'text-sm md:text-sm font-bold'
    }
  };

  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 ${sizeClasses[size]}`}>
      {/* Mobile: Stacked Layout, Desktop: Side by Side */}
      <div className="block md:flex md:items-start md:justify-between md:mb-2">
        {/* Index Name and Price */}
        <div className="flex-1 min-w-0 md:pr-2">
          <div className={`text-gray-900 ${textSizes[size].name} mb-1 truncate leading-tight`}>
            {index.name}
          </div>
          <div className={`${isPositive ? 'text-green-600' : 'text-red-600'} ${textSizes[size].price} leading-tight mb-2 md:mb-0`}>
            ₹{index.price.toLocaleString('en-IN', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </div>
        </div>
        
        {/* Percentage Change - More prominent on mobile */}
        <div className={`flex justify-center md:justify-end mb-3 md:mb-0`}>
          <div className={`px-3 md:px-2 py-2 md:py-1 rounded-lg md:rounded-full text-white font-bold text-sm md:${textSizes[size].change} shadow-md ${
            isPositive ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
          }`}>
            <span className="flex items-center whitespace-nowrap">
              <span className="text-base md:text-sm mr-1">{isPositive ? '↗' : '↘'}</span>
              <span className="font-extrabold md:font-bold">{Math.abs(index.changePercent).toFixed(1)}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="flex items-center justify-between pt-2 md:pt-0 border-t md:border-t-0 border-gray-200/30">
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
'use client';

import Link from 'next/link';
import { formatCurrency, formatPercentage } from '@/lib/api-utils';
import { Stock } from '@/types';

interface StockCardProps {
  stock: Stock;
}

export default function StockCard({ stock }: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <Link href={`/stocks/${stock.symbol}`}>
      <div className="card hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{stock.symbol}</h3>
            <p className="text-sm text-gray-600 truncate">{stock.name}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-gray-900">
              {formatCurrency(stock.price)}
            </p>
            <div className={`text-sm font-medium ${isPositive ? 'stock-positive' : 'stock-negative'}`}>
              <span>{formatCurrency(stock.change)}</span>
              <span className="ml-1">({formatPercentage(stock.changePercent)})</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-3">
          <span>Volume: {stock.volume.toLocaleString()}</span>
          <span>{stock.sector}</span>
        </div>

        <div className="mt-3">
          <div className={`w-full h-2 rounded-full ${isPositive ? 'bg-success-100' : 'bg-danger-100'}`}>
            <div
              className={`h-2 rounded-full ${isPositive ? 'bg-success-500' : 'bg-danger-500'}`}
              style={{
                width: `${Math.min(Math.abs(stock.changePercent) * 10, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
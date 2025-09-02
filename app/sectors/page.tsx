'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Sector } from '@/types';

export default function SectorsPage() {
  const { data: sectors, isLoading } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const response = await axios.get('/api/sectors');
      return response.data.data as Sector[];
    },
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-6 py-8 pt-[104px] md:pt-[123px] lg:pt-[67px]">
        <div className="mb-12 pt-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sector Performance
          </h1>
          <p className="text-lg text-gray-600">
            Track how different market sectors are performing
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectors?.map((sector) => (
              <SectorCard key={sector.name} sector={sector} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface SectorCardProps {
  sector: Sector;
}

function SectorCard({ sector }: SectorCardProps) {
  const isPositive = sector.performance >= 0;

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-xl text-gray-900">{sector.name}</h3>
          <p className="text-sm text-gray-600">{sector.stockCount} stocks</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${isPositive ? 'stock-positive' : 'stock-negative'}`}>
            {isPositive ? '+' : ''}{sector.performance.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className={`w-full h-2 rounded-full ${isPositive ? 'bg-success-100' : 'bg-danger-100'}`}>
          <div
            className={`h-2 rounded-full ${isPositive ? 'bg-success-500' : 'bg-danger-500'}`}
            style={{
              width: `${Math.min(Math.abs(sector.performance) * 10, 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 mb-2">Top Stocks:</h4>
        {sector.topStocks.map((stock) => (
          <a
            key={stock}
            href={`/stocks/${stock}`}
            className="block text-primary-600 hover:text-primary-700 text-sm transition-colors"
          >
            {stock}
          </a>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Last updated</span>
          <span>{new Date(sector.lastUpdated).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
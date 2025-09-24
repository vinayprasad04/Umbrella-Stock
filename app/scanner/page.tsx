'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { formatCurrency, formatPercentage } from '@/lib/api-utils';

// Custom styles for new design
const customStyles = `
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
  }
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 3px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
  }
  .filter-card {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .glass-effect {
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.85);
  }
`;

interface StockData {
  id: number;
  name: string;
  subSector: string;
  marketCap: number;
  closePrice: number;
  peRatio: number;
  oneMonthReturn: number;
  tenDayReturn: number;
  returnOnEquity: number;
}

// Sample data - replace with actual API call
const sampleStocks: StockData[] = [
  {
    id: 1,
    name: "Reliance Industries Ltd",
    subSector: "Oil & Gas - Refining & Marketing",
    marketCap: 1871540.97,
    closePrice: 1383.00,
    peRatio: 26.87,
    oneMonthReturn: -1.66,
    tenDayReturn: -0.49,
    returnOnEquity: 7.20
  },
  {
    id: 2,
    name: "HDFC Bank Ltd",
    subSector: "Private Banks",
    marketCap: 1460844.27,
    closePrice: 951.05,
    peRatio: 20.64,
    oneMonthReturn: -2.35,
    tenDayReturn: -0.64,
    returnOnEquity: 14.05
  },
  {
    id: 3,
    name: "Bharti Airtel Ltd",
    subSector: "Telecom Services",
    marketCap: 1157763.73,
    closePrice: 1931.10,
    peRatio: 34.50,
    oneMonthReturn: 0.53,
    tenDayReturn: -0.39,
    returnOnEquity: 25.91
  },
  {
    id: 4,
    name: "Tata Consultancy Services Ltd",
    subSector: "IT Services & Consulting",
    marketCap: 1098234.29,
    closePrice: 3035.40,
    peRatio: 22.62,
    oneMonthReturn: -0.87,
    tenDayReturn: -0.88,
    returnOnEquity: 51.90
  },
  {
    id: 5,
    name: "ICICI Bank Ltd",
    subSector: "Private Banks",
    marketCap: 987231.99,
    closePrice: 1382.70,
    peRatio: 19.35,
    oneMonthReturn: -2.37,
    tenDayReturn: -0.83,
    returnOnEquity: 17.04
  }
];

export default function ScannerPage() {
  const [stocks, setStocks] = useState<StockData[]>(sampleStocks);
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>(sampleStocks);
  const [sortConfig, setSortConfig] = useState<{ key: keyof StockData; direction: 'asc' | 'desc' } | null>(null);

  // Filter states
  const [marketCapFilter, setMarketCapFilter] = useState<[number, number]>([0, 1871540.97]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedCapSize, setSelectedCapSize] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 4000]);
  const [peRatioRange, setPeRatioRange] = useState<[number, number]>([0, 100]);
  const [oneMonthReturnRange, setOneMonthReturnRange] = useState<[number, number]>([-10, 20]);
  const [tenDayReturnRange, setTenDayReturnRange] = useState<[number, number]>([-5, 5]);
  const [roeRange, setRoeRange] = useState<[number, number]>([0, 60]);
  const [pbRatioRange, setPbRatioRange] = useState<[number, number]>([0, 10]);

  const handleSort = (key: keyof StockData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedData = [...filteredStocks].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredStocks(sortedData);
  };

  const getSortIcon = (columnName: keyof StockData) => {
    if (!sortConfig || sortConfig.key !== columnName) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }

    if (sortConfig.direction === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  const resetAllFilters = () => {
    setMarketCapFilter([0, 1871540.97]);
    setSelectedSector('');
    setSelectedCapSize('');
    setPriceRange([0, 4000]);
    setPeRatioRange([0, 100]);
    setOneMonthReturnRange([-10, 20]);
    setTenDayReturnRange([-5, 5]);
    setRoeRange([0, 60]);
    setPbRatioRange([0, 10]);
    setFilteredStocks(stocks);
  };

  // Quick filter functions
  const applyLargeCapFilter = () => {
    const filtered = stocks.filter(stock => stock.marketCap > 200000); // Large cap > 20,000 Cr
    setFilteredStocks(filtered);
    setSelectedCapSize('largecap');
  };

  const applyLowPEFilter = () => {
    const filtered = stocks.filter(stock => stock.peRatio < 20);
    setFilteredStocks(filtered);
  };

  const applyHighROEFilter = () => {
    const filtered = stocks.filter(stock => stock.returnOnEquity > 15);
    setFilteredStocks(filtered);
  };

  const applyBankingSectorFilter = () => {
    const filtered = stocks.filter(stock =>
      stock.subSector.toLowerCase().includes('bank') ||
      stock.subSector.toLowerCase().includes('private banks')
    );
    setFilteredStocks(filtered);
    setSelectedSector('banking');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Header />

      <main className="pt-[120px] md:pt-[140px] lg:pt-[90px] pb-8">
        {/* Top Header Section */}
        <div className="px-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Stock Screener</h1>
              <p className="text-slate-600">Find the perfect stocks with advanced filtering</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all">
                Save Screen
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
                Export Results
              </button>
            </div>
          </div>

        </div>

        <div className="px-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-24">
                {/* Filters Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
                  <button
                    onClick={resetAllFilters}
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    Reset all
                  </button>
                </div>

                {/* Filter Categories */}
                <div className="space-y-4">
                  {/* Stock Universe */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Stock Universe</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option>All Stocks</option>
                      <option>NSE 500</option>
                      <option>BSE 500</option>
                      <option>Large Cap</option>
                    </select>
                  </div>

                  {/* Sector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sector</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value)}
                    >
                      <option value="">All Sectors</option>
                      <option value="banking">Banking</option>
                      <option value="it">Information Technology</option>
                      <option value="energy">Energy</option>
                      <option value="telecom">Telecommunications</option>
                    </select>
                  </div>

                  {/* Market Cap */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Market Cap</label>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max="1871540.97"
                        value={marketCapFilter[1]}
                        onChange={(e) => setMarketCapFilter([0, parseFloat(e.target.value)])}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>₹0</span>
                        <span>₹{(marketCapFilter[1]/100000).toFixed(0)}L Cr</span>
                      </div>
                      <div className="flex gap-2">
                        {['Small', 'Mid', 'Large'].map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedCapSize(size.toLowerCase() + 'cap')}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              selectedCapSize === size.toLowerCase() + 'cap'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Additional Filters */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price Range (₹)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">P/E Ratio</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ROE (%)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <button className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm">
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="col-span-12 lg:col-span-9">
              {/* Results Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-lg font-semibold text-slate-900">
                        {filteredStocks.length} stocks found
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">Showing 1-20</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Updated 9:45 PM IST</span>
                    <button className="px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-sm">
                      Export
                    </button>
                  </div>
                </div>
              </div>

              {/* Stock Cards Grid */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-auto scrollbar-thin" style={{maxHeight: '600px'}}>
                  <table className="w-full">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-indigo-600">
                            Company {getSortIcon('name')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Sector
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('marketCap')} className="flex items-center gap-1 hover:text-indigo-600">
                            Market Cap {getSortIcon('marketCap')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('closePrice')} className="flex items-center gap-1 hover:text-indigo-600">
                            Price {getSortIcon('closePrice')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('peRatio')} className="flex items-center gap-1 hover:text-indigo-600">
                            P/E {getSortIcon('peRatio')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('oneMonthReturn')} className="flex items-center gap-1 hover:text-indigo-600">
                            1M Return {getSortIcon('oneMonthReturn')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('tenDayReturn')} className="flex items-center gap-1 hover:text-indigo-600">
                            1D Return {getSortIcon('tenDayReturn')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <button onClick={() => handleSort('returnOnEquity')} className="flex items-center gap-1 hover:text-indigo-600">
                            ROE {getSortIcon('returnOnEquity')}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStocks.slice(0, 20).map((stock, index) => (
                        <tr key={stock.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer">
                                  {stock.name}
                                </div>
                                <div className="text-xs text-slate-500">Listed Stock</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              {stock.subSector}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-semibold text-slate-900">
                              ₹{(stock.marketCap/100000).toFixed(2)}L Cr
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-semibold text-slate-900">
                              ₹{stock.closePrice.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                              {stock.peRatio.toFixed(2)}x
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              stock.oneMonthReturn >= 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {stock.oneMonthReturn >= 0 ? '+' : ''}{stock.oneMonthReturn.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              stock.tenDayReturn >= 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {stock.tenDayReturn >= 0 ? '+' : ''}{stock.tenDayReturn.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${Math.min(stock.returnOnEquity * 1.67, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-slate-900">{stock.returnOnEquity.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
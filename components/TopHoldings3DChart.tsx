'use client';

import React, { useState } from 'react';

interface Holding {
  company: string;
  allocation: number;
}

interface SectorAllocation {
  sector: string;
  allocation: number;
}

interface FundManager {
  name: string;
  experience?: string;
  qualification?: string;
}

interface FundDetails {
  minimumInvestment?: number;
  minimumSIP?: number;
  exitLoad?: string;
  fundManager?: FundManager[];
  sectors?: SectorAllocation[];
  launchDate?: string;
}

interface TopHoldings3DChartProps {
  holdings: Holding[];
  fundDetails?: FundDetails;
  isPlaceholder?: boolean;
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald  
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#64748B'  // Slate (for Others)
];

const TopHoldings3DChart: React.FC<TopHoldings3DChartProps> = ({ 
  holdings,
  fundDetails,
  isPlaceholder = false 
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Prepare data for the chart
  const totalShownAllocation = holdings.reduce((sum, holding) => sum + holding.allocation, 0);
  const othersAllocation = Math.max(0, 100 - totalShownAllocation);

  const chartData = [
    ...holdings.map((holding, index) => ({
      name: holding.company,
      value: holding.allocation,
      color: COLORS[index % COLORS.length],
      isOthers: false
    })),
    ...(othersAllocation > 0 ? [{
      name: 'Others',
      value: othersAllocation,
      color: COLORS[COLORS.length - 1],
      isOthers: true
    }] : [])
  ];



  if (!holdings || holdings.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Top Holdings</h3>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg font-medium mb-2">No Holdings Data Available</p>
          <p className="text-sm text-center">
            Holdings data is currently being processed or unavailable for this fund.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl">

      
      <div className="space-y-8">
 {/* Fund Details & Additional Information */}
        {fundDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ">
            {/* Investment Information */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">💰</span>
                Investment Details
              </h3>
              <div className="space-y-4">
                {fundDetails.minimumInvestment && (
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                    <span className="text-gray-600 font-medium">Minimum Investment</span>
                    <span className="font-bold text-green-700">
                      ₹{fundDetails.minimumInvestment.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {fundDetails.minimumSIP && (
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                    <span className="text-gray-600 font-medium">Minimum SIP</span>
                    <span className="font-bold text-green-700">
                      ₹{fundDetails.minimumSIP.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {fundDetails.exitLoad && (
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                    <span className="text-gray-600 font-medium">Exit Load</span>
                    <span className="font-bold text-red-600">{fundDetails.exitLoad}</span>
                  </div>
                )}
                {fundDetails.launchDate && (
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                    <span className="text-gray-600 font-medium">Launch Date</span>
                    <span className="font-bold text-gray-700">{fundDetails.launchDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fund Manager Information */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">👨‍💼</span>
                Fund Manager{fundDetails.fundManager && fundDetails.fundManager.length > 1 ? 's' : ''}
              </h3>
              {fundDetails.fundManager && fundDetails.fundManager.length > 0 ? (
                <div className="space-y-4">
                  {fundDetails.fundManager.map((manager, index) => (
                    <div key={index} className="p-4 bg-white/60 rounded-xl">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">{manager.name}</h4>
                      {manager.experience && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Experience:</span> {manager.experience}
                        </p>
                      )}
                      {manager.qualification && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Qualification:</span> {manager.qualification}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-white/60 rounded-xl text-center">
                  <p className="text-gray-500">Fund manager information not available</p>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Main Content Grid - Holdings on Left, Sectors on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Top Holdings */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Top Holdings</h3>
          {chartData.map((item, index) => (
            <div 
              key={index}
              className={`group relative overflow-hidden bg-gradient-to-r from-white to-gray-50/50 rounded-2xl p-6 border transition-all duration-500 cursor-pointer ${
                activeIndex === index 
                  ? 'border-blue-300 shadow-xl scale-[1.02] bg-blue-50/50' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {/* Background Animation */}
              <div 
                className="absolute inset-0 opacity-10 transition-all duration-700 ease-out"
                style={{
                  background: `linear-gradient(135deg, ${item.color}22, ${item.color}44)`,
                  transform: activeIndex === index ? 'scale(1.1)' : 'scale(1)'
                }}
              />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div 
                        className="w-12 h-12 rounded-2xl shadow-lg border-4 border-white transition-all duration-300"
                        style={{ 
                          backgroundColor: item.color,
                          transform: activeIndex === index ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                        }}
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white text-sm rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-1">
                        {item.name}
                      </h4>
                      {item.isOthers && (
                        <p className="text-sm text-gray-500">Remaining companies</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div 
                      className="text-3xl font-bold transition-all duration-300"
                      style={{ 
                        color: item.color,
                        textShadow: activeIndex === index ? `0 0 20px ${item.color}40` : 'none'
                      }}
                    >
                      {item.value.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-500">Allocation</div>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out relative"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
                        width: `${Math.min(item.value * 1.2, 100)}%`,
                        boxShadow: activeIndex === index ? `0 0 30px ${item.color}60` : `0 2px 8px ${item.color}30`
                      }}
                    >
                      {/* Shine effect */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-1000"
                        style={{
                          transform: activeIndex === index ? 'translateX(100%)' : 'translateX(-100%)'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Percentage marker */}
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 text-xs font-bold text-white bg-gray-800 rounded-full px-2 py-1 transition-all duration-300"
                    style={{ 
                      left: `${Math.min(item.value * 1.2, 95)}%`,
                      opacity: activeIndex === index ? 1 : 0,
                      transform: `translateY(-50%) ${activeIndex === index ? 'translateY(-8px) scale(1)' : 'translateY(0) scale(0.8)'}`
                    }}
                  >
                    {item.value.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}

            {/* Summary Stats for Holdings */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/80 rounded-2xl p-4 text-center border border-blue-200/50">
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  {totalShownAllocation.toFixed(1)}%
                </div>
                <div className="text-xs font-medium text-blue-600">Top Holdings</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/80 rounded-2xl p-4 text-center border border-purple-200/50">
                <div className="text-2xl font-bold text-purple-700 mb-1">
                  {othersAllocation.toFixed(1)}%
                </div>
                <div className="text-xs font-medium text-purple-600">Others</div>
              </div>
            </div>
          </div>

          {/* Right Side - Sector Allocation */}
          <div className="space-y-4">
            {fundDetails?.sectors && fundDetails.sectors.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sector-wise Allocation</h3>
                <div className="space-y-4">
                  {fundDetails.sectors.map((sector, index) => (
                  <div 
                    key={index}
                    className={`group relative overflow-hidden bg-gradient-to-r from-white to-gray-50/50 rounded-2xl p-6 border transition-all duration-500 cursor-pointer ${
                      activeIndex === 100 + index 
                        ? 'border-blue-300 shadow-xl scale-[1.02] bg-blue-50/50' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                    onMouseEnter={() => setActiveIndex(100 + index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {/* Background Animation */}
                    <div 
                      className="absolute inset-0 opacity-10 transition-all duration-700 ease-out"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}22, ${COLORS[index % COLORS.length]}44)`,
                        transform: activeIndex === 100 + index ? 'scale(1.1)' : 'scale(1)'
                      }}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div 
                              className="w-12 h-12 rounded-2xl shadow-lg border-4 border-white transition-all duration-300"
                              style={{ 
                                backgroundColor: COLORS[index % COLORS.length],
                                transform: activeIndex === 100 + index ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                              }}
                            />
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white text-sm rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">
                              {sector.sector}
                            </h4>
                            <p className="text-sm text-gray-500">Industry sector</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div 
                            className="text-3xl font-bold transition-all duration-300"
                            style={{ 
                              color: COLORS[index % COLORS.length],
                              textShadow: activeIndex === 100 + index ? `0 0 20px ${COLORS[index % COLORS.length]}40` : 'none'
                            }}
                          >
                            {sector.allocation.toFixed(2)}%
                          </div>
                          <div className="text-sm text-gray-500">Allocation</div>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out relative"
                            style={{
                              background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)`,
                              width: `${Math.min(sector.allocation * 2, 100)}%`,
                              boxShadow: activeIndex === 100 + index ? `0 0 30px ${COLORS[index % COLORS.length]}60` : `0 2px 8px ${COLORS[index % COLORS.length]}30`
                            }}
                          >
                            {/* Shine effect */}
                            <div 
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-1000"
                              style={{
                                transform: activeIndex === 100 + index ? 'translateX(100%)' : 'translateX(-100%)'
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Percentage marker */}
                        <div 
                          className="absolute top-1/2 transform -translate-y-1/2 text-xs font-bold text-white bg-gray-800 rounded-full px-2 py-1 transition-all duration-300"
                          style={{ 
                            left: `${Math.min(sector.allocation * 2, 95)}%`,
                            opacity: activeIndex === 100 + index ? 1 : 0,
                            transform: `translateY(-50%) ${activeIndex === 100 + index ? 'translateY(-8px) scale(1)' : 'translateY(0) scale(0.8)'}`
                          }}
                        >
                          {sector.allocation.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
                
                {/* Sector Summary */}
                <div className="grid grid-cols-1 gap-4 mt-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/80 rounded-2xl p-4 text-center border border-indigo-200/50">
                    <div className="text-2xl font-bold text-indigo-700 mb-1">
                      {fundDetails.sectors.length}
                    </div>
                    <div className="text-xs font-medium text-indigo-600">Sectors Covered</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default TopHoldings3DChart;
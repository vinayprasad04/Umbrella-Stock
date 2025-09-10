'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/custom-select';
import { ApiClient } from '@/lib/apiClient';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface MutualFund {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  category: string;
  hasActualData: boolean;
  dataQuality?: string;
  lastUpdated?: string;
  enteredBy?: string;
}

interface DashboardData {
  funds: MutualFund[];
  total: number;
  page: number;
  limit: number;
  filters: {
    totalFunds: number;
    fundsWithActualData: number;
    fundsWithoutActualData: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [fundHouseFilter, setFundHouseFilter] = useState('');
  const [dataFilter, setDataFilter] = useState('all');
  const [dataQualityFilter, setDataQualityFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(search && { search }),
        ...(fundHouseFilter && { fundHouse: fundHouseFilter }),
        ...(dataFilter && dataFilter !== 'all' && { hasActualData: dataFilter }),
        ...(dataQualityFilter && dataQualityFilter !== 'all' && { dataQuality: dataQualityFilter }),
        sortBy: 'schemeName',
        sortOrder: 'asc'
      });

      const url = `/admin/mutual-funds?${params}`;
      console.log('🔗 API URL:', url);
      console.log('📋 URL Params:', Object.fromEntries(params.entries()));
      
      const result = await ApiClient.get(url);
      
      console.log('🔍 API Response:', result);
      console.log('📊 Funds received:', result?.data?.funds?.length || 0);
      console.log('📋 First fund sample:', result?.data?.funds?.[0]);
      
      if (result.success) {
        setData(result.data);
        console.log('✅ Data set to state:', result.data?.funds?.length, 'funds');
      } else {
        console.error('❌ API Error:', result.error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, fundHouseFilter, dataFilter, dataQualityFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusBadge = (fund: MutualFund) => {
    if (!fund.hasActualData) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          No Data
        </span>
      );
    }
    
    const colors = {
      'VERIFIED': 'bg-green-100 text-green-800',
      'PENDING_VERIFICATION': 'bg-yellow-100 text-yellow-800',
      'EXCELLENT': 'bg-blue-100 text-blue-800',
      'GOOD': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[fund.dataQuality as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {fund.dataQuality || 'Unknown'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout currentPage="dashboard">
      <div className="p-6">
          {/* Stats Cards */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Total Mutual Funds</p>
                    <p className="text-2xl font-semibold text-gray-900">{data.filters.totalFunds.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">With Actual Data</p>
                    <p className="text-2xl font-semibold text-gray-900">{data.filters.fundsWithActualData.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Missing Actual Data</p>
                    <p className="text-2xl font-semibold text-gray-900">{data.filters.fundsWithoutActualData.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                onClick={() => {
                  setSearch('');
                  setFundHouseFilter('');
                  setDataFilter('all');
                  setDataQualityFilter('PENDING_VERIFICATION');
                  setPage(1);
                }}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Show Pending Verification</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Fund name or house..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fund House</label>
                <input
                  type="text"
                  placeholder="Filter by fund house..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={fundHouseFilter}
                  onChange={(e) => setFundHouseFilter(e.target.value)}
                />
              </div>
              
              <CustomSelect
                label="Data Status"
                value={dataFilter}
                onValueChange={setDataFilter}
                options={[
                  { value: 'all', label: 'All Funds' },
                  { value: 'false', label: 'Missing Actual Data' },
                  { value: 'true', label: 'Has Actual Data' }
                ]}
                placeholder="All Funds"
                triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
              />

              <CustomSelect
                label="Data Quality"
                value={dataQualityFilter}
                onValueChange={setDataQualityFilter}
                options={[
                  { value: 'all', label: 'All Quality' },
                  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                  { value: 'VERIFIED', label: 'Verified' },
                  { value: 'EXCELLENT', label: 'Excellent' },
                  { value: 'GOOD', label: 'Good' }
                ]}
                placeholder="All Quality"
                triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
              />
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearch('');
                    setFundHouseFilter('');
                    setDataFilter('all');
                    setDataQualityFilter('all');
                    setPage(1);
                  }}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Mutual Funds ({data?.total.toLocaleString() || 0})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheme Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fund Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fund House
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.funds && data.funds.length > 0 ? data.funds.map((fund) => (
                    <tr key={fund.schemeCode} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fund.schemeCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={fund.schemeName}>
                          {fund.schemeName}
                        </div>
                        <div className="text-xs text-gray-500">{fund.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fund.fundHouse}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(fund)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{formatDate(fund.lastUpdated)}</div>
                        {fund.enteredBy && (
                          <div className="text-xs text-gray-500">by {fund.enteredBy}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/funds/${fund.schemeCode}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          {fund.hasActualData ? 'Edit' : 'Add Data'}
                        </Link>
                        <Link
                          href={`/mutual-funds/${fund.schemeCode}`}
                          className="text-green-600 hover:text-green-900"
                          target="_blank"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                        {dataQualityFilter === 'PENDING_VERIFICATION' ? 
                          'No funds found with Pending Verification status.' : 
                          'No funds found matching your filters.'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.total > data.limit && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((page - 1) * data.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(page * data.limit, data.total)}
                      </span>{' '}
                      of <span className="font-medium">{data.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page * data.limit >= data.total}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>
    </AdminDashboardLayout>
  );
}
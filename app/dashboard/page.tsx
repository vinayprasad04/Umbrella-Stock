'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserDashboardLayout from '@/components/layouts/UserDashboardLayout';
import Link from 'next/link';
import axios from 'axios';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface DashboardStats {
  totalStocks: number;
  totalSectors: number;
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ totalStocks: 0, totalSectors: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dashboard/stats');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setLoadingPayment(true);
    setPaymentError('');

    try {
      // Create order
      const token = localStorage.getItem('authToken');

      if (!token) {
        throw new Error('Please log in again to continue');
      }

      console.log('Creating payment order...');
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error(`Server returned invalid response (Status: ${response.status})`);
      }

      console.log('Payment order response:', data);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `Server error: ${response.status}`;
        console.error('Server error:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || data?.message || 'Failed to create payment order';
        console.error('Payment creation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error('Payment gateway not loaded. Please refresh the page.');
      }

      // Initialize Razorpay
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'IncomeGrow Stock',
        description: 'Premium Annual Subscription',
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              router.push('/payment/success');
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (err: any) {
            setPaymentError(err.message || 'Payment verification failed');
            router.push('/payment/failure');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        notes: {
          userId: user?.id,
        },
        theme: {
          color: '#EA580C',
        },
        modal: {
          ondismiss: function() {
            setLoadingPayment(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoadingPayment(false);
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Failed to initiate payment');
      setLoadingPayment(false);
    }
  };
  return (
    <UserDashboardLayout currentPage="dashboard">
      <div className="p-8 space-y-8">
          {/* Hero Welcome Section */}
          <div className="relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-blue-50 to-indigo-50 rounded-3xl border border-gray-200/50 shadow-lg"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 rounded-3xl"></div>
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-100/30 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-indigo-100/30 rounded-full blur-xl animate-pulse delay-1000"></div>
            
            <div className="relative p-8 text-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-sm"></div>
                      <span className="text-sm font-medium text-emerald-700">Live Market Data</span>
                    </div>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-sm"></div>
                      <span className="text-sm font-medium text-blue-700">
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <h2 className="text-4xl font-black mb-3 leading-tight text-gray-900">
                    Welcome back,<br/>
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {user?.name}! 👋
                    </span>
                  </h2>
                  
                  <p className="text-xl text-gray-700 mb-6 max-w-2xl font-medium">
                    Your personalized financial dashboard is ready. Track your investments, 
                    analyze market trends, and make informed decisions.
                  </p>
                  
                  {user?.role === 'SUBSCRIBER' && (
                    <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-amber-50 border border-yellow-200/60 rounded-2xl p-6 mb-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-lg">🌟</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Premium Features Active</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-medium text-gray-700">Advanced Analytics</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-medium text-gray-700">Real-time Data</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-medium text-gray-700">Portfolio Insights</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {user?.role === 'USER' && (
                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/60 rounded-2xl p-6 mb-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2 text-gray-900">Unlock Premium Features</h3>
                          <p className="text-gray-600 mb-4 font-medium">
                            Get access to advanced analytics, real-time data, and exclusive insights for just ₹99/year!
                          </p>
                          <button
                            onClick={handlePayment}
                            disabled={loadingPayment}
                            className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 shadow-md ${
                              loadingPayment ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {loadingPayment ? 'Processing...' : 'Upgrade Now - ₹99/year'}
                          </button>
                          {paymentError && (
                            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                              {paymentError}
                            </div>
                          )}
                        </div>
                        <div className="hidden md:block">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-sm">
                            <span className="text-3xl">⚡</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Floating cards animation */}
                <div className="hidden lg:block relative w-80 h-64">
                  <div className="absolute top-0 right-0 w-24 h-32 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-md transform rotate-12 hover:rotate-6 transition-transform duration-300">
                    <div className="p-4">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full mb-2 shadow-sm"></div>
                      <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                      <div className="w-3/4 h-2 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="absolute top-8 right-12 w-24 h-32 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-md transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                    <div className="p-4">
                      <div className="w-4 h-4 bg-blue-500 rounded-full mb-2 shadow-sm"></div>
                      <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                      <div className="w-2/3 h-2 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-6 w-24 h-32 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-md transform rotate-6 hover:-rotate-3 transition-transform duration-300">
                    <div className="p-4">
                      <div className="w-4 h-4 bg-purple-500 rounded-full mb-2 shadow-sm"></div>
                      <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                      <div className="w-4/5 h-2 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Sectors</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? (
                      <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
                    ) : (
                      stats.totalSectors.toLocaleString()
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Stocks Tracked</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? (
                      <span className="inline-block w-20 h-8 bg-gray-200 animate-pulse rounded"></span>
                    ) : (
                      stats.totalStocks.toLocaleString()
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <span className="text-xs text-gray-500">Last 7 days</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Viewed Reliance Industries</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Compared Stock Performance</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Added to Watchlist</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/stocks"
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 mt-2">Browse Stocks</span>
                </Link>

                <Link
                  href="/dashboard/watchlist"
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:bg-green-600">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 mt-2">My Watchlist</span>
                </Link>

                <Link
                  href="/scanner"
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:bg-purple-600">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 mt-2">Stock Scanner</span>
                </Link>

                <Link
                  href="/sectors"
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-600">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 mt-2">Sectors</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email Address</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Type</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user?.role === 'SUBSCRIBER' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-3">Available Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {user?.permissions && user.permissions.length > 0 ? (
                    user.permissions.map((permission, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {permission.replace('_', ' ').toLowerCase()}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 italic">No special permissions assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
      </div>
    </UserDashboardLayout>
  );
}
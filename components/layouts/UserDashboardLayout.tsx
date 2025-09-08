'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface UserDashboardLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function UserDashboardLayout({ children, currentPage }: UserDashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      
      // Redirect admin/data_entry users to admin dashboard
      if (['ADMIN', 'DATA_ENTRY'].includes(userData.role)) {
        router.push('/admin/dashboard');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50/30 flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-72 bg-white/95 backdrop-blur-xl shadow-xl border-r border-gray-200/50 flex flex-col relative">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-transparent to-indigo-50/20 pointer-events-none"></div>
        
        {/* Sidebar Header */}
        <div className="relative p-8 border-b border-gray-200/50">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-800">
                Umbrella Stock
              </h2>
              <p className="text-sm text-gray-600 font-medium">Analytics Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="relative flex-1 px-6 py-8 space-y-2 overflow-y-auto">
          {/* Active indicator */}
          {currentPage === 'dashboard' && (
            <div className="absolute left-0 top-[2.5rem] w-1 h-12 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-r-full shadow-md"></div>
          )}
          
          <Link
            href="/dashboard"
            className={`group relative flex items-center px-4 py-3 text-sm font-semibold rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 ${
              currentPage === 'dashboard' 
                ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-transparent hover:border-blue-200/50'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg mr-4 shadow-sm ${
              currentPage === 'dashboard'
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                : 'bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-500'
            }`}>
              <svg className={`w-4 h-4 ${currentPage === 'dashboard' ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 002 2H9a2 2 0 01-2-2z" />
              </svg>
            </div>
            Dashboard
            {currentPage === 'dashboard' && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full opacity-75"></div>}
          </Link>
          
          <Link
            href="/mutual-funds"
            className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-sm ${
              currentPage === 'mutual-funds'
                ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border hover:border-blue-200/50'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg mr-4 transition-all duration-200 shadow-sm ${
              currentPage === 'mutual-funds'
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                : 'bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-500'
            }`}>
              <svg className={`w-4 h-4 ${currentPage === 'mutual-funds' ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            Mutual Funds
            <span className="ml-auto px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">2.8K</span>
          </Link>

          <Link
            href="/etfs"
            className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-sm ${
              currentPage === 'etfs'
                ? 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50'
                : 'text-gray-700 hover:text-emerald-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:border hover:border-emerald-200/50'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg mr-4 transition-all duration-200 shadow-sm ${
              currentPage === 'etfs'
                ? 'bg-gradient-to-br from-emerald-500 to-green-500'
                : 'bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-green-500'
            }`}>
              <svg className={`w-4 h-4 ${currentPage === 'etfs' ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            ETFs
            <span className="ml-auto px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">156</span>
          </Link>

          <Link
            href="/sectors"
            className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-sm ${
              currentPage === 'sectors'
                ? 'text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50'
                : 'text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border hover:border-purple-200/50'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg mr-4 transition-all duration-200 shadow-sm ${
              currentPage === 'sectors'
                ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                : 'bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-pink-500'
            }`}>
              <svg className={`w-4 h-4 ${currentPage === 'sectors' ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            Sectors
            <span className="ml-auto px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">12</span>
          </Link>

          <div className="my-6">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>

          <Link
            href="/stocks/gainers"
            className="group relative flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:border hover:border-green-200/50"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-green-500 group-hover:to-emerald-500 rounded-lg mr-4 transition-all duration-200 shadow-sm">
              <svg className="w-4 h-4 text-gray-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            Top Gainers
            <div className="ml-auto flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">+2.4%</span>
            </div>
          </Link>

          <Link
            href="/stocks/losers"
            className="group relative flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:border hover:border-red-200/50"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-pink-500 rounded-lg mr-4 transition-all duration-200 shadow-sm">
              <svg className="w-4 h-4 text-gray-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
            Top Losers
            <div className="ml-auto flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-600 font-medium">-1.8%</span>
            </div>
          </Link>

          <div className="pt-6 space-y-2">
            <div className="flex items-center px-4">
              <div className="h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 flex-1"></div>
              <span className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</span>
              <div className="h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 flex-1"></div>
            </div>
            
            <Link
              href="/profile"
              className="group relative flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:border hover:border-indigo-200/50"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-blue-500 rounded-lg mr-4 transition-all duration-200 shadow-sm">
                <svg className="w-4 h-4 text-gray-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              Profile
            </Link>
            
            <Link
              href="/settings"
              className="group relative flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-slate-600 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-100 rounded-xl transition-all duration-200 hover:shadow-sm hover:border hover:border-slate-200/50"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-slate-500 group-hover:to-gray-500 rounded-lg mr-4 transition-all duration-200 shadow-sm">
                <svg className="w-4 h-4 text-gray-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              Settings
            </Link>
          </div>
        </nav>

        {/* User Info at Bottom */}
        <div className="relative p-6 border-t border-gray-200/60">
          <div className="relative bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-md">
                  <span className="text-lg font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full shadow-sm ${
                    user?.role === 'SUBSCRIBER' 
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200/50' 
                      : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/50'
                  }`}>
                    {user?.role}
                  </span>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">Online</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a3 3 0 00-3-3H9m0 18v-5a3 3 0 013-3h5" />
                  </svg>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-48 translate-x-48 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/10 to-pink-400/10 rounded-full translate-y-48 -translate-x-48 blur-3xl pointer-events-none"></div>
        
        {/* Top Header */}
        <header className="relative bg-white/60 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-blue-500/5 flex-shrink-0">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent capitalize">
                      {currentPage || 'Dashboard'}
                    </h1>
                    <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white text-xs font-bold uppercase tracking-wide">
                      LIVE
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium">Welcome back, <span className="text-blue-600 font-semibold">{user?.name}</span></p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-64 pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Search funds, stocks..."
                  />
                </div>
                
                {/* Notifications */}
                <button className="relative p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a3 3 0 00-3-3H9m0 18v-5a3 3 0 013-3h5" />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">3</span>
                  </div>
                </button>

                {/* Profile quick access */}
                <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-2 border border-gray-200/50">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role} Account</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="relative flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
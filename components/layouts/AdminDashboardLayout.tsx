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

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function AdminDashboardLayout({ children, currentPage }: AdminDashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      
      if (!['ADMIN', 'DATA_ENTRY'].includes(userData.role)) {
        router.push('/login');
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
    <div className="h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50/30 flex relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none"></div>
      
      {/* Left Sidebar */}
      <div className="relative w-80 bg-white/95 backdrop-blur-2xl shadow-xl border-r border-gray-200/50 flex flex-col">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-transparent to-indigo-50/20 pointer-events-none"></div>
        
        {/* Sidebar Header */}
        <div className="relative p-8 border-b border-gray-200/50">
          <div className="flex items-center">
            <div className="relative group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Admin Control
              </h2>
              <p className="text-sm text-gray-600 font-medium">System Management Hub</p>
            </div>
          </div>
          
          {/* System status indicator */}
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm"></div>
                <span className="text-sm font-medium text-emerald-700">System Status</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">All Systems Online</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="relative flex-1 px-6 py-8 space-y-3 overflow-y-auto">
          {/* Active indicator */}
          {currentPage === 'dashboard' && (
            <div className="absolute left-0 top-[3rem] w-1 h-16 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-r-full shadow-md"></div>
          )}
          
          <div className="space-y-2">
            <Link
              href="/admin/dashboard"
              className={`group relative flex items-center px-6 py-4 text-sm font-bold rounded-2xl border shadow-sm transition-all duration-300 ${
                currentPage === 'dashboard'
                  ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 hover:shadow-md hover:from-blue-100 hover:to-indigo-100'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-transparent hover:border-blue-200/50 hover:shadow-sm'
              }`}
            >
              <div className={`absolute inset-0 rounded-2xl ${currentPage === 'dashboard' ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50' : ''}`}></div>
              <div className="relative flex items-center w-full">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl mr-4 shadow-md ${
                  currentPage === 'dashboard'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                    : 'bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-500'
                }`}>
                  <svg className={`w-5 h-5 ${currentPage === 'dashboard' ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 002 2H9a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span>Dashboard</span>
                <div className="ml-auto">
                  <div className={`w-2 h-2 rounded-full ${currentPage === 'dashboard' ? 'bg-blue-500 opacity-75' : ''}`}></div>
                </div>
              </div>
            </Link>
            
            <Link
              href="/admin/users"
              className={`group relative flex items-center px-6 py-4 text-sm font-medium rounded-2xl transition-all duration-300 border border-transparent hover:border-blue-200/50 hover:shadow-sm ${
                currentPage === 'users'
                  ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl mr-4 transition-all duration-300 shadow-sm ${
                currentPage === 'users'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                  : 'bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-purple-500'
              }`}>
                <svg className={`w-5 h-5 ${currentPage === 'users' ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <span>User Management</span>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {Math.floor(Math.random() * 50) + 10}
                </div>
              </div>
            </Link>

            <Link
              href="/admin/fund-managers"
              className={`group relative flex items-center px-6 py-4 text-sm font-medium rounded-2xl transition-all duration-300 border border-transparent hover:border-green-200/50 hover:shadow-sm ${
                currentPage === 'fund-managers'
                  ? 'text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50'
                  : 'text-gray-700 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl mr-4 transition-all duration-300 shadow-sm ${
                currentPage === 'fund-managers'
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                  : 'bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-green-500 group-hover:to-emerald-500'
              }`}>
                <svg className={`w-5 h-5 ${currentPage === 'fund-managers' ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span>Fund Managers</span>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Manage
                </div>
              </div>
            </Link>

            <div className="relative">
              <div className="flex items-center px-6 py-4 text-sm font-medium text-gray-700 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 shadow-sm">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl mr-4 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span>Fund Data Entry</span>
              </div>
            </div>

            <div className="pt-6">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-6"></div>
              
              <h3 className="px-6 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <button className="w-full flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:text-orange-600 rounded-2xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 border border-transparent hover:border-orange-200/50 hover:shadow-sm transition-all duration-300 group">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-red-500 rounded-lg mr-3 transition-all duration-300 shadow-sm">
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Export Data
                </button>
                
                <button className="w-full flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-2xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 border border-transparent hover:border-indigo-200/50 hover:shadow-sm transition-all duration-300 group">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-blue-500 rounded-lg mr-3 transition-all duration-300 shadow-sm">
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  Import Data
                </button>
              </div>
            </div>
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
                    user?.role === 'ADMIN' 
                      ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200/50' 
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">{currentPage || 'Admin'} Dashboard</h1>
                <p className="text-sm text-gray-500">System Management & Data Control</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Manage Users button removed */}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
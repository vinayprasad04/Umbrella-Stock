'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Header from '@/components/Header';

interface Activity {
  id: string;
  action: string;
  category: string;
  details?: {
    before?: any;
    after?: any;
    metadata?: any;
  };
  admin?: {
    name: string;
    email: string;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isPremium?: boolean;
}

export default function ActivityHistoryPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            setUser(userData);
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
      }
    };

    fetchUserProfile();
    fetchActivityHistory();
  }, [categoryFilter]);

  const fetchActivityHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const url = categoryFilter === 'all'
        ? '/api/user/activity-history'
        : `/api/user/activity-history?category=${categoryFilter}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setActivities(response.data.data.activities);
      }
    } catch (error) {
      console.error('Error fetching activity history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      subscription: 'bg-purple-100 text-purple-800 border-purple-200',
      payment: 'bg-green-100 text-green-800 border-green-200',
      admin: 'bg-red-100 text-red-800 border-red-200',
      auth: 'bg-blue-100 text-blue-800 border-blue-200',
      profile: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      subscription: '💎',
      payment: '💳',
      admin: '👨‍💼',
      auth: '🔐',
      profile: '👤',
    };
    return icons[category] || '📝';
  };

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
      <Header />

      <div className="flex pt-16">
        {/* Left Sidebar Navigation */}
        <div className="bg-white/95 backdrop-blur-xl shadow-xl border-r border-gray-200/50 flex flex-col relative" style={{ width: '360px' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-transparent to-indigo-50/20 pointer-events-none"></div>

          {/* Logo Section */}
          <div className="relative p-8 border-b border-gray-200/50">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-gray-800">IncomeGrow Stock</h2>
                <p className="text-sm text-gray-600 font-medium">Analytics Platform</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="relative flex-1 px-6 py-8 space-y-2 overflow-y-auto">
            <div className="absolute left-0 top-[2.5rem] w-1 h-12 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-r-full shadow-md"></div>

            <Link
              href="/dashboard"
              className="group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-sm border text-gray-700 hover:text-blue-600 hover:bg-white hover:border-blue-200 border-transparent"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-4 transition-all duration-200 shadow-sm bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600">
                <svg className="w-4 h-4 text-gray-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 002 2H9a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              Dashboard
            </Link>

            <div className="my-6">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            <Link
              href="/dashboard/watchlist"
              className="group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-sm border text-gray-700 hover:text-orange-600 hover:bg-white hover:border-orange-200 border-transparent"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-4 transition-all duration-200 shadow-sm bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-amber-500">
                <svg className="w-4 h-4 text-gray-600 group-hover:text-white" viewBox="0 0 512 512" fill="currentColor">
                  <path d="M241 87.1l15 20.7 15-20.7C296 52.5 336.2 32 378.9 32 452.4 32 512 91.6 512 165.1l0 2.6c0 112.2-139.9 242.5-212.9 298.2-12.4 9.4-27.6 14.1-43.1 14.1s-30.8-4.6-43.1-14.1C139.9 410.2 0 279.9 0 167.7l0-2.6C0 91.6 59.6 32 133.1 32 175.8 32 216 52.5 241 87.1z"></path>
                </svg>
              </div>
              My Watchlist
              <div className="ml-auto flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
            </Link>

            <Link
              href="/activity-history"
              className="group relative flex items-center px-4 py-3 text-sm font-semibold rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 text-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200/50"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-4 transition-all duration-200 shadow-sm bg-gradient-to-br from-purple-600 to-indigo-600">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              Activity Log
              <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full opacity-75"></div>
            </Link>

            <div className="pt-6 space-y-2">
              <div className="flex items-center px-4">
                <div className="h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 flex-1"></div>
                <span className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</span>
                <div className="h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 flex-1"></div>
              </div>

              <Link
                href="/profile"
                className="group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-sm border text-gray-700 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 border-transparent"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-4 transition-all duration-200 shadow-sm bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-blue-500">
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-white" viewBox="0 0 448 512" fill="currentColor">
                    <path d="M224 248a120 120 0 1 0 0-240 120 120 0 1 0 0 240zm-29.7 56C95.8 304 16 383.8 16 482.3 16 498.7 29.3 512 45.7 512l356.6 0c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3l-59.4 0z"></path>
                  </svg>
                </div>
                Profile
              </Link>

              <Link
                href="/settings"
                className="group relative flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-slate-600 hover:bg-white rounded-xl transition-all duration-200 hover:shadow-sm border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-slate-500 group-hover:to-gray-500 rounded-lg mr-4 transition-all duration-200 shadow-sm">
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-white" viewBox="0 0 512 512" fill="currentColor">
                    <path d="M195.1 9.5C198.1-5.3 211.2-16 226.4-16l59.8 0c15.2 0 28.3 10.7 31.3 25.5L332 79.5c14.1 6 27.3 13.7 39.3 22.8l67.8-22.5c14.4-4.8 30.2 1.2 37.8 14.4l29.9 51.8c7.6 13.2 4.9 29.8-6.5 39.9L447 233.3c.9 7.4 1.3 15 1.3 22.7s-.5 15.3-1.3 22.7l53.4 47.5c11.4 10.1 14 26.8 6.5 39.9l-29.9 51.8c-7.6 13.1-23.4 19.2-37.8 14.4l-67.8-22.5c-12.1 9.1-25.3 16.7-39.3 22.8l-14.4 69.9c-3.1 14.9-16.2 25.5-31.3 25.5l-59.8 0c-15.2 0-28.3-10.7-31.3-25.5l-14.4-69.9c-14.1-6-27.2-13.7-39.3-22.8L73.5 432.3c-14.4 4.8-30.2-1.2-37.8-14.4L5.8 366.1c-7.6-13.2-4.9-29.8 6.5-39.9l53.4-47.5c-.9-7.4-1.3-15-1.3-22.7s.5-15.3 1.3-22.7L12.3 185.8c-11.4-10.1-14-26.8-6.5-39.9L35.7 94.1c7.6-13.2 23.4-19.2 37.8-14.4l67.8 22.5c12.1-9.1 25.3-16.7 39.3-22.8L195.1 9.5zM256.3 336a80 80 0 1 0 -.6-160 80 80 0 1 0 .6 160z"></path>
                  </svg>
                </div>
                Settings
              </Link>
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="relative p-6 border-t border-gray-200/60">
            <div className="relative bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-md">
                    <span className="text-lg font-bold text-white">{user ? getInitials(user.name) : 'U'}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-bold text-gray-900">{user?.name || 'Loading...'}</p>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full shadow-sm bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/50">
                      {user?.role || 'USER'}
                    </span>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span className="text-xs text-gray-600 font-medium">Online</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href="/settings"
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M195.1 9.5C198.1-5.3 211.2-16 226.4-16l59.8 0c15.2 0 28.3 10.7 31.3 25.5L332 79.5c14.1 6 27.3 13.7 39.3 22.8l67.8-22.5c14.4-4.8 30.2 1.2 37.8 14.4l29.9 51.8c7.6 13.2 4.9 29.8-6.5 39.9L447 233.3c.9 7.4 1.3 15 1.3 22.7s-.5 15.3-1.3 22.7l53.4 47.5c11.4 10.1 14 26.8 6.5 39.9l-29.9 51.8c-7.6 13.1-23.4 19.2-37.8 14.4l-67.8-22.5c-12.1 9.1-25.3 16.7-39.3 22.8l-14.4 69.9c-3.1 14.9-16.2 25.5-31.3 25.5l-59.8 0c-15.2 0-28.3-10.7-31.3-25.5l-14.4-69.9c-14.1-6-27.2-13.7-39.3-22.8L73.5 432.3c-14.4 4.8-30.2-1.2-37.8-14.4L5.8 366.1c-7.6-13.2-4.9-29.8 6.5-39.9l53.4-47.5c-.9-7.4-1.3-15-1.3-22.7s.5-15.3 1.3-22.7L12.3 185.8c-11.4-10.1-14-26.8-6.5-39.9L35.7 94.1c7.6-13.2 23.4-19.2 37.8-14.4l67.8 22.5c12.1-9.1 25.3-16.7 39.3-22.8L195.1 9.5zM256.3 336a80 80 0 1 0 -.6-160 80 80 0 1 0 .6 160z"></path>
                    </svg>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow"
                    title="Logout"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M160 96c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 32C43 32 0 75 0 128L0 384c0 53 43 96 96 96l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l64 0zM502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224 192 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l210.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity History</h1>
              <p className="text-gray-600">View all your account activities and changes</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
            <div className="flex flex-wrap gap-2">
              {['all', 'subscription', 'payment', 'auth', 'profile', 'admin'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'All Activities' : formatActionName(cat)}
                </button>
              ))}
            </div>
          </div>
        </div>

            {/* Activity Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : activities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performed By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(activity.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(activity.category)}`}>
                          <span className="mr-1">{getCategoryIcon(activity.category)}</span>
                          {formatActionName(activity.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatActionName(activity.action)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {activity.admin ? (
                          <div>
                            <div className="font-medium text-gray-900">{activity.admin.name}</div>
                            <div className="text-xs text-gray-500">{activity.admin.email}</div>
                            <div className="text-xs text-orange-600 font-medium mt-1">Admin Action</div>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">You</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="max-w-md space-y-2">
                          {activity.details?.metadata && (
                            <div className="text-xs bg-blue-50 border border-blue-100 rounded p-2">
                              {Object.entries(activity.details.metadata).map(([key, value]) => (
                                <div key={key} className="mb-1">
                                  <span className="font-medium text-blue-900">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                                  <span className="text-blue-700">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {activity.details?.before && (
                            <div className="text-xs bg-red-50 border border-red-100 rounded p-2">
                              <span className="font-semibold text-red-900">Before:</span>{' '}
                              <span className="text-red-700">
                                {activity.details.before.isPremium !== undefined && `Premium: ${activity.details.before.isPremium ? 'Yes' : 'No'}`}
                                {activity.details.before.subscriptionStatus && `, Status: ${activity.details.before.subscriptionStatus}`}
                              </span>
                            </div>
                          )}
                          {activity.details?.after && (
                            <div className="text-xs bg-green-50 border border-green-100 rounded p-2">
                              <span className="font-semibold text-green-900">After:</span>{' '}
                              <span className="text-green-700">
                                {activity.details.after.isPremium !== undefined && `Premium: ${activity.details.after.isPremium ? 'Yes' : 'No'}`}
                                {activity.details.after.subscriptionStatus && `, Status: ${activity.details.after.subscriptionStatus}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
              <p className="text-gray-500">
                {categoryFilter === 'all'
                  ? 'You don\'t have any activity history yet.'
                  : `No ${formatActionName(categoryFilter)} activities found.`}
              </p>
            </div>
          )}
        </div>

            {/* Info Card */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-2xl">ℹ️</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">About Activity History</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Track all changes to your account including subscriptions, payments, and profile updates</li>
                    <li>• See which actions were performed by admins vs. yourself</li>
                    <li>• View detailed before/after states for subscription changes</li>
                    <li>• All activities are logged with timestamps for your reference</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

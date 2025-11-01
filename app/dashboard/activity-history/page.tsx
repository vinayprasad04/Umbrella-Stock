'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import axios from 'axios';

import UserDashboardLayout from '@/components/layouts/UserDashboardLayout';
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



  return (
    <UserDashboardLayout currentPage="activity-history">
      <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="max-w-full mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity History</h2>
            <p className="text-gray-600">Track all changes to your account including subscriptions, payments, and profile updates</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'subscription', 'payment'].map((cat) => (
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
              <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Performed By
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {new Date(activity.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(activity.category)}`}>
                          <span className="mr-1">{getCategoryIcon(activity.category)}</span>
                          <span className="hidden sm:inline">{formatActionName(activity.category)}</span>
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        {formatActionName(activity.action)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 hidden md:table-cell">
                        {activity.admin ? (
                          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm hidden lg:table-cell">
                        <div className="max-w-md space-y-2">
                          {activity.details?.metadata && (
                            <div className="text-xs bg-blue-50 border border-blue-100 rounded p-2">
                              {Object.entries(activity.details.metadata).map(([key, value]) => {
                                let displayValue = value;

                                // Format amount to show in rupees instead of paise
                                if (key === 'amount' && typeof value === 'number') {
                                  displayValue = `₹${(value / 100).toFixed(2)}`;
                                }
                                // Format currency
                                else if (key === 'currency') {
                                  displayValue = String(value);
                                }
                                // Format duration
                                else if (key === 'duration') {
                                  displayValue = String(value);
                                }
                                // Format other values
                                else if (typeof value === 'object') {
                                  displayValue = JSON.stringify(value);
                                } else {
                                  displayValue = String(value);
                                }

                                return (
                                  <div key={key} className="mb-1">
                                    <span className="font-medium text-blue-900">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                                    <span className="text-blue-700">{displayValue}</span>
                                  </div>
                                );
                              })}
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
    </UserDashboardLayout>
  );
}

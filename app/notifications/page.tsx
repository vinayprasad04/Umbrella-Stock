'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import UserDashboardLayout from '@/components/layouts/UserDashboardLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCheck,
  faTrash,
  faFilter,
  faCircle,
  faChartLine,
  faNewspaper,
  faShield,
  faUser,
  faCog,
  faEye,
  faEyeSlash,
  faArrowTrendUp,
  faArrowTrendDown,
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'price_alert' | 'news' | 'security' | 'account' | 'system' | 'market';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: string;
  data?: any;
}

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Notification['type']>('all');

  // Mock notifications data - replace with API call
  useEffect(() => {
    const loadNotifications = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      // Mock data - replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Price Alert Triggered',
          message: 'RELIANCE has reached your target price of ₹2,450',
          type: 'price_alert',
          priority: 'high',
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
          data: { symbol: 'RELIANCE', price: 2450, target: 2450 }
        },
        {
          id: '2',
          title: 'Market Update',
          message: 'Nifty 50 gains 1.2% in morning session, led by IT and Banking stocks',
          type: 'news',
          priority: 'medium',
          read: false,
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        },
        {
          id: '3',
          title: 'Security Alert',
          message: 'New login detected from Chrome on Windows. If this wasn\'t you, secure your account immediately.',
          type: 'security',
          priority: 'high',
          read: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        },
        {
          id: '4',
          title: 'Portfolio Performance',
          message: 'Your portfolio gained 2.8% this week. View detailed analysis.',
          type: 'account',
          priority: 'medium',
          read: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
        {
          id: '5',
          title: 'System Maintenance',
          message: 'Scheduled maintenance on Sunday 2 AM - 4 AM IST. Trading will be unavailable.',
          type: 'system',
          priority: 'medium',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
        {
          id: '6',
          title: 'Market Closure',
          message: 'Markets will be closed tomorrow due to public holiday.',
          type: 'market',
          priority: 'medium',
          read: true,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        },
        {
          id: '7',
          title: 'Price Alert Triggered',
          message: 'HDFCBANK dropped below your stop loss at ₹1,520',
          type: 'price_alert',
          priority: 'high',
          read: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          data: { symbol: 'HDFCBANK', price: 1518, target: 1520 }
        },
      ];

      setNotifications(mockNotifications);
      setLoading(false);
    };

    loadNotifications();
  }, [user, isAuthenticated]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getNotificationIcon = (type: Notification['type'], priority: Notification['priority']) => {
    const iconClass = priority === 'high' ? 'text-red-500' : priority === 'medium' ? 'text-yellow-500' : 'text-blue-500';
    
    switch (type) {
      case 'price_alert':
        return <FontAwesomeIcon icon={priority === 'high' ? faArrowTrendDown : faArrowTrendUp} className={`w-5 h-5 ${iconClass}`} />;
      case 'news':
        return <FontAwesomeIcon icon={faNewspaper} className={`w-5 h-5 ${iconClass}`} />;
      case 'security':
        return <FontAwesomeIcon icon={faShield} className="w-5 h-5 text-red-500" />;
      case 'account':
        return <FontAwesomeIcon icon={faUser} className={`w-5 h-5 ${iconClass}`} />;
      case 'system':
        return <FontAwesomeIcon icon={faCog} className={`w-5 h-5 ${iconClass}`} />;
      case 'market':
        return <FontAwesomeIcon icon={faChartLine} className={`w-5 h-5 ${iconClass}`} />;
      default:
        return <FontAwesomeIcon icon={faBell} className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesReadFilter = filter === 'all' || 
      (filter === 'read' && notification.read) || 
      (filter === 'unread' && !notification.read);
    
    const matchesTypeFilter = typeFilter === 'all' || notification.type === typeFilter;
    
    return matchesReadFilter && matchesTypeFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading || loading) {
    return (
      <UserDashboardLayout currentPage="notifications">
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </UserDashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <UserDashboardLayout currentPage="notifications">
        <div className="flex justify-center items-center py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please log in to view notifications.</p>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout currentPage="notifications">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="w-full px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faBell} className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600 mt-1">
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                  </p>
                </div>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 mr-2" />
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full px-6 py-8">
          {/* Filters */}
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FontAwesomeIcon icon={faFilter} className="w-4 h-4 text-gray-400" />
                
                {/* Read/Unread Filter */}
                <div className="flex items-center space-x-2">
                  {(['all', 'unread', 'read'] as const).map(filterOption => (
                    <button
                      key={filterOption}
                      onClick={() => setFilter(filterOption)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        filter === filterOption
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                      {filterOption === 'unread' && unreadCount > 0 && (
                        <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="price_alert">Price Alerts</option>
                  <option value="news">Market News</option>
                  <option value="security">Security</option>
                  <option value="account">Account</option>
                  <option value="system">System</option>
                  <option value="market">Market Updates</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FontAwesomeIcon icon={faBell} className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-600">
                  {filter === 'unread' ? 'All notifications have been read' : 'You have no notifications matching the selected filters'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
                    notification.read ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-gray-900'}`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <FontAwesomeIcon icon={faCircle} className="w-2 h-2 text-blue-500" />
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              notification.priority === 'high' 
                                ? 'bg-red-100 text-red-700'
                                : notification.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <span>{getTimeAgo(notification.createdAt)}</span>
                            <span className="mx-2">•</span>
                            <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More */}
          {filteredNotifications.length > 0 && (
            <div className="mt-8 text-center">
              <button className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Load more notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </UserDashboardLayout>
  );
}
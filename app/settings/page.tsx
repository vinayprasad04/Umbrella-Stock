'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import UserDashboardLayout from '@/components/layouts/UserDashboardLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faBell,
  faEye,
  faShield,
  faDatabase,
  faChartLine,
  faSave,
  faTimes,
  faCheck,
  faToggleOn,
  faToggleOff,
  faCog,
  faGlobe,
  faMoon,
  faSun,
  faDesktop,
  faLock,
  faTrash,
  faDownload,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import { ClientAuth } from '@/lib/auth';
import axios from 'axios';

interface UserSettings {
  // Account
  name: string;
  email: string;
  
  // Trading Preferences
  defaultWatchlistTab: number;
  autoRefresh: boolean;
  refreshInterval: number;
  showPercentageChange: boolean;
  defaultCurrency: string;
  
  // Display Preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  compactView: boolean;
  
  // Notifications
  notifications: {
    email: boolean;
    push: boolean;
    priceAlerts: boolean;
    marketNews: boolean;
    weeklyReports: boolean;
    marketing: boolean;
  };
  
  // Privacy
  dataCollection: boolean;
  shareAnalytics: boolean;
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('account');
  const [newsletterStatus, setNewsletterStatus] = useState({
    isSubscribed: false,
    isVerified: false,
    loading: true,
  });
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        const token = ClientAuth.getAccessToken();
        const response = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const profileData = response.data.data;
          
          // Initialize settings with profile data and defaults
          setSettings({
            name: profileData.name || '',
            email: profileData.email || '',
            
            // Trading defaults
            defaultWatchlistTab: 1,
            autoRefresh: true,
            refreshInterval: 30,
            showPercentageChange: true,
            defaultCurrency: 'INR',
            
            // Display defaults
            theme: profileData.preferences?.theme || 'light',
            language: profileData.preferences?.language || 'en',
            timezone: profileData.preferences?.timezone || 'Asia/Kolkata',
            compactView: false,
            
            // Notifications
            notifications: {
              email: profileData.notifications?.email || true,
              push: profileData.notifications?.push || true,
              priceAlerts: true,
              marketNews: true,
              weeklyReports: false,
              marketing: profileData.notifications?.marketing || false,
            },
            
            // Privacy defaults
            dataCollection: true,
            shareAnalytics: false,
          });
        }
      } catch (error: any) {
        console.error('Failed to load settings:', error);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, isAuthenticated]);

  // Load newsletter status
  useEffect(() => {
    const loadNewsletterStatus = async () => {
      if (!isAuthenticated) return;

      try {
        const token = ClientAuth.getAccessToken();
        const response = await axios.get('/api/user/unsubscribe', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setNewsletterStatus({
            isSubscribed: response.data.data.isSubscribed,
            isVerified: response.data.data.isVerified,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Failed to load newsletter status:', error);
        setNewsletterStatus(prev => ({ ...prev, loading: false }));
      }
    };

    loadNewsletterStatus();
  }, [isAuthenticated]);

  const handleUnsubscribe = async (action: 'unsubscribe' | 'resubscribe') => {
    try {
      setUnsubscribing(true);
      const token = ClientAuth.getAccessToken();

      const response = await axios.post('/api/user/unsubscribe',
        { action },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        setNewsletterStatus(prev => ({
          ...prev,
          isSubscribed: action === 'resubscribe',
        }));
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update subscription');
    } finally {
      setUnsubscribing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Password is required to delete account');
      return;
    }

    try {
      setDeleting(true);
      setError('');

      const token = ClientAuth.getAccessToken();
      const response = await axios.post('/api/user/delete-account',
        { password: deletePassword, reason: deleteReason },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (response.data.success) {
        setSuccess('Account deleted successfully. You will be logged out.');
        setShowDeleteModal(false);
        // Logout and redirect
        setTimeout(() => {
          ClientAuth.clearTokens();
          window.location.href = '/';
        }, 2000);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = ClientAuth.getAccessToken();
      
      // Save profile-related settings
      await axios.put('/api/user/profile', {
        name: settings.name,
        preferences: {
          theme: settings.theme,
          language: settings.language,
          timezone: settings.timezone,
          currency: settings.defaultCurrency
        },
        notifications: {
          email: settings.notifications.email,
          push: settings.notifications.push,
          marketing: settings.notifications.marketing
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const updateNestedSetting = (parent: keyof UserSettings, key: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [parent]: {
        ...(settings[parent] as any),
        [key]: value
      }
    });
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: faUser },
    // { id: 'trading', label: 'Trading', icon: faChartLine },
    { id: 'display', label: 'Display', icon: faEye },
    { id: 'notifications', label: 'Notifications', icon: faBell },
    { id: 'newsletter', label: 'Newsletter', icon: faEnvelope },
    { id: 'privacy', label: 'Privacy', icon: faShield },
  ];

  if (isLoading || loading) {
    return (
      <UserDashboardLayout currentPage="settings">
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </UserDashboardLayout>
    );
  }

  if (!isAuthenticated || !settings) {
    return (
      <UserDashboardLayout currentPage="settings">
        <div className="flex justify-center items-center py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please log in to access settings.</p>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout currentPage="settings">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="w-full px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account and trading preferences</p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={faSave} className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full px-6 py-8">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl shadow-sm">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCheck} className="w-5 h-5 text-green-600 mr-3" />
                {success}
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-sm">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-red-600 mr-3" />
                {error}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                
                {/* Account Settings */}
                {activeTab === 'account' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={settings.name}
                          onChange={(e) => updateSetting('name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={settings.email}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-sm text-gray-500 mt-1">Email cannot be changed. Contact support if needed.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trading Preferences */}
                {activeTab === 'trading' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Trading Preferences</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                        <select
                          value={settings.defaultCurrency}
                          onChange={(e) => updateSetting('defaultCurrency', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="INR">Indian Rupee (₹)</option>
                          <option value="USD">US Dollar ($)</option>
                          <option value="EUR">Euro (€)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Auto Refresh Data</label>
                        <div className="flex items-center">
                          <button
                            onClick={() => updateSetting('autoRefresh', !settings.autoRefresh)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.autoRefresh ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                          <span className="ml-3 text-sm text-gray-700">
                            {settings.autoRefresh ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      {settings.autoRefresh && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Interval</label>
                          <select
                            value={settings.refreshInterval}
                            onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="15">15 seconds</option>
                            <option value="30">30 seconds</option>
                            <option value="60">1 minute</option>
                            <option value="300">5 minutes</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Show Percentage Change</label>
                        <div className="flex items-center">
                          <button
                            onClick={() => updateSetting('showPercentageChange', !settings.showPercentageChange)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.showPercentageChange ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.showPercentageChange ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                          <span className="ml-3 text-sm text-gray-700">
                            Display percentage changes alongside price changes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Display Preferences */}
                {activeTab === 'display' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Display Preferences</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { value: 'light', label: 'Light', icon: faSun },
                            { value: 'dark', label: 'Dark', icon: faMoon },
                            { value: 'auto', label: 'Auto', icon: faDesktop }
                          ].map(theme => (
                            <button
                              key={theme.value}
                              onClick={() => updateSetting('theme', theme.value)}
                              className={`p-4 border rounded-lg text-center transition-colors ${
                                settings.theme === theme.value
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <FontAwesomeIcon icon={theme.icon} className="w-6 h-6 mb-2" />
                              <div className="text-sm font-medium">{theme.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select
                          value={settings.language}
                          onChange={(e) => updateSetting('language', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="en">English</option>
                          {/* <option value="hi">Hindi</option>
                          <option value="mr">Marathi</option> */}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => updateSetting('timezone', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                          {/* <option value="America/New_York">America/New_York (EST)</option>
                          <option value="Europe/London">Europe/London (GMT)</option> */}
                        </select>
                      </div>

                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Compact View</label>
                        <div className="flex items-center">
                          <button
                            onClick={() => updateSetting('compactView', !settings.compactView)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.compactView ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.compactView ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                          <span className="ml-3 text-sm text-gray-700">
                            Use compact layout for tables and lists
                          </span>
                        </div>
                      </div> */}
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                    
                    <div className="space-y-6">
                      {Object.entries({
                        email: 'Email Notifications',
                        push: 'Push Notifications',
                        priceAlerts: 'Price Alerts',
                        marketNews: 'Market News',
                        weeklyReports: 'Weekly Reports',
                        marketing: 'Marketing Communications'
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                          <div>
                            <div className="font-medium text-gray-900">{label}</div>
                            <div className="text-sm text-gray-500">
                              {key === 'email' && 'Receive important updates via email'}
                              {key === 'push' && 'Get real-time alerts on your device'}
                              {key === 'priceAlerts' && 'Alerts when stock prices hit your targets'}
                              {key === 'marketNews' && 'Latest market news and updates'}
                              {key === 'weeklyReports' && 'Weekly portfolio performance reports'}
                              {key === 'marketing' && 'Promotional offers and product updates'}
                            </div>
                          </div>
                          <button
                            onClick={() => updateNestedSetting('notifications', key, !settings.notifications[key as keyof typeof settings.notifications])}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.notifications[key as keyof typeof settings.notifications] ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications[key as keyof typeof settings.notifications] ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Newsletter */}
                {activeTab === 'newsletter' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Newsletter Subscription</h2>

                    {newsletterStatus.loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                            <div>
                              <h3 className="font-medium text-blue-900">Newsletter Status</h3>
                              <p className="text-sm text-blue-700 mt-1">
                                {newsletterStatus.isSubscribed ? (
                                  newsletterStatus.isVerified ? (
                                    "You are subscribed and verified to receive our newsletter updates."
                                  ) : (
                                    "You are subscribed but not verified. Please check your email to verify your subscription."
                                  )
                                ) : (
                                  "You are not subscribed to our newsletter. Subscribe from the footer to receive updates."
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {newsletterStatus.isSubscribed && (
                          <div className="border border-gray-200 rounded-lg p-6">
                            <h3 className="font-medium text-gray-900 mb-4">Subscription Management</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Unsubscribing will stop all newsletter emails. Your account will remain active, but you won't receive:
                            </p>
                            <ul className="text-sm text-gray-600 mb-6 space-y-2 ml-4">
                              <li>• Market insights and analysis</li>
                              <li>• Platform updates and new features</li>
                              <li>• Investment tips and resources</li>
                              <li>• Exclusive opportunities</li>
                            </ul>
                            <button
                              onClick={() => handleUnsubscribe('unsubscribe')}
                              disabled={unsubscribing}
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                              {unsubscribing ? 'Processing...' : 'Unsubscribe from Newsletter'}
                            </button>
                          </div>
                        )}

                        {!newsletterStatus.isSubscribed && newsletterStatus.isVerified && (
                          <div className="border border-gray-200 rounded-lg p-6">
                            <h3 className="font-medium text-gray-900 mb-4">Resubscribe</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              You previously unsubscribed from our newsletter. Would you like to resubscribe?
                            </p>
                            <button
                              onClick={() => handleUnsubscribe('resubscribe')}
                              disabled={unsubscribing}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                              {unsubscribing ? 'Processing...' : 'Resubscribe to Newsletter'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Privacy */}
                {activeTab === 'privacy' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy & Data</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900">Data Collection</div>
                          <div className="text-sm text-gray-500">Allow collection of usage data to improve the platform</div>
                        </div>
                        <button
                          onClick={() => updateSetting('dataCollection', !settings.dataCollection)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.dataCollection ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.dataCollection ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900">Analytics Sharing</div>
                          <div className="text-sm text-gray-500">Share anonymized analytics with third parties</div>
                        </div>
                        <button
                          onClick={() => updateSetting('shareAnalytics', !settings.shareAnalytics)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.shareAnalytics ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.shareAnalytics ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      {/* <div className="bg-gray-50 rounded-lg p-4 mt-6">
                        <h3 className="font-medium text-gray-900 mb-4">Data Management</h3>
                        <div className="space-y-3">
                          <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm">
                            <FontAwesomeIcon icon={faDownload} className="w-4 h-4 mr-2" />
                            Download Your Data
                          </button>
                        </div>
                      </div> */}

                      {/* Danger Zone */}
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mt-6">
                        <div className="flex items-start">
                          <FontAwesomeIcon icon={faTrash} className="w-5 h-5 text-red-600 mt-1 mr-3" />
                          <div className="flex-1">
                            <h3 className="font-medium text-red-900 mb-2">Danger Zone</h3>
                            <p className="text-sm text-red-700 mb-4">
                              Once you delete your account, there is no going back. Your account will be deactivated and your data will be preserved for legal purposes but you won't be able to access it.
                            </p>
                            <button
                              onClick={() => setShowDeleteModal(true)}
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
                            >
                              Delete My Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                This action cannot be undone. Your account will be permanently deactivated.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter your password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Tell us why you're leaving..."
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteReason('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || !deletePassword}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
}
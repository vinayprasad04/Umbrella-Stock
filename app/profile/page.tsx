'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import UserDashboardLayout from '@/components/layouts/UserDashboardLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCalendarAlt,
  faEdit,
  faSave,
  faTimes,
  faEye,
  faEyeSlash,
  faLock,
  faShield,
  faBell,
  faCamera,
  faCheck,
  faHeart,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { ClientAuth } from '@/lib/auth';
import axios from 'axios';
import { resizeAndCompressImage, convertBlobToBase64, validateImageFile } from '@/lib/imageUtils';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  phone?: string;
  location?: string;
  joinedAt?: string;
  avatar?: string;
  bio?: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Edit states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Avatar upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Watchlist stats
  const [watchlistStats, setWatchlistStats] = useState({
    totalItems: 0,
    totalWatchlists: 0
  });

  // Form states
  const [personalData, setPersonalData] = useState({
    name: '',
    phone: '',
    location: '',
    bio: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load profile data and watchlist stats
  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        const token = ClientAuth.getAccessToken();
        
        // Load profile data
        const profileResponse = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (profileResponse.data.success) {
          const profileData = profileResponse.data.data;
          setProfile(profileData);
          setPersonalData({
            name: profileData.name || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            bio: profileData.bio || ''
          });
        }

        // Load watchlist statistics
        if (token) {
          await loadWatchlistStats(token);
        }
        
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, isAuthenticated]);

  const loadWatchlistStats = async (token: string) => {
    try {
      // Get watchlist data from the default tab (1) which includes total stats
      const response = await axios.get('/api/user/watchlist?watchlistId=1', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        
        // Use totalItems from API response and count tabs with items
        const totalItems = data.totalItems || 0;
        const tabCounts = data.tabCounts || {};
        
        // Count how many tabs have items
        const totalWatchlists = Object.values(tabCounts).filter((count: any) => count > 0).length;

        console.log('📊 Watchlist Stats:', { totalItems, totalWatchlists, tabCounts });

        setWatchlistStats({
          totalItems,
          totalWatchlists
        });
      } else {
        console.log('❌ No watchlist data found');
        setWatchlistStats({ totalItems: 0, totalWatchlists: 0 });
      }

    } catch (error: any) {
      console.error('Failed to load watchlist stats:', error);
      // Keep default values (0, 0)
      setWatchlistStats({ totalItems: 0, totalWatchlists: 0 });
    }
  };

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = ClientAuth.getAccessToken();
      const response = await axios.put('/api/user/profile', personalData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        setIsEditingPersonal(false);
        // Update profile state
        if (profile) {
          setProfile({
            ...profile,
            name: personalData.name,
            // Update other fields when API supports them
          });
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const token = ClientAuth.getAccessToken();
      const response = await axios.put('/api/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Password changed successfully!');
        setIsEditingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to change password');
    }
  };

  const handleNotificationChange = (key: keyof UserProfile['notifications']) => {
    if (profile) {
      setProfile({
        ...profile,
        notifications: {
          ...profile.notifications,
          [key]: !profile.notifications[key]
        }
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Resize and compress image
      const compressedBlob = await resizeAndCompressImage(file, {
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.8,
        maxSizeKB: 10
      });

      // Convert to base64
      const base64 = await convertBlobToBase64(compressedBlob);
      
      // Create preview
      const previewUrl = URL.createObjectURL(compressedBlob);
      setAvatarPreview(previewUrl);

      // Upload to server
      const token = ClientAuth.getAccessToken();
      const response = await axios.put('/api/user/avatar', {
        avatar: base64
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Profile picture updated successfully!');
        // Update profile state
        if (profile) {
          setProfile({
            ...profile,
            avatar: response.data.data.avatar
          });
        }
        // Clean up preview after successful upload
        setTimeout(() => {
          if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
          }
          setAvatarPreview(null);
        }, 2000);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to upload profile picture');
      // Clean up preview on error
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      // Clear the file input
      event.target.value = '';
    }
  };


  if (isLoading || loading) {
    return (
      <UserDashboardLayout currentPage="profile">
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </UserDashboardLayout>
    );
  }

  if (!isAuthenticated || !profile) {
    return (
      <UserDashboardLayout currentPage="profile">
        <div className="flex justify-center items-center py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please log in to view your profile.</p>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout currentPage="profile">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full translate-y-36 -translate-x-36 blur-3xl"></div>
          
          <div className="relative px-8 py-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center space-x-8">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-28 h-28 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-2xl border border-white/20 overflow-hidden">
                    {profile.avatar || avatarPreview ? (
                      <img
                        src={avatarPreview || profile.avatar}
                        alt={profile.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      profile.name.charAt(0).toUpperCase()
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={`absolute -bottom-2 -right-2 w-10 h-10 ${
                      isUploadingAvatar
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                    } rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-colors`}
                  >
                    <FontAwesomeIcon
                      icon={faCamera}
                      className={`w-4 h-4 text-white ${isUploadingAvatar ? 'animate-pulse' : ''}`}
                    />
                  </label>
                  
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-3 border-white flex items-center justify-center shadow-sm">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-blue-100">{profile.email}</span>
                    <span className="w-1 h-1 bg-blue-200 rounded-full"></span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                      profile.role === 'SUBSCRIBER' 
                        ? 'bg-purple-500/20 text-purple-100 border-purple-300/30' 
                        : 'bg-blue-500/20 text-blue-100 border-blue-300/30'
                    }`}>
                      {profile.role}
                    </span>
                    <span className="w-1 h-1 bg-blue-200 rounded-full"></span>
                    <span className="text-blue-100 text-sm">Online</span>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon icon={faHeart} className="w-5 h-5 text-red-300" />
                      <span className="text-sm text-blue-100">
                        {watchlistStats.totalWatchlists} {watchlistStats.totalWatchlists === 1 ? 'Watchlist' : 'Watchlists'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-green-300" />
                      <span className="text-sm text-blue-100">
                        {watchlistStats.totalItems} {watchlistStats.totalItems === 1 ? 'Stock' : 'Stocks'} Tracked
                      </span>
                    </div>
                    {profile.joinedAt && (
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5 text-blue-300" />
                        <span className="text-sm text-blue-100">Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-8 py-8">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl shadow-sm">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCheck} className="w-5 h-5 text-green-600 mr-3" />
                {success}
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-sm">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-red-600 mr-3" />
                {error}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Right Column - Settings */}
            <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-gray-400 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  </div>
                  <button
                    onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <FontAwesomeIcon icon={isEditingPersonal ? faTimes : faEdit} className="w-4 h-4 mr-1" />
                    {isEditingPersonal ? 'Cancel' : 'Edit'}
                  </button>
                </div>
              </div>

              <div className="p-6">
                {isEditingPersonal ? (
                  <form onSubmit={handlePersonalSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={personalData.name}
                        onChange={(e) => setPersonalData({...personalData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={personalData.phone}
                        onChange={(e) => setPersonalData({...personalData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={personalData.location}
                        onChange={(e) => setPersonalData({...personalData, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={personalData.bio}
                        onChange={(e) => setPersonalData({...personalData, bio: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        <FontAwesomeIcon icon={faSave} className="w-4 h-4 mr-1" />
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-600">Full Name</div>
                        <div className="font-medium">{profile.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-medium">{profile.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-600">Phone</div>
                        <div className="font-medium">{personalData.phone || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-600">Location</div>
                        <div className="font-medium">{personalData.location || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faLock} className="w-5 h-5 text-gray-400 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                  </div>
                  <button
                    onClick={() => setIsEditingPassword(!isEditingPassword)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <FontAwesomeIcon icon={isEditingPassword ? faTimes : faEdit} className="w-4 h-4 mr-1" />
                    {isEditingPassword ? 'Cancel' : 'Change Password'}
                  </button>
                </div>
              </div>

              <div className="p-6">
                {isEditingPassword ? (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FontAwesomeIcon icon={showPasswords.current ? faEyeSlash : faEye} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FontAwesomeIcon icon={showPasswords.new ? faEyeSlash : faEye} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FontAwesomeIcon icon={showPasswords.confirm ? faEyeSlash : faEye} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        <FontAwesomeIcon icon={faSave} className="w-4 h-4 mr-1" />
                        Update Password
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faShield} className="w-4 h-4 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-600">Password</div>
                        <div className="font-medium">••••••••••••</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Last changed: Never
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faBell} className="w-5 h-5 text-gray-400 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-gray-600">Receive important updates via email</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.notifications.email}
                      onChange={() => handleNotificationChange('email')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-gray-600">Get real-time alerts on your device</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.notifications.push}
                      onChange={() => handleNotificationChange('push')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Marketing Communications</div>
                    <div className="text-sm text-gray-600">Receive newsletters and promotional content</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.notifications.marketing}
                      onChange={() => handleNotificationChange('marketing')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            </div>
          </div>
        </div>
      </div>
    </UserDashboardLayout>
  );
}
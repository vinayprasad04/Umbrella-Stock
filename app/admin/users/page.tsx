'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import { CustomSelect } from '@/components/ui/custom-select';
import { ApiClient } from '@/lib/apiClient';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DATA_ENTRY' | 'SUBSCRIBER' | 'USER';
  permissions: string[];
  isActive: boolean;
  isEmailVerified?: boolean;
  lastLogin?: string;
  createdAt: string;
  phone?: string;
  department?: string;
  totalMfDataEntered?: number;
  totalMfDataVerified?: number;
  isPremium?: boolean;
  subscription?: {
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
    amount?: number;
  };
}

interface UsersData {
  users: User[];
  total: number;
  page: number;
  limit: number;
  roleStats: {
    [key: string]: number;
  };
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'DATA_ENTRY' | 'SUBSCRIBER' | 'USER';
  phone?: string;
  department?: string;
}

export default function UsersManagement() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // active/inactive
  
  // Create user modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    phone: '',
    department: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit user modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Omit<CreateUserForm, 'password'>>({
    name: '',
    email: '',
    role: 'USER',
    phone: '',
    department: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
      setCurrentUser(userData);
      
      if (userData.role !== 'ADMIN') {
        router.push('/admin/dashboard');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, [page, search, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const result = await ApiClient.get(`/admin/users?${params}`);
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error.message?.includes('Session expired')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const result = await ApiClient.post('/admin/users', createForm);
      
      if (result.success) {
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'USER',
          phone: '',
          department: ''
        });
        fetchUsers(); // Refresh the list
      } else {
        setCreateError(result.error || 'Failed to create user');
      }
    } catch (error: any) {
      setCreateError(error.message || 'Failed to create user. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const result = await ApiClient.patch(`/admin/users/${userId}`, { isActive: !currentStatus });

      if (result.success) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const result = await ApiClient.patch(`/admin/users/${userId}`, { role: newRole });

      if (result.success) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleResendVerification = async (userId: string, email: string) => {
    if (!confirm(`Resend verification email to ${email}?`)) {
      return;
    }

    try {
      const result = await ApiClient.post('/admin/users/resend-verification', { userId });

      if (result.success) {
        alert('Verification email sent successfully!');
      } else {
        alert(result.error || 'Failed to send verification email');
      }
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      alert(error.error || 'Failed to send verification email');
    }
  };

  const handleDeactivateSubscription = async (userId: string, userName: string, isPremium?: boolean) => {
    const subscriptionType = isPremium ? 'paid' : 'free';
    const message = isPremium
      ? `Are you sure you want to cancel the PAID subscription for ${userName}? This will remove their premium access.`
      : `Are you sure you want to cancel the FREE subscription for ${userName}?`;

    if (!confirm(message)) {
      return;
    }

    try {
      const result = await ApiClient.post('/admin/users/subscription', {
        userId,
        action: 'deactivate'
      });

      if (result.success) {
        alert(`${subscriptionType.toUpperCase()} subscription cancelled successfully!`);
        fetchUsers(); // Refresh the list
      } else {
        alert(result.error || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      alert(error.error || 'Failed to cancel subscription');
    }
  };

  const handleReactivateSubscription = async (userId: string, userName: string) => {
    const days = prompt(`Enter subscription duration in days for ${userName}:`, '365');

    if (!days) return;

    const durationDays = parseInt(days);
    if (isNaN(durationDays) || durationDays <= 0) {
      alert('Please enter a valid number of days');
      return;
    }

    if (!confirm(`Activate premium subscription for ${userName} for ${durationDays} days?`)) {
      return;
    }

    try {
      const result = await ApiClient.post('/admin/users/reactivate-subscription', {
        userId,
        durationDays
      });

      if (result.success) {
        alert(`Subscription activated for ${durationDays} days!`);
        console.log('Subscription activated, refreshing user list...', result.data);
        // Force refresh by resetting page
        await fetchUsers();
      } else {
        alert(result.error || 'Failed to activate subscription');
      }
    } catch (error: any) {
      console.error('Error activating subscription:', error);
      alert(error.error || 'Failed to activate subscription');
    }
  };

  const handleViewHistory = async (user: User) => {
    setHistoryUser(user);
    setShowHistoryModal(true);
    setLoadingHistory(true);

    try {
      const result = await ApiClient.get(`/admin/users/activity-history?userId=${user.id}`);

      if (result.success) {
        setHistoryData(result.data.activities);
      } else {
        alert(result.error || 'Failed to load history');
      }
    } catch (error: any) {
      console.error('Error loading history:', error);
      alert(error.error || 'Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      department: user.department || ''
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      const result = await ApiClient.patch(`/admin/users/${editingUser?.id}`, editForm);
      
      if (result.success) {
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers(); // Refresh the list
      } else {
        setEditError(result.error || 'Failed to update user');
      }
    } catch (error: any) {
      setEditError(error.message || 'Failed to update user. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      'ADMIN': 'bg-red-100 text-red-800',
      'DATA_ENTRY': 'bg-blue-100 text-blue-800',
      'SUBSCRIBER': 'bg-green-100 text-green-800',
      'USER': 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout currentPage="users">
      <div className="p-6">
        {/* Header Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <p className="text-gray-600 mt-1">Manage system users and their roles</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition duration-200 shadow-sm"
          >
            Create User
          </button>
        </div>
        {/* Stats Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">T</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">💎</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Premium</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data.users.filter(u =>
                      u.isPremium || (u.subscription && u.subscription.status === 'active' && u.subscription.plan === 'premium')
                    ).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">A</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Admins</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.roleStats?.ADMIN || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">D</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Data Entry</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.roleStats?.DATA_ENTRY || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">S</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Newsletter</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.roleStats?.SUBSCRIBER || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="DATA_ENTRY">Data Entry</option>
                <option value="SUBSCRIBER">Subscriber</option>
                <option value="USER">User</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Users</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                  setStatusFilter('');
                  setPage(1);
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Users ({data?.total || 0})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email Verified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.users.map((user) => {
                  // Debug logging
                  if (user.email === 'vinayprasad04@gmail.com') {
                    console.log('User debug:', {
                      email: user.email,
                      isPremium: user.isPremium,
                      subscription: user.subscription,
                      role: user.role
                    });
                  }
                  return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {currentUser?.role === 'ADMIN' && user.role !== 'ADMIN' ? (
                          <select
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)} border-0`}
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          >
                            <option value="DATA_ENTRY">Data Entry</option>
                            <option value="SUBSCRIBER">Subscriber</option>
                            <option value="USER">User</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        )}
                        {user.isPremium && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            💎 PREMIUM
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.subscription ? (
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                              user.subscription.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : user.subscription.status === 'expired'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.subscription.plan}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.subscription.status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.subscription.status}
                            </span>
                          </div>
                          {user.subscription.endDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              Expires: {new Date(user.subscription.endDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                          {user.subscription.amount && (
                            <div className="text-xs font-medium text-gray-700 mt-1">
                              ₹{(user.subscription.amount / 100).toFixed(2)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No subscription</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isEmailVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                        </span>
                        {!user.isEmailVerified && user.role === 'USER' && (
                          <button
                            onClick={() => handleResendVerification(user.id, user.email)}
                            className="text-blue-600 hover:text-blue-900 text-xs underline"
                            title="Resend verification email"
                          >
                            Resend
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.lastLogin && (
                        <div>Last: {formatDate(user.lastLogin)}</div>
                      )}
                      {(user.totalMfDataEntered || user.totalMfDataVerified) && (
                        <div className="text-xs text-gray-500">
                          Entered: {user.totalMfDataEntered || 0} | Verified: {user.totalMfDataVerified || 0}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        <div>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              className={`mr-2 ${
                                user.isActive
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                        {user.isPremium || (user.subscription && user.subscription.status === 'active' && user.subscription.plan === 'premium') ? (
                          <button
                            onClick={() => handleDeactivateSubscription(user.id, user.name, user.isPremium)}
                            className="text-orange-600 hover:text-orange-900 text-xs font-medium text-left"
                          >
                            🚫 Cancel Paid Subscription
                          </button>
                        ) : (
                          user.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleReactivateSubscription(user.id, user.name)}
                              className="text-green-600 hover:text-green-900 text-xs font-medium text-left"
                            >
                              ✅ Activate Premium
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handleViewHistory(user)}
                          className="text-purple-600 hover:text-purple-900 text-xs font-medium text-left"
                        >
                          📜 View History
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-fadeIn">
          <div className="relative mx-auto p-0 border-0 w-full max-w-md shadow-2xl rounded-2xl bg-white transform animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Create New User</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              
              {createError && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-5">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter full name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter email address"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Password *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Minimum 6 characters"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    />
                  </div>
                </div>

                <CustomSelect
                  label="Role"
                  value={createForm.role}
                  onValueChange={(value) => setCreateForm({ ...createForm, role: value as any })}
                  options={[
                    { value: 'USER', label: 'User' },
                    { value: 'SUBSCRIBER', label: 'Subscriber' },
                    { value: 'DATA_ENTRY', label: 'Data Entry' },
                    ...(currentUser?.role === 'ADMIN' ? [{ value: 'ADMIN', label: 'Admin' }] : [])
                  ]}
                  placeholder="Select user role"
                  triggerClassName="h-12 w-full py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  contentClassName="bg-white border border-gray-200 rounded-xl shadow-lg"
                  className="space-y-1"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Phone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Phone number"
                        value={createForm.phone}
                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Department</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Department name"
                        value={createForm.department}
                        onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
                  >
                    {createLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      'Create User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-fadeIn">
          <div className="relative mx-auto p-0 border-0 w-full max-w-md shadow-2xl rounded-2xl bg-white transform animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Edit User</h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              
              {editError && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {editError}
                </div>
              )}

              <form onSubmit={handleUpdateUser} className="space-y-5">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter full name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter email address"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <CustomSelect
                  label="Role"
                  value={editForm.role}
                  onValueChange={(value) => setEditForm({ ...editForm, role: value as any })}
                  options={[
                    { value: 'USER', label: 'User' },
                    { value: 'SUBSCRIBER', label: 'Subscriber' },
                    { value: 'DATA_ENTRY', label: 'Data Entry' },
                    ...(currentUser?.role === 'ADMIN' ? [{ value: 'ADMIN', label: 'Admin' }] : [])
                  ]}
                  placeholder="Select user role"
                  triggerClassName="h-12 w-full py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  contentClassName="bg-white border border-gray-200 rounded-xl shadow-lg"
                  className="space-y-1"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Phone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Phone number"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Department</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Department name"
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
                  >
                    {editLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </span>
                    ) : (
                      'Update User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* User History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-fadeIn">
          <div className="relative mx-auto p-0 border-0 w-full max-w-4xl shadow-2xl rounded-2xl bg-white transform animate-slideUp max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-xl">📜</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Activity History</h3>
                    <p className="text-sm text-purple-100">{historyUser?.name} ({historyUser?.email})</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                </div>
              ) : historyData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Performed By
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {historyData.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(activity.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              activity.category === 'subscription' ? 'bg-purple-100 text-purple-800' :
                              activity.category === 'payment' ? 'bg-green-100 text-green-800' :
                              activity.category === 'admin' ? 'bg-red-100 text-red-800' :
                              activity.category === 'auth' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {activity.action.replace(/_/g, ' ').split(' ').map(word =>
                              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            ).join(' ')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {activity.admin ? (
                              <div>
                                <div className="font-medium">{activity.admin.name}</div>
                                <div className="text-xs text-gray-500">{activity.admin.email}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">User Self</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="max-w-md">
                              {activity.details?.metadata && (
                                <div className="mb-2">
                                  {Object.entries(activity.details.metadata).map(([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                                      <span className="text-gray-600">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {activity.details?.before && (
                                <div className="text-xs mb-1">
                                  <span className="font-medium text-red-700">Before:</span>{' '}
                                  <span className="text-gray-600">
                                    {activity.details.before.isPremium !== undefined && `Premium: ${activity.details.before.isPremium ? 'Yes' : 'No'}`}
                                    {activity.details.before.subscriptionStatus && `, Status: ${activity.details.before.subscriptionStatus}`}
                                  </span>
                                </div>
                              )}
                              {activity.details?.after && (
                                <div className="text-xs">
                                  <span className="font-medium text-green-700">After:</span>{' '}
                                  <span className="text-gray-600">
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">📋</span>
                  </div>
                  <p className="text-gray-500">No activity history found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
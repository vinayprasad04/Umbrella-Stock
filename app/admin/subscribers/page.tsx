'use client';

import { useState, useEffect } from 'react';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import { CustomSelect } from '@/components/ui/custom-select';
import { ApiClient } from '@/lib/apiClient';

interface Subscriber {
  _id: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  subscribedAt: string;
  verifiedAt?: string;
  unsubscribedAt?: string;
  createdAt: string;
}

interface SubscribersData {
  subscribers: Subscriber[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: {
    total: number;
    verified: number;
    unverified: number;
    active: number;
  };
}

export default function SubscribersManagement() {
  const [data, setData] = useState<SubscribersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [perPage, setPerPage] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchSubscribers();
  }, [page, search, statusFilter, perPage, sortBy, sortOrder]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        search,
        status: statusFilter,
        sortBy,
        sortOrder,
      });

      const response = await ApiClient.get(`/admin/subscribers?${params}`);

      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const response = await ApiClient.post('/admin/subscribers', {
        action: 'toggle-active',
        id,
      });

      if (response.success) {
        fetchSubscribers();
      }
    } catch (error) {
      console.error('Failed to toggle subscriber status:', error);
      alert('Failed to update subscriber status');
    }
  };

  const handleVerify = async (id: string) => {
    try {
      const response = await ApiClient.post('/admin/subscribers', {
        action: 'verify',
        id,
      });

      if (response.success) {
        fetchSubscribers();
      }
    } catch (error: any) {
      console.error('Failed to verify subscriber:', error);
      alert(error.error || 'Failed to verify subscriber');
    }
  };

  const handleResendEmail = async (id: string, email: string) => {
    if (!confirm(`Resend verification email to ${email}?`)) {
      return;
    }

    try {
      const response = await ApiClient.post('/admin/subscribers', {
        action: 'resend-email',
        id,
      });

      if (response.success) {
        alert('Verification email sent successfully!');
        fetchSubscribers();
      }
    } catch (error: any) {
      console.error('Failed to resend email:', error);
      alert(error.error || 'Failed to resend verification email');
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete subscriber: ${email}?`)) {
      return;
    }

    try {
      const response = await ApiClient.delete(`/admin/subscribers?id=${id}`);

      if (response.success) {
        fetchSubscribers();
      }
    } catch (error) {
      console.error('Failed to delete subscriber:', error);
      alert('Failed to delete subscriber');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminDashboardLayout currentPage="subscribers">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Subscribers Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage newsletter subscribers and email verifications
            </p>
          </div>

          {/* Statistics Cards */}
          {data && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Subscribers</dt>
                        <dd className="text-lg font-semibold text-gray-900">{data.statistics.total}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Verified</dt>
                        <dd className="text-lg font-semibold text-gray-900">{data.statistics.verified}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Unverified</dt>
                        <dd className="text-lg font-semibold text-gray-900">{data.statistics.unverified}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                        <dd className="text-lg font-semibold text-gray-900">{data.statistics.active}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search by email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <CustomSelect
                label="Status"
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'verified', label: 'Verified' },
                  { value: 'unverified', label: 'Unverified' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
              />

              <CustomSelect
                label="Sort By"
                value={sortBy}
                onValueChange={setSortBy}
                options={[
                  { value: 'createdAt', label: 'Date Subscribed' },
                  { value: 'email', label: 'Email' },
                  { value: 'verifiedAt', label: 'Verification Date' },
                ]}
                triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
              />

              <CustomSelect
                label="Per Page"
                value={perPage.toString()}
                onValueChange={(value) => {
                  setPerPage(parseInt(value));
                  setPage(1);
                }}
                options={[
                  { value: '10', label: '10' },
                  { value: '20', label: '20' },
                  { value: '50', label: '50' },
                  { value: '100', label: '100' },
                ]}
                triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading subscribers...</p>
              </div>
            ) : data && data.subscribers.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscribed At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verified At
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.subscribers.map((subscriber) => (
                        <tr key={subscriber._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{subscriber.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {subscriber.isVerified ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Unverified
                                </span>
                              )}
                              {subscriber.isActive ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(subscriber.subscribedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subscriber.verifiedAt ? formatDate(subscriber.verifiedAt) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {!subscriber.isVerified && (
                                <>
                                  <button
                                    onClick={() => handleVerify(subscriber._id)}
                                    className="text-green-600 hover:text-green-900 font-medium"
                                    title="Verify"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => handleResendEmail(subscriber._id, subscriber.email)}
                                    className="text-purple-600 hover:text-purple-900 font-medium"
                                    title="Resend verification email"
                                  >
                                    Resend Email
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleToggleActive(subscriber._id)}
                                className={`${
                                  subscriber.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-blue-600 hover:text-blue-900'
                                } font-medium`}
                                title={subscriber.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {subscriber.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDelete(subscriber._id, subscriber.email)}
                                className="text-red-600 hover:text-red-900 font-medium"
                                title="Delete"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pagination.pages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(page - 1) * perPage + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(page * perPage, data.pagination.total)}
                        </span>{' '}
                        of <span className="font-medium">{data.pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          Page {page} of {data.pagination.pages}
                        </span>
                        <button
                          onClick={() => setPage(page + 1)}
                          disabled={page === data.pagination.pages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subscribers found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first subscriber.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}

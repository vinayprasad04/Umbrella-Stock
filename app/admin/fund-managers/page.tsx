'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import { CustomSelect } from '@/components/ui/custom-select';
import { ApiClient } from '@/lib/apiClient';

interface FundManager {
  _id: string;
  name: string;
  experience: string;
  education: string;
  fundsManaged: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastUpdatedBy?: string;
}

interface FundManagersData {
  fundManagers: FundManager[];
  total: number;
  page: number;
  limit: number;
}

interface CreateFundManagerForm {
  name: string;
  experience: string;
  education: string;
  fundsManaged: string[];
}

export default function FundManagersManagement() {
  const [data, setData] = useState<FundManagersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('true');
  
  // Create fund manager modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFundManagerForm>({
    name: '',
    experience: '',
    education: '',
    fundsManaged: []
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit fund manager modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFundManager, setEditingFundManager] = useState<FundManager | null>(null);
  const [editForm, setEditForm] = useState<CreateFundManagerForm>({
    name: '',
    experience: '',
    education: '',
    fundsManaged: []
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fundManagerToDelete, setFundManagerToDelete] = useState<FundManager | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Current input states for funds managed
  const [currentFundManaged, setCurrentFundManaged] = useState('');
  const [editCurrentFundManaged, setEditCurrentFundManaged] = useState('');

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
      
      if (!['ADMIN', 'DATA_ENTRY'].includes(userData.role)) {
        router.push('/admin/dashboard');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    fetchFundManagers();
  }, [page, search, statusFilter]);

  const fetchFundManagers = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { isActive: statusFilter }),
      });

      const result = await ApiClient.get(`/admin/fund-managers?${params}`);
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error: any) {
      console.error('Error fetching fund managers:', error);
      if (error.message?.includes('Session expired')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFundManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const result = await ApiClient.post('/admin/fund-managers', createForm);
      
      if (result.success) {
        setShowCreateModal(false);
        resetCreateForm();
        fetchFundManagers();
      } else {
        setCreateError(result.error || 'Failed to create fund manager');
      }
    } catch (error: any) {
      setCreateError(error.message || 'Failed to create fund manager. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateFundManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      const result = await ApiClient.patch(`/admin/fund-managers/${editingFundManager?._id}`, editForm);
      
      if (result.success) {
        setShowEditModal(false);
        setEditingFundManager(null);
        fetchFundManagers();
      } else {
        setEditError(result.error || 'Failed to update fund manager');
      }
    } catch (error: any) {
      setEditError(error.message || 'Failed to update fund manager. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const result = await ApiClient.patch(`/admin/fund-managers/${id}`, { isActive: !currentStatus });

      if (result.success) {
        fetchFundManagers();
      }
    } catch (error) {
      console.error('Error updating fund manager status:', error);
    }
  };

  const handleDeleteClick = (fundManager: FundManager) => {
    setFundManagerToDelete(fundManager);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!fundManagerToDelete) return;

    setDeleteLoading(true);
    try {
      const result = await ApiClient.delete(`/admin/fund-managers/${fundManagerToDelete._id}`);

      if (result.success) {
        setShowDeleteModal(false);
        setFundManagerToDelete(null);
        fetchFundManagers();
      }
    } catch (error) {
      console.error('Error deleting fund manager:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setFundManagerToDelete(null);
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      experience: '',
      education: '',
      fundsManaged: []
    });
    setCurrentFundManaged('');
  };

  const handleEditFundManager = (fundManager: FundManager) => {
    setEditingFundManager(fundManager);
    setEditForm({
      name: fundManager.name,
      experience: fundManager.experience,
      education: fundManager.education,
      fundsManaged: fundManager.fundsManaged || []
    });
    setEditError('');
    setShowEditModal(true);
  };

  // Functions for managing funds managed array in create form
  const addFundManaged = () => {
    if (currentFundManaged.trim() && !createForm.fundsManaged.includes(currentFundManaged.trim())) {
      setCreateForm(prev => ({
        ...prev,
        fundsManaged: [...prev.fundsManaged, currentFundManaged.trim()]
      }));
      setCurrentFundManaged('');
    }
  };

  const removeFundManaged = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      fundsManaged: prev.fundsManaged.filter((_, i) => i !== index)
    }));
  };

  // Functions for managing funds managed array in edit form
  const addEditFundManaged = () => {
    if (editCurrentFundManaged.trim() && !editForm.fundsManaged.includes(editCurrentFundManaged.trim())) {
      setEditForm(prev => ({
        ...prev,
        fundsManaged: [...prev.fundsManaged, editCurrentFundManaged.trim()]
      }));
      setEditCurrentFundManaged('');
    }
  };

  const removeEditFundManaged = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      fundsManaged: prev.fundsManaged.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout currentPage="fund-managers">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fund Managers</h1>
            <p className="text-gray-600">Manage fund manager profiles and information</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <span className="mr-2">+</span>
            Add Fund Manager
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by name, experience, education..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CustomSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
              { value: 'all', label: 'All Status' }
            ]}
            placeholder="Filter by status"
            triggerClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
          />
          <div className="text-sm text-gray-500 flex items-center">
            Total: {data?.total || 0} fund managers
          </div>
        </div>

        {/* Fund Managers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Education
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funds Managed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.fundManagers.map((fundManager) => (
                  <tr key={fundManager._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{fundManager.name}</div>
                      <div className="text-sm text-gray-500">Added {formatDate(fundManager.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {fundManager.experience || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {fundManager.education || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {fundManager.fundsManaged.slice(0, 2).map((fund, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {fund}
                          </span>
                        ))}
                        {fundManager.fundsManaged.length > 2 && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            +{fundManager.fundsManaged.length - 2} more
                          </span>
                        )}
                        {fundManager.fundsManaged.length === 0 && (
                          <span className="text-sm text-gray-500">No funds specified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        fundManager.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {fundManager.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditFundManager(fundManager)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(fundManager._id, fundManager.isActive)}
                        className={`${
                          fundManager.isActive 
                            ? 'text-orange-600 hover:text-orange-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {fundManager.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(fundManager)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {data && data.total > data.limit && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {((data.page - 1) * data.limit) + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(data.total / data.limit)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Fund Manager Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Add New Fund Manager</h3>
                  <p className="text-sm text-gray-600 mt-1">Create a comprehensive fund manager profile</p>
                </div>
                <button
                  onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-8 py-6">
              
              {createError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{createError}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateFundManager} className="space-y-8">
                {/* Basic Information Section */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    Personal Information
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="Enter fund manager's full name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Background Section */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                    Professional Background
                  </h4>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Experience *</label>
                      <textarea
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-none"
                        placeholder="Describe the fund manager's professional experience, previous roles, achievements, and career highlights..."
                        value={createForm.experience}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, experience: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">Include previous companies, years of experience, and key accomplishments</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Education & Qualifications *</label>
                      <textarea
                        rows={3}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-none"
                        placeholder="Educational qualifications, degrees, certifications, professional designations..."
                        value={createForm.education}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, education: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">Include degrees, certifications, and relevant educational background</p>
                    </div>
                  </div>
                </div>

                {/* Funds Managed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Funds Managed</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Add fund name..."
                      value={currentFundManaged}
                      onChange={(e) => setCurrentFundManaged(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFundManaged())}
                    />
                    <button
                      type="button"
                      onClick={addFundManaged}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {createForm.fundsManaged.map((fund, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {fund}
                        <button
                          type="button"
                          onClick={() => removeFundManaged(index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createLoading ? 'Creating...' : 'Create Fund Manager'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fund Manager Modal */}
      {showEditModal && editingFundManager && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Fund Manager</h3>
              
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {editError}
                </div>
              )}

              <form onSubmit={handleUpdateFundManager} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience *</label>
                  <textarea
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the fund manager's experience in detail..."
                    value={editForm.experience}
                    onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education *</label>
                  <textarea
                    rows={2}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Educational qualifications, degrees, certifications..."
                    value={editForm.education}
                    onChange={(e) => setEditForm(prev => ({ ...prev, education: e.target.value }))}
                  />
                </div>

                {/* Edit Funds Managed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Funds Managed</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Add fund name..."
                      value={editCurrentFundManaged}
                      onChange={(e) => setEditCurrentFundManaged(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEditFundManaged())}
                    />
                    <button
                      type="button"
                      onClick={addEditFundManaged}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editForm.fundsManaged.map((fund, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {fund}
                        <button
                          type="button"
                          onClick={() => removeEditFundManaged(index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? 'Updating...' : 'Update Fund Manager'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && fundManagerToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Fund Manager</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>{fundManagerToDelete.name}</strong>? 
                  This action cannot be undone and will permanently remove all fund manager data.
                </p>
                {fundManagerToDelete.fundsManaged.length > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    <strong>Warning:</strong> This fund manager is currently managing {fundManagerToDelete.fundsManaged.length} fund(s).
                  </p>
                )}
              </div>
              <div className="flex justify-center space-x-3 px-4 py-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Fund Manager'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
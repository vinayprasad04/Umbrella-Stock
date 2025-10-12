'use client';

import { useState, useEffect } from 'react';
import { ClientAuth } from '@/lib/auth';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import Link from 'next/link';
import Toast from '@/components/ui/toast';
import CorporateActionModal from '@/components/admin/CorporateActionModal';

interface CorporateAction {
  _id: string;
  stockSymbol: string;
  activityType: 'news-article' | 'news-video' | 'dividend' | 'announcement' | 'legal-order';
  headline: string;
  summary?: string;
  publishedAt: string;
  source?: string;
  sourceUrl?: string;
  metadata?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stock {
  symbol: string;
  companyName: string;
  screenerId?: string;
}

export default function StockCorporateActionsPage() {
  const router = useRouter();
  const params = useParams();
  const symbol = (params?.symbol as string)?.toUpperCase();

  const [user, setUser] = useState<any>(null);
  const [stock, setStock] = useState<Stock | null>(null);
  const [actions, setActions] = useState<CorporateAction[]>([]);
  const [filteredActions, setFilteredActions] = useState<CorporateAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingNews, setSyncingNews] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'dividend' | 'announcement' | 'legal-order'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<CorporateAction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [paginatedActions, setPaginatedActions] = useState<CorporateAction[]>([]);

  useEffect(() => {
    // Check auth
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');

    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (!['ADMIN', 'DATA_ENTRY'].includes(userData.role)) {
        router.push('/login');
        return;
      }
      setUser(userData);
    } catch {
      router.push('/login');
      return;
    }

    if (symbol) {
      fetchStockInfo();
      fetchActions();
    }
  }, [symbol]);

  useEffect(() => {
    filterActions();
  }, [activeTab, actions]);

  useEffect(() => {
    paginateActions();
  }, [filteredActions, currentPage, itemsPerPage]);

  const paginateActions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedActions(filteredActions.slice(startIndex, endIndex));
  };

  const fetchStockInfo = async () => {
    try {
      const token = ClientAuth.getAccessToken();
      const response = await axios.get(`/api/admin/stocks/${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStock(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stock info:', error);
    }
  };

  const fetchActions = async () => {
    try {
      setLoading(true);
      const token = ClientAuth.getAccessToken();

      const response = await axios.get(
        `/api/admin/stocks/corporate?symbol=${symbol}&limit=1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setActions(response.data.data.actions);
      }
    } catch (error: any) {
      console.error('Error fetching corporate actions:', error);
      alert(error.response?.data?.error || 'Failed to fetch corporate actions');
    } finally {
      setLoading(false);
    }
  };

  const filterActions = () => {
    setCurrentPage(1); // Reset to page 1 when changing tabs
    if (activeTab === 'all') {
      setFilteredActions(actions);
    } else if (activeTab === 'news') {
      setFilteredActions(actions.filter(a => a.activityType === 'news-article' || a.activityType === 'news-video'));
    } else {
      setFilteredActions(actions.filter(a => a.activityType === activeTab));
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredActions.length / itemsPerPage);

  const handleSync = async () => {
    if (!stock?.screenerId) {
      return;
    }

    try {
      setSyncing(true);
      const token = ClientAuth.getAccessToken();

      const response = await axios.post(
        `/api/admin/stocks/corporate/sync`,
        { symbol },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const { saved, skipped, total } = response.data.data;
        setToast({
          message: `Synced ${total} items: ${saved} new, ${skipped} duplicates`,
          type: 'success'
        });
        fetchActions();
      }
    } catch (error: any) {
      setToast({
        message: error.response?.data?.error || 'Failed to sync corporate actions',
        type: 'error'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncNews = async () => {
    try {
      setSyncingNews(true);
      const token = ClientAuth.getAccessToken();

      const response = await axios.post(
        `/api/admin/stocks/activities/sync`,
        {
          symbols: [symbol],
          types: ['news-article', 'news-video'],
          count: 50
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const { totalAdded, totalSkipped } = response.data.data;
        setToast({
          message: `Synced news: ${totalAdded} new, ${totalSkipped} duplicates`,
          type: 'success'
        });
        fetchActions();
      }
    } catch (error: any) {
      setToast({
        message: error.response?.data?.error || 'Failed to sync news',
        type: 'error'
      });
    } finally {
      setSyncingNews(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this corporate action?')) return;

    try {
      const token = ClientAuth.getAccessToken();
      await axios.delete(`/api/admin/stocks/corporate/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setToast({
        message: 'Corporate action deleted successfully',
        type: 'success'
      });
      fetchActions();
    } catch (error: any) {
      setToast({
        message: error.response?.data?.error || 'Failed to delete corporate action',
        type: 'error'
      });
    }
  };

  const handleOpenCreate = () => {
    setEditingAction(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (action: CorporateAction) => {
    setEditingAction(action);
    setIsModalOpen(true);
  };

  const handleSaveAction = async (data: any) => {
    try {
      const token = ClientAuth.getAccessToken();

      if (editingAction) {
        // Update existing
        await axios.put(
          `/api/admin/stocks/corporate/${editingAction._id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setToast({
          message: 'Corporate action updated successfully',
          type: 'success'
        });
      } else {
        // Create new
        await axios.post(
          `/api/admin/stocks/corporate`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setToast({
          message: 'Corporate action created successfully',
          type: 'success'
        });
      }

      setIsModalOpen(false);
      setEditingAction(null);
      fetchActions();
    } catch (error: any) {
      setToast({
        message: error.response?.data?.error || 'Failed to save corporate action',
        type: 'error'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTabColor = (type: string) => {
    switch (type) {
      case 'dividend': return 'text-green-600 border-green-500';
      case 'announcement': return 'text-purple-600 border-purple-500';
      case 'legal-order': return 'text-red-600 border-red-500';
      default: return 'text-blue-600 border-blue-500';
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      'news-article': 'bg-blue-100 text-blue-800',
      'news-video': 'bg-blue-100 text-blue-800',
      'dividend': 'bg-green-100 text-green-800',
      'announcement': 'bg-purple-100 text-purple-800',
      'legal-order': 'bg-red-100 text-red-800'
    };
    const labels = {
      'news-article': '📰 News',
      'news-video': '🎥 Video',
      'dividend': '💰 Dividend',
      'announcement': '📢 Announcement',
      'legal-order': '⚖️ Legal Order'
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[type as keyof typeof badges]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const newsCount = actions.filter(a => a.activityType === 'news-article' || a.activityType === 'news-video').length;
  const dividendCount = actions.filter(a => a.activityType === 'dividend').length;
  const announcementCount = actions.filter(a => a.activityType === 'announcement').length;
  const legalOrderCount = actions.filter(a => a.activityType === 'legal-order').length;

  return (
    <AdminDashboardLayout currentPage="stocks">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="p-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/admin/stocks"
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Stocks
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {symbol} - Corporate Actions
            </h1>
            <p className="text-gray-600 mt-2">
              {stock?.companyName || 'Loading...'}
            </p>
            {stock?.screenerId ? (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Tickertape Symbol: {stock.screenerId}
              </p>
            ) : stock ? (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                No Tickertape mapping found. Please add screenerId in stock edit page.
              </p>
            ) : null}
          </div>
          <div className="flex gap-3">
            <Link
              href={`/stocks/${symbol}`}
              target="_blank"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md hover:shadow-lg transition-all"
            >
              View Stock Page
            </Link>
            <button
              onClick={handleSyncNews}
              disabled={syncingNews}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sync news articles from Tickertape"
            >
              {syncingNews ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing News...
                </span>
              ) : '📰 Sync News'}
            </button>
            <button
              onClick={handleSync}
              disabled={syncing || !stock?.screenerId}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={!stock?.screenerId ? 'Tickertape mapping required. Add screenerId to enable sync.' : 'Sync corporate actions from Tickertape'}
            >
              {syncing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </span>
              ) : '🔄 Sync Corporate'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Actions</div>
            <div className="text-2xl font-bold text-gray-900">{actions.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">📰 News</div>
            <div className="text-2xl font-bold text-blue-600">{newsCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">💰 Dividends</div>
            <div className="text-2xl font-bold text-green-600">{dividendCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">📢 Announcements</div>
            <div className="text-2xl font-bold text-purple-600">{announcementCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">⚖️ Legal Orders</div>
            <div className="text-2xl font-bold text-red-600">{legalOrderCount}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 flex items-center justify-between">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All ({actions.length})
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'news' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📰 News ({newsCount})
              </button>
              <button
                onClick={() => setActiveTab('dividend')}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'dividend' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💰 Dividends ({dividendCount})
              </button>
              <button
                onClick={() => setActiveTab('announcement')}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'announcement' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📢 Announcements ({announcementCount})
              </button>
              <button
                onClick={() => setActiveTab('legal-order')}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'legal-order' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⚖️ Legal Orders ({legalOrderCount})
              </button>
            </nav>
            <button
              onClick={handleOpenCreate}
              className="mr-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Corporate Actions Found</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'all' ? 'No corporate actions available for this stock.' : `No ${activeTab}s found for this stock.`}
            </p>
            {stock?.screenerId && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : '🔄 Sync from Tickertape'}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pagination Controls Top */}
            <div className="bg-white rounded-lg shadow mb-4 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Showing {filteredActions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredActions.length)} of {filteredActions.length} items
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Items per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={40}>40</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  ‹
                </button>
                <span className="text-sm text-gray-600 px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  »
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {paginatedActions.map((action) => (
                <div key={action._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getTypeBadge(action.activityType)}
                        <span className="text-xs text-gray-500">
                          {formatDate(action.publishedAt)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {action.headline}
                      </h3>
                      {action.summary && (
                        <div
                          className="text-sm text-gray-600 prose prose-sm max-w-none mb-3"
                          dangerouslySetInnerHTML={{ __html: action.summary }}
                        />
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {action.source && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                            {action.source}
                          </span>
                        )}
                        {action.sourceUrl && (
                          <a
                            href={action.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            View Source
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleOpenEdit(action)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(action._id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls Bottom */}
          <div className="bg-white rounded-lg shadow mt-4 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Showing {filteredActions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredActions.length)} of {filteredActions.length} items
              </span>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                ‹
              </button>
              <span className="text-sm text-gray-600 px-3">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                »
              </button>
            </div>
          </div>
          </>
        )}

        {/* Modal */}
        <CorporateActionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAction(null);
          }}
          onSave={handleSaveAction}
          action={editingAction}
          stockSymbol={symbol}
          activityType={activeTab === 'all' ? 'news-article' : activeTab === 'news' ? 'news-article' : activeTab}
        />
      </div>
    </AdminDashboardLayout>
  );
}

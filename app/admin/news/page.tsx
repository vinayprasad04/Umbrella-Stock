'use client';

import { useState, useEffect } from 'react';
import { ClientAuth } from '@/lib/auth';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';

interface NewsArticle {
  _id: string;
  stockSymbol: string;
  activityType: string;
  headline: string;
  summary?: string;
  publishedAt: string;
  source?: string;
  sourceUrl?: string;
  imageUrl?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminNewsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);

  const limit = 20;

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

    fetchNews();
  }, [page, symbolFilter, typeFilter]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const token = ClientAuth.getAccessToken();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (symbolFilter) params.append('symbol', symbolFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`/api/admin/stocks/news?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNews(response.data.data.activities);
        setTotal(response.data.data.total);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error: any) {
      console.error('Error fetching news:', error);
      alert(error.response?.data?.error || 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news article?')) return;

    try {
      const token = ClientAuth.getAccessToken();
      await axios.delete(`/api/admin/stocks/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('News article deleted successfully');
      fetchNews();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete news article');
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchNews();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout currentPage="news">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock News Management</h1>
            <p className="text-gray-600 mt-2">Manage stock news articles and activities</p>
          </div>
          <button
            onClick={() => {
              setEditingNews(null);
              setShowAddForm(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all"
          >
            + Add News Article
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Articles</div>
            <div className="text-2xl font-bold text-gray-900">{total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Current Page</div>
            <div className="text-2xl font-bold text-gray-900">{page} / {totalPages}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Showing</div>
            <div className="text-2xl font-bold text-gray-900">{news.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Per Page</div>
            <div className="text-2xl font-bold text-gray-900">{limit}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search headline, summary..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Symbol
              </label>
              <input
                type="text"
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value.toUpperCase())}
                placeholder="e.g., INFY"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="news-article">News Article</option>
                <option value="news-video">News Video</option>
                <option value="dividend">Dividend</option>
                <option value="announcement">Announcement</option>
                <option value="legal-order">Legal Order</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* News Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No News Articles Found</h3>
              <p className="text-gray-600 mb-4">Start by adding your first news article</p>
              <button onClick={() => setShowAddForm(true)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                + Add News Article
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Headline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Published
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {news.map((article) => (
                      <tr key={article._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {article.stockSymbol}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 line-clamp-2">
                            {article.headline}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {article.activityType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {article.source || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            article.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {article.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingNews(article);
                              setShowAddForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(article._id)}
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

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <NewsFormModal
          news={editingNews}
          onClose={() => {
            setShowAddForm(false);
            setEditingNews(null);
          }}
          onSuccess={() => {
            setShowAddForm(false);
            setEditingNews(null);
            fetchNews();
          }}
        />
      )}
    </AdminDashboardLayout>
  );
}

// News Form Modal Component
function NewsFormModal({
  news,
  onClose,
  onSuccess
}: {
  news: NewsArticle | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    stockSymbol: news?.stockSymbol || '',
    activityType: news?.activityType || 'news-article',
    headline: news?.headline || '',
    summary: news?.summary || '',
    publishedAt: news?.publishedAt ? new Date(news.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    source: news?.source || '',
    sourceUrl: news?.sourceUrl || '',
    imageUrl: news?.imageUrl || '',
    tags: news?.tags?.join(', ') || '',
    isActive: news?.isActive ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = ClientAuth.getAccessToken();
      const data = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (news) {
        // Update
        await axios.put(`/api/admin/stocks/news/${news._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('News article updated successfully');
      } else {
        // Create
        await axios.post('/api/admin/stocks/news', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('News article created successfully');
      }

      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {news ? 'Edit News Article' : 'Add News Article'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Symbol *
                </label>
                <input
                  type="text"
                  required
                  value={formData.stockSymbol}
                  onChange={(e) => setFormData({ ...formData, stockSymbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., INFY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.activityType}
                  onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="news-article">News Article</option>
                  <option value="news-video">News Video</option>
                  <option value="dividend">Dividend</option>
                  <option value="announcement">Announcement</option>
                  <option value="legal-order">Legal Order</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headline *
              </label>
              <input
                type="text"
                required
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="Enter headline"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Enter summary"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Published Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., Economic Times"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source URL
              </label>
              <input
                type="url"
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="earnings, dividend, growth"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active (visible to users)
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (news ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

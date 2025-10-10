'use client';

import { useState, useEffect } from 'react';
import { ClientAuth } from '@/lib/auth';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import Link from 'next/link';

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

export default function StockNewsManagementPage() {
  const router = useRouter();
  const params = useParams();
  const symbol = params?.symbol as string;

  const [user, setUser] = useState<any>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);

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
      fetchNews();
    }
  }, [symbol]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const token = ClientAuth.getAccessToken();

      const response = await axios.get(
        `/api/admin/stocks/news?symbol=${symbol}&limit=1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNews(response.data.data.activities);
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout currentPage="stocks">
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
              {symbol} - News Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage news articles for {symbol}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingNews(null);
              setShowAddForm(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all"
          >
            + Add News for {symbol}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total News Articles</div>
            <div className="text-2xl font-bold text-gray-900">{news.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Active Articles</div>
            <div className="text-2xl font-bold text-gray-900">
              {news.filter(n => n.isActive).length}
            </div>
          </div>
        </div>

        {/* News List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading news...</p>
              </div>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No News Articles Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first news article for {symbol}
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add News Article
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <NewsFormModal
          news={editingNews}
          defaultSymbol={symbol}
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
  defaultSymbol,
  onClose,
  onSuccess
}: {
  news: NewsArticle | null;
  defaultSymbol: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    stockSymbol: news?.stockSymbol || defaultSymbol || '',
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
        await axios.put(`/api/admin/stocks/news/${news._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('News article updated successfully');
      } else {
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
            {news ? 'Edit News Article' : `Add News for ${defaultSymbol}`}
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
                  disabled={!!defaultSymbol && !news}
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

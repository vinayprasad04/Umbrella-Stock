'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';

interface StockActivity {
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
  feedType?: string;
}

interface StockNewsProps {
  symbol: string;
  activityType?: string;
}

export default function StockNews({ symbol, activityType = 'news-article' }: StockNewsProps) {
  const [activities, setActivities] = useState<StockActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [expandedNews, setExpandedNews] = useState<Set<string>>(new Set());

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when activity type changes
    fetchNews(1);
  }, [symbol, activityType]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchNews(currentPage);
    }
  }, [currentPage]);

  const fetchNews = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `/api/stocks/${symbol}/activities?page=${page}&limit=${ITEMS_PER_PAGE}&type=${activityType}`
      );

      if (response.data.success) {
        const { activities, total, totalPages, hasMore } = response.data.data;
        setActivities(activities);
        setTotal(total);
        setTotalPages(totalPages);
        setHasMore(hasMore);
      }
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError(err.response?.data?.error || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setExpandedNews(new Set()); // Reset expanded state on page change
      // Scroll to top of news section
      document.getElementById('stock-news-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleExpanded = (newsId: string) => {
    setExpandedNews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(newsId)) {
        newSet.delete(newsId);
      } else {
        newSet.add(newsId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getPaginationRange = () => {
    const range: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) range.push(i);
        range.push('...');
        range.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        range.push(1);
        range.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) range.push(i);
      } else {
        range.push(1);
        range.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) range.push(i);
        range.push('...');
        range.push(totalPages);
      }
    }

    return range;
  };

  if (loading && currentPage === 1) {
    return (
      <div id="stock-news-section">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
        <p className="text-center text-gray-600 mt-4">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div id="stock-news-section">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchNews(currentPage)}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div id="stock-news-section">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h4>
          <p className="text-gray-600">
            There are no items available for {symbol} at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="stock-news-section">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">
          {total} article{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {loading && currentPage > 1 ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity._id}
              className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 bg-white"
            >
              <div className="flex gap-4">
                {/* Image */}
                {activity.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={activity.imageUrl}
                      alt={activity.headline}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Headline */}
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 leading-tight hover:text-blue-600 transition-colors">
                    {activity.sourceUrl ? (
                      <a
                        href={activity.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {activity.headline}
                      </a>
                    ) : (
                      activity.headline
                    )}
                  </h4>

                  {/* Summary */}
                  {activity.summary && (
                    <div className="mb-3">
                      <div className="relative">
                        <div
                          className={`text-sm text-gray-600 prose prose-sm max-w-none ${
                            !expandedNews.has(activity._id) ? 'line-clamp-3' : ''
                          }`}
                          dangerouslySetInnerHTML={{ __html: activity.summary }}
                          style={{
                            '--tw-prose-body': '#4b5563',
                            '--tw-prose-headings': '#1f2937',
                            '--tw-prose-links': '#2563eb',
                            '--tw-prose-bold': '#1f2937',
                            '--tw-prose-counters': '#6b7280',
                            '--tw-prose-bullets': '#d1d5db',
                            '--tw-prose-quotes': '#1f2937',
                            '--tw-prose-code': '#1f2937',
                            '--tw-prose-th-borders': '#d1d5db',
                            '--tw-prose-td-borders': '#e5e7eb',
                          } as React.CSSProperties}
                        />
                      </div>
                      {activity.summary.length > 200 && (
                        <button
                          onClick={() => toggleExpanded(activity._id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center gap-1 mt-1"
                        >
                          {expandedNews.has(activity._id) ? (
                            <>
                              Show less
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </>
                          ) : (
                            <>
                              Read more
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {activity.source && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{activity.source}</span>
                      </div>
                    )}

                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>{formatDate(activity.publishedAt)}</span>
                    </div>

                    {activity.tags && activity.tags.length > 0 && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span>{activity.tags.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* External Link Icon */}
                {activity.sourceUrl && (
                  <div className="flex-shrink-0">
                    <a
                      href={activity.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      title="Read full article"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* Page Info */}
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} articles
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>

              {/* Page Numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {getPaginationRange().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              {/* Current Page (Mobile) */}
              <div className="sm:hidden px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                {currentPage} / {totalPages}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasMore}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface CorporateAction {
  _id?: string;
  stockSymbol: string;
  activityType: 'news-article' | 'news-video' | 'dividend' | 'announcement' | 'legal-order';
  headline: string;
  summary?: string;
  publishedAt: string;
  source?: string;
  sourceUrl?: string;
  imageUrl?: string;
  metadata?: any;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CorporateAction) => void;
  action?: CorporateAction | null;
  stockSymbol: string;
  activityType?: 'news-article' | 'news-video' | 'dividend' | 'announcement' | 'legal-order';
}

export default function CorporateActionModal({ isOpen, onClose, onSave, action, stockSymbol, activityType }: Props) {
  const [formData, setFormData] = useState<CorporateAction>({
    stockSymbol: stockSymbol,
    activityType: activityType || 'news-article',
    headline: '',
    summary: '',
    publishedAt: new Date().toISOString().split('T')[0],
    source: '',
    sourceUrl: '',
    imageUrl: '',
    metadata: {}
  });

  useEffect(() => {
    if (action) {
      setFormData({
        ...action,
        publishedAt: new Date(action.publishedAt).toISOString().split('T')[0]
      });
    } else {
      setFormData({
        stockSymbol: stockSymbol,
        activityType: activityType || 'news-article',
        headline: '',
        summary: '',
        publishedAt: new Date().toISOString().split('T')[0],
        source: '',
        sourceUrl: '',
        imageUrl: '',
        metadata: {}
      });
    }
  }, [action, stockSymbol, activityType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateMetadata = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }));
  };

  if (!isOpen) return null;

  const isDividend = formData.activityType === 'dividend';
  const isAnnouncement = formData.activityType === 'announcement';
  const isLegalOrder = formData.activityType === 'legal-order';
  const isNews = formData.activityType === 'news-article' || formData.activityType === 'news-video';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {action ? 'Edit' : 'Add'} {formData.activityType === 'news-article' ? 'News Article' :
             formData.activityType === 'news-video' ? 'News Video' :
             formData.activityType === 'dividend' ? 'Dividend' :
             formData.activityType === 'announcement' ? 'Announcement' :
             'Legal Order'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Activity Type (only for new entries) */}
          {!action && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type *
              </label>
              <select
                value={formData.activityType}
                onChange={(e) => setFormData(prev => ({ ...prev, activityType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="news-article">📰 News Article</option>
                <option value="news-video">🎥 News Video</option>
                <option value="dividend">💰 Dividend</option>
                <option value="announcement">📢 Announcement</option>
                <option value="legal-order">⚖️ Legal Order</option>
              </select>
            </div>
          )}

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Headline *
            </label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Enter headline"
            />
          </div>

          {/* Published Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isDividend ? 'Ex-Date' : isAnnouncement ? 'Broadcast Date' : isLegalOrder ? 'Order Date' : 'Published Date'} *
            </label>
            <input
              type="date"
              value={formData.publishedAt}
              onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Dividend-specific fields */}
          {isDividend && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dividend Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.metadata?.dividendAmount || ''}
                    onChange={(e) => updateMetadata('dividendAmount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dividend Type
                  </label>
                  <select
                    value={formData.metadata?.subType || ''}
                    onChange={(e) => updateMetadata('subType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="Interim">Interim</option>
                    <option value="Final">Final</option>
                    <option value="Special">Special</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ex-Date
                </label>
                <input
                  type="date"
                  value={formData.metadata?.exDate ? new Date(formData.metadata.exDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => updateMetadata('exDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Announcement-specific fields */}
          {isAnnouncement && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.metadata?.subject || ''}
                  onChange={(e) => updateMetadata('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Subject of announcement"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachment URL
                </label>
                <input
                  type="url"
                  value={formData.metadata?.attachement || ''}
                  onChange={(e) => updateMetadata('attachement', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/attachment.pdf"
                />
              </div>
            </>
          )}

          {/* Legal Order-specific fields */}
          {isLegalOrder && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Case Number
                  </label>
                  <input
                    type="text"
                    value={formData.metadata?.caseNo || ''}
                    onChange={(e) => updateMetadata('caseNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Case number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Court Source
                  </label>
                  <input
                    type="text"
                    value={formData.metadata?.courtSource || ''}
                    onChange={(e) => updateMetadata('courtSource', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Court name"
                  />
                </div>
              </div>
            </>
          )}

          {/* Summary (for all types) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary / Description
            </label>
            <textarea
              value={formData.summary || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter summary or description (supports HTML)"
            />
          </div>

          {/* Source (for news) */}
          {isNews && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <input
                  type="text"
                  value={formData.source || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Source name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source URL
                </label>
                <input
                  type="url"
                  value={formData.sourceUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/article"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all"
            >
              {action ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

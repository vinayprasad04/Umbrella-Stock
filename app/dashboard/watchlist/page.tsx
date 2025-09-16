'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import UserDashboardLayout from '@/components/layouts/UserDashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/api-utils';
import { useAuth } from '@/lib/AuthContext';
import { ClientAuth } from '@/lib/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface WatchlistItem {
  _id: string;
  symbol: string;
  companyName: string;
  type: 'STOCK' | 'MUTUAL_FUND';
  addedAt: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

interface LiveData {
  [symbol: string]: {
    price: number;
    change: number;
    changePercent: number;
    lastUpdated: string;
    detectedType?: 'STOCK' | 'MUTUAL_FUND';
  };
}

interface SearchResult {
  symbol: string;
  name: string;
  type: 'STOCK' | 'MUTUAL_FUND';
  sector?: string;
  description?: string;
  isVerified?: boolean;
}

// SortableItem component for @dnd-kit
interface SortableItemProps {
  item: WatchlistItem;
  liveData: LiveData;
  loadingLive: boolean;
  onRemove: (symbol: string) => void;
}

function SortableItem({ item, liveData, loadingLive, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const live = liveData[item.symbol];
  const itemType = live?.detectedType || item.type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 ${
        isDragging ? 'scale-[0.98] shadow-lg' : ''
      }`}
    >
      <div className="flex items-center px-3 py-2">
        {/* Drag Handle */}
        <div 
          {...attributes}
          {...listeners}
          className="drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 mr-3 hover:bg-gray-100 rounded transition-colors"
          title="Drag to reorder"
        >
          <FontAwesomeIcon 
            icon={faGripVertical} 
            className="w-4 h-4 text-gray-400 hover:text-gray-600" 
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            {/* Left side - Symbol and Company */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <a
                  href={itemType === 'STOCK' ? `/stocks/${item.symbol}` : `/mutual-funds/${item.symbol}`}
                  className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {item.symbol}
                </a>
                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                  itemType === 'STOCK' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {itemType === 'STOCK' ? 'Stock' : 'Mutual Fund'}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate pr-2">{item.companyName}</p>
            </div>

            {/* Center - Price Info */}
            <div className="text-right mx-4">
              {live ? (
                <>
                  <div className="text-lg font-bold text-gray-900">
                    {itemType === 'STOCK' ? formatCurrency(live.price) : `₹${live.price.toFixed(2)}`}
                  </div>
                  {itemType === 'STOCK' && (
                    <div className={`text-sm font-medium ${
                      live.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {live.change >= 0 ? '+' : ''}{formatCurrency(live.change)} ({formatPercentage(live.changePercent)})
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  {loadingLive ? 'Loading...' : 'N/A'}
                </div>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2">
              <a
                href={itemType === 'STOCK' ? `/stocks/${item.symbol}` : `/mutual-funds/${item.symbol}`}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
              >
                View
              </a>
              <button
                onClick={() => onRemove(item.symbol)}
                className="text-xs text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                title="Remove from watchlist"
              >
                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [liveData, setLiveData] = useState<LiveData>({});
  const [loadingLive, setLoadingLive] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [addingToWatchlist, setAddingToWatchlist] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // @dnd-kit sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Tab functionality
  const [activeTab, setActiveTab] = useState(1);
  const [tabCounts, setTabCounts] = useState<{[key: number]: number}>({});
  const [totalItems, setTotalItems] = useState(0);
  const [watchlistNames, setWatchlistNames] = useState<{[key: number]: string}>({
    1: 'Watchlist 1',
    2: 'Watchlist 2',
    3: 'Watchlist 3',
    4: 'Watchlist 4',
    5: 'Watchlist 5'
  });
  const [editingTabName, setEditingTabName] = useState<number | null>(null);
  const [tempTabName, setTempTabName] = useState('');

  const { data: watchlistData, isLoading: isLoadingWatchlist, error, refetch } = useQuery({
    queryKey: ['watchlist', activeTab],
    queryFn: async () => {
      const token = ClientAuth.getAccessToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const response = await axios.get(`/api/user/watchlist?watchlistId=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    },
    enabled: isAuthenticated && !isLoading && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401) return false;
      return failureCount < 2;
    },
  });

  // Fetch live data for watchlist items
  useEffect(() => {
    const fetchLiveData = async () => {
      if (!watchlistData?.watchlist?.length) return;

      setLoadingLive(true);
      const promises = watchlistData.watchlist.map(async (item: WatchlistItem) => {
        let detectedType = item.type;

        // If type is not set, try to detect it
        if (!detectedType) {
          try {
            // First try as stock
            const stockResponse = await axios.get(`/api/stocks/live/${item.symbol}`);
            if (stockResponse.data.success) {
              detectedType = 'STOCK';
            }
          } catch (stockError) {
            try {
              // If stock fails, try as mutual fund
              const mfResponse = await axios.get(`/api/mutual-funds/${item.symbol}/verified`);
              if (mfResponse.data.success) {
                detectedType = 'MUTUAL_FUND';
              }
            } catch (mfError) {
              // If both fail, default to STOCK
              detectedType = 'STOCK';
            }
          }
        }

        try {
          let response;
          if (detectedType === 'STOCK') {
            response = await axios.get(`/api/stocks/live/${item.symbol}`);
          } else {
            // For mutual funds, fetch NAV data
            response = await axios.get(`/api/mutual-funds/${item.symbol}/verified`);
          }
          return {
            symbol: item.symbol,
            type: detectedType,
            data: response.data.data
          };
        } catch (error) {
          console.error(`Error fetching live data for ${item.symbol}:`, error);
          return {
            symbol: item.symbol,
            type: detectedType,
            data: null
          };
        }
      });

      const results = await Promise.all(promises);
      const liveDataMap: LiveData = {};

      results.forEach(result => {
        if (result.data) {
          if (result.type === 'STOCK') {
            liveDataMap[result.symbol] = {
              ...result.data,
              detectedType: result.type
            };
          } else {
            // For mutual funds, map NAV data to price format
            liveDataMap[result.symbol] = {
              price: result.data.currentNav || result.data.nav || 0,
              change: 0, // Mutual funds don't typically have change data
              changePercent: 0,
              lastUpdated: result.data.navDate || new Date().toISOString(),
              detectedType: result.type
            };
          }
        }
      });

      setLiveData(liveDataMap);
      setLoadingLive(false);
    };

    fetchLiveData();

    // Refresh live data every 30 seconds
    const interval = setInterval(fetchLiveData, 30 * 1000);
    return () => clearInterval(interval);
  }, [watchlistData]);

  // Update tab data when data changes
  useEffect(() => {
    if (watchlistData) {
      // Update tab counts and other metadata
      if (watchlistData.tabCounts) {
        setTabCounts(watchlistData.tabCounts);
      }
      
      if (watchlistData.totalItems !== undefined) {
        setTotalItems(watchlistData.totalItems);
      }
      
      if (watchlistData.watchlistNames) {
        setWatchlistNames(watchlistData.watchlistNames);
      }
    }
  }, [watchlistData]);

  // @dnd-kit drag end handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && watchlistData?.watchlist) {
      const currentWatchlist = watchlistData.watchlist;
      const oldIndex = currentWatchlist.findIndex((item: WatchlistItem) => item._id === active.id);
      const newIndex = currentWatchlist.findIndex((item: WatchlistItem) => item._id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newWatchlist = arrayMove(currentWatchlist, oldIndex, newIndex) as WatchlistItem[];
        
        // Optimistically update the React Query cache immediately
        queryClient.setQueryData(['watchlist', activeTab], {
          ...watchlistData,
          watchlist: newWatchlist
        });

        // Save order to backend
        try {
          const token = ClientAuth.getAccessToken();
          const orderData = newWatchlist.map((item, index) => ({
            id: item._id,
            order: index
          }));

          await axios.put('/api/user/watchlist/reorder', {
            items: orderData,
            watchlistId: activeTab
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          console.log('✅ Order saved successfully');
        } catch (error) {
          console.error('❌ Error saving watchlist order:', error);
          // Revert the optimistic update on error
          queryClient.setQueryData(['watchlist', activeTab], watchlistData);
          alert('Failed to save new order. Please try again.');
        }
      }
    }
  };

  // Search functionality
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const token = ClientAuth.getAccessToken();
      const response = await axios.get(`/api/search/watchlist?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSearchResults(response.data.data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleAddToWatchlist = async (item: SearchResult) => {
    console.log('🔄 Adding to watchlist:', { symbol: item.symbol, activeTab, item });
    setAddingToWatchlist(item.symbol);
    
    try {
      const token = ClientAuth.getAccessToken();
      console.log('🔄 Making API request to add item...');
      
      const response = await axios.post('/api/user/watchlist', {
        symbol: item.symbol,
        companyName: item.name,
        type: item.type,
        watchlistId: activeTab
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ API response:', response.data);
      
      // Clear search first
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      
      // Show success feedback with tab info
      const addedToTab = response.data.data?.addedToTab || activeTab;
      alert(`${item.symbol} added to ${watchlistNames[addedToTab] || `Watchlist ${addedToTab}`} successfully!`);
      
      // If item was added to a different tab due to current being full, switch to that tab
      if (addedToTab !== activeTab) {
        console.log('🔄 Switching to tab:', addedToTab);
        setActiveTab(addedToTab);
      }
      
      // Force refresh watchlist
      console.log('🔄 Refreshing watchlist data...');
      await refetch();
      console.log('✅ Watchlist refreshed');
      
    } catch (error: any) {
      console.error('❌ Error adding to watchlist:', error);
      console.error('❌ Error response:', error.response?.data);
      alert(error.response?.data?.error || 'Failed to add to watchlist');
    } finally {
      setAddingToWatchlist(null);
    }
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleRemoveFromWatchlist = async (symbol: string) => {
    try {
      const token = ClientAuth.getAccessToken();
      await axios.delete(`/api/user/watchlist?symbol=${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh watchlist
      refetch();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  // Tab management functions
  const handleTabClick = (tabId: number) => {
    if (editingTabName !== tabId) {
      setActiveTab(tabId);
    }
  };

  const handleTabNameEdit = (tabId: number) => {
    setEditingTabName(tabId);
    setTempTabName(watchlistNames[tabId] || `Watchlist ${tabId}`);
  };

  const handleTabNameSave = async (tabId: number) => {
    if (!tempTabName.trim()) {
      setEditingTabName(null);
      return;
    }

    try {
      const token = ClientAuth.getAccessToken();
      await axios.put('/api/user/watchlist/update-name', {
        watchlistId: tabId,
        name: tempTabName.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setWatchlistNames(prev => ({
        ...prev,
        [tabId]: tempTabName.trim()
      }));
      
      setEditingTabName(null);
      setTempTabName('');
    } catch (error) {
      console.error('Error updating tab name:', error);
      alert('Failed to update tab name');
    }
  };

  const handleTabNameCancel = () => {
    setEditingTabName(null);
    setTempTabName('');
  };

  // Show loading during auth initialization
  if (isLoading) {
    return (
      <UserDashboardLayout currentPage="watchlist">
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </UserDashboardLayout>
    );
  }

  // Show login required only after loading is complete and user is not authenticated
  if (!isAuthenticated) {
    return (
      <UserDashboardLayout currentPage="watchlist">
        <div className="flex justify-center items-center py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h1>
            <p className="text-gray-600 mb-8">Please log in to view your watchlist.</p>
            <a href="/login" className="btn-primary">
              Login
            </a>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  if (isLoadingWatchlist) {
    return (
      <UserDashboardLayout currentPage="watchlist">
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </UserDashboardLayout>
    );
  }

  if (error) {
    return (
      <UserDashboardLayout currentPage="watchlist">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Watchlist</h1>
          <p className="text-gray-600 mb-8">Something went wrong while loading your watchlist.</p>
          <button onClick={() => refetch()} className="btn-primary">
            Try Again
          </button>
        </div>
      </UserDashboardLayout>
    );
  }

  const watchlist = watchlistData?.watchlist || [];

  return (
    <UserDashboardLayout currentPage="watchlist">
      <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Watchlist</h1>
            <p className="text-gray-600 mt-1">
              Track your favorite stocks and monitor their performance ({totalItems}/100 items total)
            </p>
          </div>

          {/* Watchlist Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[1, 2, 3, 4, 5].map((tabId) => (
                  <div key={tabId} className="flex items-center group">
                    <button
                      onClick={() => handleTabClick(tabId)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tabId
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {editingTabName === tabId ? (
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={tempTabName}
                            onChange={(e) => setTempTabName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleTabNameSave(tabId);
                              if (e.key === 'Escape') handleTabNameCancel();
                            }}
                            className="text-sm border border-gray-300 rounded px-2 py-1 w-28"
                            autoFocus
                            maxLength={50}
                          />
                          <button
                            onClick={() => handleTabNameSave(tabId)}
                            className="text-green-600 hover:text-green-800"
                            title="Save"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleTabNameCancel}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span>{watchlistNames[tabId] || `Watchlist ${tabId}`}</span>
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            tabCounts[tabId] >= 20
                              ? 'bg-red-100 text-red-800'
                              : tabCounts[tabId] >= 15
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {tabCounts[tabId] || 0}/20
                          </span>
                        </div>
                      )}
                    </button>
                    {editingTabName !== tabId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTabNameEdit(tabId);
                        }}
                        className="ml-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                        title="Edit tab name"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 relative" ref={searchDropdownRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Search to add to ${watchlistNames[activeTab] || `Watchlist ${activeTab}`}...`}
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <div className="text-sm text-gray-500 px-3 py-2 border-b border-gray-100">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </div>
                  {searchResults.map((item) => (
                    <div key={`${item.type}-${item.symbol}`} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{item.symbol}</h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            item.type === 'STOCK'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {item.type === 'STOCK' ? 'Stock' : 'Mutual Fund'}
                          </span>
                          {item.isVerified && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{item.name}</p>
                        {item.sector && (
                          <p className="text-xs text-gray-500 mt-1">Sector: {item.sector}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToWatchlist(item)}
                        disabled={addingToWatchlist === item.symbol}
                        className="ml-4 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Add to Watchlist"
                      >
                        {addingToWatchlist === item.symbol ? (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
              <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-4 text-center">
                  <div className="text-gray-500 text-sm">
                    No stocks or mutual funds found for "{searchQuery}"
                  </div>
                </div>
              </div>
            )}
          </div>

          {watchlist.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Watchlist is Empty</h3>
              <p className="text-gray-600 mb-6">
                Start building your watchlist by adding stocks you want to track.
              </p>
              <a href="/stocks" className="btn-primary">
                Browse Stocks
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {watchlist.length} item{watchlist.length !== 1 ? 's' : ''} in your watchlist
                </p>
                {loadingLive && (
                  <div className="flex items-center text-xs text-gray-500">
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </div>
                )}
              </div>

              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={watchlist.map((item: WatchlistItem) => item._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {watchlist.map((item: WatchlistItem) => (
                      <SortableItem
                        key={item._id}
                        item={item}
                        liveData={liveData}
                        loadingLive={loadingLive}
                        onRemove={handleRemoveFromWatchlist}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
      </div>
    </UserDashboardLayout>
  );
}
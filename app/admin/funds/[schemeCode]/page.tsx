'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import { CustomSelect } from '@/components/ui/custom-select';
import { ApiClient } from '@/lib/apiClient';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface MutualFundBasic {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  category: string;
  currentNav?: number;
}

interface ActualFundManager {
  name: string;
  since: string;
  experience: string;
  education: string;
  fundsManaged: string[];
}

interface FundManager {
  _id: string;
  name: string;
  experience: string;
  education: string;
  fundsManaged: string[];
  isActive: boolean;
}

interface FundManagerSelection {
  managerId: string;
  since?: string;
  fundsManaged?: string[];
}


interface AssetAllocation {
  equity: number;
  debt: number;
  cashAndCashEq: number;
}

interface PortfolioAggregates {
  giant: number;
  large: number;
  mid: number;
  small: number;
  tiny: number;
  avgMarketCap: number;
}

interface CreditRating {
  aaa: number;
  sov: number;
  cashEquivalent: number;
  aa: number;
}

interface SectorWiseHolding {
  sector: string;
  fundPercentage: number;
  categoryPercentage: number;
}

interface TopEquityHolding {
  companyName: string;
  sector: string;
  peRatio: number;
  assetsPercentage: number;
}

interface TopDebtHolding {
  companyName: string;
  instrument: string;
  creditRating: string;
  assetsPercentage: number;
}

interface FundInfo {
  nameOfAMC: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
}

interface ActualMutualFundDetails {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  assetAllocation: AssetAllocation;
  portfolioAggregates: PortfolioAggregates;
  creditRating: CreditRating;
  sectorWiseHoldings: SectorWiseHolding[];
  topEquityHoldings: TopEquityHolding[];
  topDebtHoldings: TopDebtHolding[];
  launchDate: string;
  riskometer: string;
  expense: number;
  exitLoad: string;
  openEnded: boolean;
  lockInPeriod: string;
  fundInfo: FundInfo;
  actualFundManagers: ActualFundManager[];
  // New fund manager selection fields
  fundManagerSelections: FundManagerSelection[];
  dataSource: string;
  dataQuality: 'VERIFIED' | 'PENDING_VERIFICATION' | 'EXCELLENT' | 'GOOD';
  notes?: string;
}

export default function FundDataEntry() {
  const router = useRouter();
  const params = useParams();
  const schemeCode = params?.schemeCode as string;

  const [user, setUser] = useState<User | null>(null);
  const [fundBasic, setFundBasic] = useState<MutualFundBasic | null>(null);
  const [availableFundManagers, setAvailableFundManagers] = useState<FundManager[]>([]);
  const [formData, setFormData] = useState<ActualMutualFundDetails>({
    schemeCode: parseInt(schemeCode),
    schemeName: '',
    fundHouse: '',
    assetAllocation: { equity: 0, debt: 0, cashAndCashEq: 0 },
    portfolioAggregates: { giant: 0, large: 0, mid: 0, small: 0, tiny: 0, avgMarketCap: 0 },
    creditRating: { aaa: 0, sov: 0, cashEquivalent: 0, aa: 0 },
    sectorWiseHoldings: [{ sector: '', fundPercentage: 0, categoryPercentage: 0 }],
    topEquityHoldings: [{ companyName: '', sector: '', peRatio: 0, assetsPercentage: 0 }],
    topDebtHoldings: [{ companyName: '', instrument: '', creditRating: '', assetsPercentage: 0 }],
    launchDate: '',
    riskometer: 'Not Selected',
    expense: 0,
    exitLoad: '',
    openEnded: true,
    lockInPeriod: 'N/A',
    fundInfo: { nameOfAMC: '', address: '', phone: '', fax: '', email: '', website: '' },
    actualFundManagers: [{ name: '', since: '', experience: '', education: '', fundsManaged: [''] }],
    fundManagerSelections: [{ managerId: '', since: '', fundsManaged: [''] }],
    dataSource: 'Value Research',
    dataQuality: 'PENDING_VERIFICATION',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // Collapsible sections state - all expanded by default
  const [collapsedSections, setCollapsedSections] = useState({
    sectorWiseHoldings: false,
    topEquityHoldings: false, 
    topDebtHoldings: false,
    fundDetails: false,
    fundInfo: false,
    fundManagers: false,
    dataQualitySource: false
  });

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
      setUser(userData);
      
      if (!['ADMIN', 'DATA_ENTRY'].includes(userData.role)) {
        router.push('/login');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    fetchFundData();
    fetchAvailableFundManagers();
  }, [schemeCode]);

  // Track form changes to detect unsaved changes
  useEffect(() => {
    const initialFormData = {
      assetAllocation: { equity: 0, debt: 0, cashAndCashEq: 0 },
      portfolioAggregates: { giant: 0, large: 0, mid: 0, small: 0, tiny: 0, avgMarketCap: 0 },
      creditRating: { aaa: 0, sov: 0, cashEquivalent: 0, aa: 0 },
      sectorWiseHoldings: [{ sector: '', fundPercentage: 0, categoryPercentage: 0 }],
      topEquityHoldings: [{ companyName: '', sector: '', peRatio: 0, assetsPercentage: 0 }],
      topDebtHoldings: [{ companyName: '', instrument: '', creditRating: '', assetsPercentage: 0 }],
      launchDate: '',
      riskometer: 'Not Selected',
      expense: 0,
      exitLoad: '',
      openEnded: true,
      lockInPeriod: 'N/A',
      fundInfo: { nameOfAMC: '', address: '', phone: '', fax: '', email: '', website: '' },
      actualFundManagers: [{ name: '', since: '', experience: '', education: '', fundsManaged: [''] }],
      dataSource: 'Value Research',
      dataQuality: 'PENDING_VERIFICATION',
      notes: ''
    };

    // Check if form has been modified from initial state
    const hasChanges = JSON.stringify(formData) !== JSON.stringify({ ...initialFormData, schemeCode: formData.schemeCode, schemeName: formData.schemeName, fundHouse: formData.fundHouse });
    setHasUnsavedChanges(hasChanges && !saving && !success);
  }, [formData, saving, success]);

  // Handle browser beforeunload event for page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Intercept sidebar navigation clicks and logout button
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      const button = target.closest('button') as HTMLButtonElement;
      
      if (hasUnsavedChanges) {
        // Check if it's a sidebar navigation link
        if (link) {
          const href = link.getAttribute('href');
          if (href && (href.startsWith('/admin/') || href === '/dashboard')) {
            e.preventDefault();
            e.stopPropagation();
            setPendingNavigation(href);
            setShowExitModal(true);
          }
        }
        
        // Check if it's a logout button (by title attribute or SVG content)
        if (button) {
          const title = button.getAttribute('title');
          const hasLogoutIcon = button.querySelector('svg path[d*="17 16l4-4m0 0l-4-4m4 4H7"]'); // Logout icon path
          
          if (title === 'Logout' || hasLogoutIcon) {
            e.preventDefault();
            e.stopPropagation();
            setPendingNavigation('/login'); // Set login as the destination after logout
            setShowExitModal(true);
          }
        }
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [hasUnsavedChanges]);

  const fetchFundData = async () => {
    try {
      // Fetch basic fund info (public endpoint)
      const basicResponse = await fetch(`/api/mutual-funds/${schemeCode}`);
      const basicResult = await basicResponse.json();
      
      if (basicResult.success) {
        setFundBasic({
          schemeCode: basicResult.data.schemeCode,
          schemeName: basicResult.data.schemeName,
          fundHouse: basicResult.data.fundHouse,
          category: basicResult.data.category,
          currentNav: basicResult.data.currentNav || basicResult.data.nav
        });
        
        setFormData(prev => ({
          ...prev,
          schemeName: basicResult.data.schemeName,
          fundHouse: basicResult.data.fundHouse
        }));
      }

      // Try to fetch existing actual data using ApiClient
      try {
        const actualResult = await ApiClient.get(`/admin/fund-details/${schemeCode}`);
        
        if (actualResult.success && actualResult.data) {
          // Direct mapping from new schema - no transformation needed
          const loadedData = {
            ...actualResult.data,
            assetAllocation: actualResult.data.assetAllocation || { equity: 0, debt: 0, cashAndCashEq: 0 },
            portfolioAggregates: actualResult.data.portfolioAggregates || { giant: 0, large: 0, mid: 0, small: 0, tiny: 0, avgMarketCap: 0 },
            creditRating: actualResult.data.creditRating || { aaa: 0, sov: 0, cashEquivalent: 0, aa: 0 },
            sectorWiseHoldings: actualResult.data.sectorWiseHoldings?.length > 0 
              ? actualResult.data.sectorWiseHoldings 
              : [{ sector: '', fundPercentage: 0, categoryPercentage: 0 }],
            topEquityHoldings: actualResult.data.topEquityHoldings?.length > 0 
              ? actualResult.data.topEquityHoldings 
              : [{ companyName: '', sector: '', peRatio: 0, assetsPercentage: 0 }],
            topDebtHoldings: actualResult.data.topDebtHoldings?.length > 0 
              ? actualResult.data.topDebtHoldings 
              : [{ companyName: '', instrument: '', creditRating: '', assetsPercentage: 0 }],
            fundInfo: actualResult.data.fundInfo || { nameOfAMC: '', address: '', phone: '', fax: '', email: '', website: '' },
            actualFundManagers: actualResult.data.actualFundManagers?.length > 0 
              ? actualResult.data.actualFundManagers 
              : [{ name: '', since: '', experience: '', education: '', fundsManaged: [''] }]
          };
          setFormData(loadedData);
        }
      } catch (authError) {
        // Handle authentication errors gracefully
        console.warn('Could not fetch existing fund details (may not exist or auth required):', authError);
      }
    } catch (error) {
      console.error('Error fetching fund data:', error);
      setError('Failed to load fund data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFundManagers = async () => {
    try {
      const result = await ApiClient.get('/admin/fund-managers?isActive=true&limit=100');
      
      if (result.success) {
        setAvailableFundManagers(result.data.fundManagers || []);
      }
    } catch (error) {
      console.error('Error fetching fund managers:', error);
      // Don't show error for this as it's not critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Filter and clean data for API
      const cleanedData = {
        schemeCode: formData.schemeCode,
        schemeName: formData.schemeName,
        fundHouse: formData.fundHouse,
        assetAllocation: formData.assetAllocation,
        portfolioAggregates: formData.portfolioAggregates,
        creditRating: formData.creditRating,
        sectorWiseHoldings: formData.sectorWiseHoldings.filter(s => s.sector.trim() && s.fundPercentage > 0),
        topEquityHoldings: formData.topEquityHoldings.filter(h => h.companyName.trim() && h.assetsPercentage > 0),
        topDebtHoldings: formData.topDebtHoldings.filter(h => h.companyName.trim() && h.assetsPercentage > 0),
        launchDate: formData.launchDate,
        riskometer: formData.riskometer,
        expense: formData.expense,
        exitLoad: formData.exitLoad,
        openEnded: formData.openEnded,
        lockInPeriod: formData.lockInPeriod,
        fundInfo: formData.fundInfo,
        actualFundManagers: formData.actualFundManagers.filter(m => m.name.trim()),
        dataSource: formData.dataSource,
        dataQuality: formData.dataQuality,
        notes: formData.notes
      };

      console.log('🚀 Sending form data to API:', {
        hasAssetAllocation: !!cleanedData.assetAllocation,
        hasPortfolioAggregates: !!cleanedData.portfolioAggregates,
        hasCreditRating: !!cleanedData.creditRating,
        hasFundInfo: !!cleanedData.fundInfo,
        assetAllocation: cleanedData.assetAllocation,
        portfolioAggregates: cleanedData.portfolioAggregates
      });

      const result = await ApiClient.post(`/admin/fund-details/${schemeCode}`, cleanedData);
      
      if (result.success) {
        setSuccess('Fund data saved successfully!');
        setHasUnsavedChanges(false); // Reset unsaved changes flag
        // Removed automatic redirect - stay on the form page
      } else {
        setError(result.error || 'Failed to save data');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addFundManager = () => {
    setFormData(prev => ({
      ...prev,
      actualFundManagers: [...prev.actualFundManagers, { name: '', since: '', experience: '', education: '', fundsManaged: [''] }]
    }));
  };

  const removeFundManager = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actualFundManagers: prev.actualFundManagers.filter((_, i) => i !== index)
    }));
  };

  const updateFundManager = (index: number, field: keyof ActualFundManager, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      actualFundManagers: prev.actualFundManagers.map((manager, i) => 
        i === index ? { ...manager, [field]: value } : manager
      )
    }));
  };

  const addFundManaged = (managerIndex: number) => {
    setFormData(prev => ({
      ...prev,
      actualFundManagers: prev.actualFundManagers.map((manager, i) => 
        i === managerIndex ? { ...manager, fundsManaged: [...manager.fundsManaged, ''] } : manager
      )
    }));
  };

  const removeFundManaged = (managerIndex: number, fundIndex: number) => {
    setFormData(prev => ({
      ...prev,
      actualFundManagers: prev.actualFundManagers.map((manager, i) => 
        i === managerIndex 
          ? { ...manager, fundsManaged: manager.fundsManaged.filter((_, fIndex) => fIndex !== fundIndex) }
          : manager
      )
    }));
  };

  const updateFundManaged = (managerIndex: number, fundIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      actualFundManagers: prev.actualFundManagers.map((manager, i) => 
        i === managerIndex 
          ? { ...manager, fundsManaged: manager.fundsManaged.map((fund, fIndex) => fIndex === fundIndex ? value : fund) }
          : manager
      )
    }));
  };

  const selectFundManager = (managerIndex: number, selectedManagerId: string) => {
    const selectedManager = availableFundManagers.find(manager => manager._id === selectedManagerId);
    
    if (selectedManager) {
      setFormData(prev => ({
        ...prev,
        actualFundManagers: prev.actualFundManagers.map((manager, i) => 
          i === managerIndex 
            ? { 
                name: selectedManager.name,
                since: manager.since, // Keep existing since value
                experience: selectedManager.experience,
                education: selectedManager.education,
                fundsManaged: selectedManager.fundsManaged || ['']
              }
            : manager
        )
      }));
    }
  };

  const addSectorWiseHolding = () => {
    setFormData(prev => ({
      ...prev,
      sectorWiseHoldings: [...prev.sectorWiseHoldings, { sector: '', fundPercentage: 0, categoryPercentage: 0 }]
    }));
  };

  const removeSectorWiseHolding = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sectorWiseHoldings: prev.sectorWiseHoldings.filter((_, i) => i !== index)
    }));
  };

  const updateSectorWiseHolding = (index: number, field: keyof SectorWiseHolding, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sectorWiseHoldings: prev.sectorWiseHoldings.map((holding, i) => 
        i === index ? { ...holding, [field]: value } : holding
      )
    }));
  };

  const addTopEquityHolding = () => {
    setFormData(prev => ({
      ...prev,
      topEquityHoldings: [...prev.topEquityHoldings, { companyName: '', sector: '', peRatio: 0, assetsPercentage: 0 }]
    }));
  };

  const removeTopEquityHolding = (index: number) => {
    setFormData(prev => ({
      ...prev,
      topEquityHoldings: prev.topEquityHoldings.filter((_, i) => i !== index)
    }));
  };

  const updateTopEquityHolding = (index: number, field: keyof TopEquityHolding, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      topEquityHoldings: prev.topEquityHoldings.map((holding, i) => 
        i === index ? { ...holding, [field]: value } : holding
      )
    }));
  };

  const addTopDebtHolding = () => {
    setFormData(prev => ({
      ...prev,
      topDebtHoldings: [...prev.topDebtHoldings, { companyName: '', instrument: '', creditRating: '', assetsPercentage: 0 }]
    }));
  };

  const removeTopDebtHolding = (index: number) => {
    setFormData(prev => ({
      ...prev,
      topDebtHoldings: prev.topDebtHoldings.filter((_, i) => i !== index)
    }));
  };

  const updateTopDebtHolding = (index: number, field: keyof TopDebtHolding, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      topDebtHoldings: prev.topDebtHoldings.map((holding, i) => 
        i === index ? { ...holding, [field]: value } : holding
      )
    }));
  };

  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowExitModal(true);
    } else {
      router.push(path);
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      if (pendingNavigation === '/login') {
        // Handle logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        router.push(pendingNavigation);
      }
    }
    setShowExitModal(false);
    setPendingNavigation(null);
  };

  const cancelNavigation = () => {
    setShowExitModal(false);
    setPendingNavigation(null);
  };

  const toggleSection = (sectionKey: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Collapsible Section Component - Memoized to prevent unnecessary re-renders
  const CollapsibleSection = React.memo<{
    title: string;
    sectionKey: keyof typeof collapsedSections;
    children: React.ReactNode;
    className?: string;
  }>(({ title, sectionKey, children, className = "" }) => {
    const isCollapsed = collapsedSections[sectionKey];
    
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="flex justify-between items-center p-6">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={() => toggleSection(sectionKey)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                isCollapsed ? '-rotate-90' : 'rotate-0'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
        <div className={`px-6 pb-6 ${isCollapsed ? 'hidden' : ''}`}>
          {children}
        </div>
      </div>
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout currentPage="funds">
      <div className="p-6">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Fund Data Entry</h2>
          <p className="text-gray-600 mt-1">Manage detailed fund information for scheme: <span className="font-mono text-blue-600">{schemeCode}</span></p>
        </div>
        {/* Fund Info Card */}
        {fundBasic && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Fund Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Scheme Code</label>
                <p className="text-sm text-gray-900 font-mono">{fundBasic.schemeCode}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fund House</label>
                <p className="text-sm text-gray-900">{fundBasic.fundHouse}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <p className="text-sm text-gray-900">{fundBasic.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current NAV</label>
                <p className="text-sm text-gray-900 font-bold text-blue-600">
                  {fundBasic.currentNav ? `₹${fundBasic.currentNav.toFixed(4)}` : 'Not Available'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Scheme Name</label>
              <p className="text-sm text-gray-900">{fundBasic.schemeName}</p>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Asset Allocation Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Allocation (%)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equity</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.assetAllocation?.equity || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    assetAllocation: { ...(prev.assetAllocation || {}), equity: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Debt</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.assetAllocation?.debt || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    assetAllocation: { ...(prev.assetAllocation || {}), debt: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cash and Cash Equivalent</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.assetAllocation?.cashAndCashEq || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    assetAllocation: { ...(prev.assetAllocation || {}), cashAndCashEq: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Portfolio Aggregates Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Aggregates (%)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giant</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.portfolioAggregates?.giant || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...(prev.portfolioAggregates || {}), giant: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Large</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.portfolioAggregates?.large || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...(prev.portfolioAggregates || {}), large: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mid</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.portfolioAggregates?.mid || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...(prev.portfolioAggregates || {}), mid: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Small</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.portfolioAggregates?.small || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...(prev.portfolioAggregates || {}), small: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiny</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.portfolioAggregates?.tiny || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...(prev.portfolioAggregates || {}), tiny: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avg Market Cap</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.portfolioAggregates?.avgMarketCap || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...(prev.portfolioAggregates || {}), avgMarketCap: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Credit Rating Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Credit Rating (%)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AAA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.creditRating?.aaa || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    creditRating: { ...(prev.creditRating || {}), aaa: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sov.</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.creditRating?.sov || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    creditRating: { ...(prev.creditRating || {}), sov: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cash Equivalent</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.creditRating?.cashEquivalent || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    creditRating: { ...(prev.creditRating || {}), cashEquivalent: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.creditRating?.aa || 0}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    creditRating: { ...(prev.creditRating || {}), aa: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Sector Wise Holdings Section */}
          <CollapsibleSection title="Sector Wise Holdings" sectionKey="sectorWiseHoldings">
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <button
                type="button"
                onClick={addSectorWiseHolding}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
              >
                <span className="mr-1">+</span> Add Holding
              </button>
            </div>
            
            {formData.sectorWiseHoldings.map((holding, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={holding.sector}
                    onChange={(e) => updateSectorWiseHolding(index, 'sector', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fund (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={holding.fundPercentage}
                    onChange={(e) => updateSectorWiseHolding(index, 'fundPercentage', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={holding.categoryPercentage}
                    onChange={(e) => updateSectorWiseHolding(index, 'categoryPercentage', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end">
                  {formData.sectorWiseHoldings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSectorWiseHolding(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CollapsibleSection>

          {/* Top Equity Holdings Section */}
          <CollapsibleSection title="Top Equity Holdings" sectionKey="topEquityHoldings">
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <button
                type="button"
                onClick={addTopEquityHolding}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
              >
                <span className="mr-1">+</span> Add Holding
              </button>
            </div>
            
            {formData.topEquityHoldings.map((holding, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={holding.companyName}
                    onChange={(e) => updateTopEquityHolding(index, 'companyName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={holding.sector}
                    onChange={(e) => updateTopEquityHolding(index, 'sector', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">P/E Ratio</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={holding.peRatio}
                    onChange={(e) => updateTopEquityHolding(index, 'peRatio', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">% Assets</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={holding.assetsPercentage}
                    onChange={(e) => updateTopEquityHolding(index, 'assetsPercentage', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end">
                  {formData.topEquityHoldings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTopEquityHolding(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CollapsibleSection>

          {/* Top Debt Holdings Section */}
          <CollapsibleSection title="Top Debt Holdings" sectionKey="topDebtHoldings">
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <button
                type="button"
                onClick={addTopDebtHolding}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
              >
                <span className="mr-1">+</span> Add Holding
              </button>
            </div>
            
            {formData.topDebtHoldings.map((holding, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={holding.companyName}
                    onChange={(e) => updateTopDebtHolding(index, 'companyName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instrument</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={holding.instrument}
                    onChange={(e) => updateTopDebtHolding(index, 'instrument', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Rating</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={holding.creditRating}
                    onChange={(e) => updateTopDebtHolding(index, 'creditRating', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">% Assets</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={holding.assetsPercentage}
                    onChange={(e) => updateTopDebtHolding(index, 'assetsPercentage', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end">
                  {formData.topDebtHoldings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTopDebtHolding(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CollapsibleSection>

          {/* Fund Details Section */}
          <CollapsibleSection title="Fund Details" sectionKey="fundDetails">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Launch Date</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.launchDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, launchDate: e.target.value }))}
                  placeholder="e.g., January 15, 2020 or 15-01-2020"
                />
              </div>
              <CustomSelect
                label="Riskometer"
                value={formData.riskometer}
                onValueChange={(value) => setFormData(prev => ({ ...prev, riskometer: value }))}
                options={[
                  { value: 'Not Selected', label: 'Select Risk Level' },
                  { value: 'Low', label: 'Low' },
                  { value: 'Low to Moderate', label: 'Low to Moderate' },
                  { value: 'Moderate', label: 'Moderate' },
                  { value: 'Moderately High', label: 'Moderately High' },
                  { value: 'High', label: 'High' },
                  { value: 'Very High', label: 'Very High' }
                ]}
                placeholder="Select Risk Level"
                triggerClassName="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.expense}
                  onChange={(e) => setFormData(prev => ({ ...prev, expense: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exit Load</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.exitLoad}
                  onChange={(e) => setFormData(prev => ({ ...prev, exitLoad: e.target.value }))}
                  placeholder="e.g., 1% if redeemed before 365 days"
                />
              </div>
              <CustomSelect
                label="Open-ended"
                value={formData.openEnded ? 'true' : 'false'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, openEnded: value === 'true' }))}
                options={[
                  { value: 'true', label: 'Yes (Open-ended)' },
                  { value: 'false', label: 'No (Close-ended)' }
                ]}
                placeholder="Select fund type"
                triggerClassName="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lock-in Period</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.lockInPeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, lockInPeriod: e.target.value }))}
                  placeholder="e.g., 3 years, NIL, 15 days"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Fund Info Section */}
          <CollapsibleSection title="Fund Info" sectionKey="fundInfo">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name of AMC</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.fundInfo.nameOfAMC}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fundInfo: { ...prev.fundInfo, nameOfAMC: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.fundInfo.phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fundInfo: { ...prev.fundInfo, phone: e.target.value }
                  }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.fundInfo.address}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fundInfo: { ...prev.fundInfo, address: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.fundInfo.fax}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fundInfo: { ...prev.fundInfo, fax: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.fundInfo.email}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fundInfo: { ...prev.fundInfo, email: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.fundInfo.website}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fundInfo: { ...prev.fundInfo, website: e.target.value }
                  }))}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Fund Managers Section */}
          <CollapsibleSection title="Fund Managers" sectionKey="fundManagers">
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <button
                type="button"
                onClick={addFundManager}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
              >
                <span className="mr-1">+</span> Add Manager
              </button>
            </div>
            
            {formData.actualFundManagers.map((manager, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg mb-4">
                {/* Fund Manager Selection Dropdown */}
                {availableFundManagers.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      🔽 Quick Select from Existing Fund Managers
                    </label>
                    <CustomSelect
                      value="placeholder"
                      onValueChange={(value) => {
                        if (value !== 'placeholder') {
                          selectFundManager(index, value);
                        }
                      }}
                      options={[
                        { value: 'placeholder', label: 'Choose a fund manager to auto-fill details...' },
                        ...availableFundManagers.map(manager => ({
                          value: manager._id,
                          label: `${manager.name} (${manager.experience ? manager.experience.substring(0, 50) + '...' : 'No experience listed'})`
                        }))
                      ]}
                      placeholder="Select fund manager"
                      triggerClassName="w-full px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
                      contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      ✨ Selecting a fund manager will auto-fill name, experience, education, and managed funds below
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      value={manager.name}
                      onChange={(e) => updateFundManager(index, 'name', e.target.value)}
                      placeholder="Enter fund manager name or select from above"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Since</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      value={manager.since}
                      onChange={(e) => updateFundManager(index, 'since', e.target.value)}
                      placeholder="e.g., Jan 2020, 2019, March 2021"
                    />
                  </div>
                  <div className="flex items-end">
                    {formData.actualFundManagers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFundManager(index)}
                        className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                      >
                        Remove Manager
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={manager.education}
                    onChange={(e) => updateFundManager(index, 'education', e.target.value)}
                    placeholder="Educational qualifications, degrees, certifications..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={manager.experience}
                    onChange={(e) => updateFundManager(index, 'experience', e.target.value)}
                    placeholder="Describe the fund manager's experience in detail..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Funds Managed</label>
                    <button
                      type="button"
                      onClick={() => addFundManaged(index)}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex items-center"
                    >
                      <span className="mr-1">+</span> Add Fund
                    </button>
                  </div>
                  
                  {manager?.fundsManaged?.map((fund, fundIndex) => (
                    <div key={fundIndex} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={fund}
                        onChange={(e) => updateFundManaged(index, fundIndex, e.target.value)}
                        placeholder="Fund name"
                      />
                      {manager.fundsManaged.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFundManaged(index, fundIndex)}
                          className="bg-red-600 text-white px-2 py-2 rounded text-xs hover:bg-red-700"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CollapsibleSection>


          {/* Metadata Section */}
          <CollapsibleSection title="Data Quality & Source" sectionKey="dataQualitySource">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomSelect
                label="Data Source *"
                value={formData.dataSource}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dataSource: value }))}
                options={[
                  { value: 'Official Fund Factsheet', label: 'Official Fund Factsheet' },
                  { value: 'Value Research', label: 'Value Research' },
                  { value: 'Morningstar', label: 'Morningstar' },
                  { value: 'AMC Website', label: 'AMC Website' },
                  { value: 'Moneycontrol', label: 'Moneycontrol' },
                  { value: 'Economic Times', label: 'Economic Times' },
                  { value: 'FUND_HOUSE_OFFICIAL', label: 'Fund House Official' },
                  { value: 'VERIFIED_API', label: 'Verified API' },
                  { value: 'MANUAL_ENTRY', label: 'Manual Entry' },
                  { value: 'Other', label: 'Other' }
                ]}
                placeholder="Select data source"
                triggerClassName="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
                required
              />
              <CustomSelect
                label="Data Quality"
                value={formData.dataQuality}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dataQuality: value as any }))}
                options={[
                  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                  { value: 'GOOD', label: 'Good' },
                  { value: 'EXCELLENT', label: 'Excellent' },
                  { value: 'VERIFIED', label: 'Verified' }
                ]}
                placeholder="Select data quality"
                triggerClassName="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                contentClassName="bg-white border border-gray-200 rounded-lg shadow-lg"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes about the data entry..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </CollapsibleSection>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => handleNavigation('/admin/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Fund Data'}
            </button>
          </div>
        </form>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L4.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Unsaved Changes</h3>
              <p className="text-sm text-gray-500 mb-6 text-center">
                You have unsaved changes that will be lost if you leave this page. Are you sure you want to continue?
              </p>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={cancelNavigation}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Stay on Page
                </button>
                <button
                  type="button"
                  onClick={confirmNavigation}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Leave Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
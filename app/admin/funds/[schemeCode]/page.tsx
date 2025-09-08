'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';

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
    riskometer: '',
    expense: 0,
    exitLoad: '',
    openEnded: true,
    lockInPeriod: 'N/A',
    fundInfo: { nameOfAMC: '', address: '', phone: '', fax: '', email: '', website: '' },
    actualFundManagers: [{ name: '', since: '', experience: '', education: '', fundsManaged: [''] }],
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
      riskometer: '',
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
      const token = localStorage.getItem('authToken');

      // Fetch basic fund info
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

      // Try to fetch existing actual data
      const actualResponse = await fetch(`/api/admin/fund-details/${schemeCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (actualResponse.ok) {
        const actualResult = await actualResponse.json();
        if (actualResult.success && actualResult.data) {
          setFormData(actualResult.data);
        }
      }
    } catch (error) {
      console.error('Error fetching fund data:', error);
      setError('Failed to load fund data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("SAdaddsad vinay",)
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      
      // Filter out empty holdings and sectors
      const cleanedData = {
        ...formData,
        actualTopHoldings: formData.actualTopHoldings.filter(h => h.name.trim() && h.percentage > 0),
        actualSectorAllocation: formData.actualSectorAllocation.filter(s => s.sector.trim() && s.percentage > 0),
        actualFundManagers: formData.actualFundManagers.filter(m => m.name.trim())
      };

      const response = await fetch(`/api/admin/fund-details/${schemeCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Fund data saved successfully!');
        setHasUnsavedChanges(false); // Reset unsaved changes flag
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Failed to save data');
      }
    } catch (error) {
      setError('Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addFundManager = () => {
    setFormData(prev => ({
      ...prev,
      actualFundManagers: [...prev.actualFundManagers, { name: '', experience: 0, background: '' }]
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
                  value={formData.assetAllocation.equity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    assetAllocation: { ...prev.assetAllocation, equity: parseFloat(e.target.value) || 0 }
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
                  value={formData.assetAllocation.debt}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    assetAllocation: { ...prev.assetAllocation, debt: parseFloat(e.target.value) || 0 }
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
                  value={formData.assetAllocation.cashAndCashEq}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    assetAllocation: { ...prev.assetAllocation, cashAndCashEq: parseFloat(e.target.value) || 0 }
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
                  value={formData.portfolioAggregates.giant}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...prev.portfolioAggregates, giant: parseFloat(e.target.value) || 0 }
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
                  value={formData.portfolioAggregates.large}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...prev.portfolioAggregates, large: parseFloat(e.target.value) || 0 }
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
                  value={formData.portfolioAggregates.mid}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...prev.portfolioAggregates, mid: parseFloat(e.target.value) || 0 }
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
                  value={formData.portfolioAggregates.small}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...prev.portfolioAggregates, small: parseFloat(e.target.value) || 0 }
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
                  value={formData.portfolioAggregates.tiny}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...prev.portfolioAggregates, tiny: parseFloat(e.target.value) || 0 }
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
                  value={formData.portfolioAggregates.avgMarketCap}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    portfolioAggregates: { ...prev.portfolioAggregates, avgMarketCap: parseFloat(e.target.value) || 0 }
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
                  value={formData.creditRating.aaa}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    creditRating: { ...prev.creditRating, aaa: parseFloat(e.target.value) || 0 }
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
                  value={formData.creditRating.sov}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    creditRating: { ...prev.creditRating, sov: parseFloat(e.target.value) || 0 }
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
                  value={formData.creditRating.cashEquivalent}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    creditRating: { ...prev.creditRating, cashEquivalent: parseFloat(e.target.value) || 0 }
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
                  value={formData.creditRating.aa}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    creditRating: { ...prev.creditRating, aa: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Sector Wise Holdings Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Sector Wise Holdings</h3>
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
          </div>

          {/* Top Equity Holdings Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Top Equity Holdings</h3>
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
          </div>

          {/* Top Debt Holdings Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Top Debt Holdings</h3>
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
          </div>

          {/* Fund Details Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Details</h3>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Riskometer</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.riskometer}
                  onChange={(e) => setFormData(prev => ({ ...prev, riskometer: e.target.value }))}
                >
                  <option value="">Select Risk Level</option>
                  <option value="Low">Low</option>
                  <option value="Low to Moderate">Low to Moderate</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Moderately High">Moderately High</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
              </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Open-ended</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.openEnded ? 'true' : 'false'}
                  onChange={(e) => setFormData(prev => ({ ...prev, openEnded: e.target.value === 'true' }))}
                >
                  <option value="true">Yes (Open-ended)</option>
                  <option value="false">No (Close-ended)</option>
                </select>
              </div>
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
          </div>

          {/* Fund Info Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Info</h3>
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
          </div>

          {/* Fund Managers Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Fund Managers</h3>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      value={manager.name}
                      onChange={(e) => updateFundManager(index, 'name', e.target.value)}
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
          </div>


          {/* Metadata Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data Quality & Source</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Source *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Official Fund Factsheet, Value Research, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.dataSource}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataSource: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Quality</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.dataQuality}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataQuality: e.target.value as any }))}
                >
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="GOOD">Good</option>
                  <option value="EXCELLENT">Excellent</option>
                  <option value="VERIFIED">Verified</option>
                </select>
              </div>
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
          </div>

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
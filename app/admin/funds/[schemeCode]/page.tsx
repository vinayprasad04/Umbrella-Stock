'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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
}

interface ActualFundManager {
  name: string;
  experience: number;
  background: string;
}

interface ActualHolding {
  name: string;
  percentage: number;
  sector: string;
}

interface ActualSectorAllocation {
  sector: string;
  percentage: number;
}

interface ActualMutualFundDetails {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  actualFundManagers: ActualFundManager[];
  actualTopHoldings: ActualHolding[];
  actualSectorAllocation: ActualSectorAllocation[];
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
    actualFundManagers: [{ name: '', experience: 0, background: '' }],
    actualTopHoldings: Array(10).fill(null).map(() => ({ name: '', percentage: 0, sector: '' })),
    actualSectorAllocation: Array(8).fill(null).map(() => ({ sector: '', percentage: 0 })),
    dataSource: '',
    dataQuality: 'PENDING_VERIFICATION',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          category: basicResult.data.category
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

  const updateFundManager = (index: number, field: keyof ActualFundManager, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      actualFundManagers: prev.actualFundManagers.map((manager, i) => 
        i === index ? { ...manager, [field]: value } : manager
      )
    }));
  };

  const updateHolding = (index: number, field: keyof ActualHolding, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      actualTopHoldings: prev.actualTopHoldings.map((holding, i) => 
        i === index ? { ...holding, [field]: value } : holding
      )
    }));
  };

  const updateSectorAllocation = (index: number, field: keyof ActualSectorAllocation, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      actualSectorAllocation: prev.actualSectorAllocation.map((sector, i) => 
        i === index ? { ...sector, [field]: value } : sector
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Fund Data Entry</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.name} ({user?.role})
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fund Info Card */}
        {fundBasic && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Fund Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          {/* Fund Managers Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Fund Managers</h3>
              <button
                type="button"
                onClick={addFundManager}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Add Manager
              </button>
            </div>
            
            {formData.actualFundManagers.map((manager, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={manager.experience}
                    onChange={(e) => updateFundManager(index, 'experience', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={manager.background}
                    onChange={(e) => updateFundManager(index, 'background', e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  {formData.actualFundManagers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFundManager(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Top Holdings Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Holdings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.actualTopHoldings.map((holding, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Holding #{index + 1}</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={holding.name}
                        onChange={(e) => updateHolding(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={holding.percentage}
                        onChange={(e) => updateHolding(index, 'percentage', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={holding.sector}
                        onChange={(e) => updateHolding(index, 'sector', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Allocation Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sector Allocation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.actualSectorAllocation.map((sector, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Sector #{index + 1}</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sector Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={sector.sector}
                        onChange={(e) => updateSectorAllocation(index, 'sector', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={sector.percentage}
                        onChange={(e) => updateSectorAllocation(index, 'percentage', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            <Link
              href="/admin/dashboard"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
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
    </div>
  );
}
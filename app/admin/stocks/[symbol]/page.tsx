'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import { ApiClient } from '@/lib/apiClient';

interface EquityStock {
  symbol: string;
  companyName: string;
  series: string;
  dateOfListing: string;
  isinNumber: string;
  faceValue: number;
  paidUpValue: number;
  marketLot: number;
}

interface ActualStockData {
  symbol: string;
  dataQuality: string;
  description?: string;
  website?: string;
  sector?: string;
  industry?: string;
  managementTeam?: string[];
}

interface ParsedStockDetail {
  symbol: string;
  companyName: string;
  meta?: {
    faceValue: number;
    currentPrice: number;
    marketCapitalization: number;
    numberOfShares?: number;
  };
  profitAndLoss?: any;
  quarterlyData?: any;
  balanceSheet?: any;
  cashFlow?: any;
  priceData?: any[];
  sheetData?: {
    sheetName: string;
    headers: string[];
    rows: any[][];
    range: string;
    totalRows: number;
  }[];
  additionalInfo?: {
    description?: string;
    website?: string;
    sector?: string;
    industry?: string;
    managementTeam?: string[];
  };
  uploadedFiles?: any[];
}

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'excel' | 'pdf' | 'csv';
}

export default function StockEditPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params?.symbol as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stock, setStock] = useState<EquityStock | null>(null);
  const [actualData, setActualData] = useState<ActualStockData | null>(null);
  const [parsedStockDetail, setParsedStockDetail] = useState<ParsedStockDetail | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ActualStockData>({
    symbol: '',
    dataQuality: 'PENDING_VERIFICATION',
    description: '',
    website: '',
    sector: '',
    industry: '',
    managementTeam: []
  });

  // Ratios state
  const [ratiosJson, setRatiosJson] = useState('');
  const [parsedRatios, setParsedRatios] = useState<any>(null);
  const [savedRatios, setSavedRatios] = useState<any>(null);
  const [ratiosError, setRatiosError] = useState('');
  const [savingRatios, setSavingRatios] = useState(false);
  const [isEditingRatios, setIsEditingRatios] = useState(false);


  useEffect(() => {
    if (symbol) {
      fetchStockData();
    }
  }, [symbol]);

  const fetchStockData = async () => {
    try {
      const response = await ApiClient.get(`/admin/stock-details/${symbol}`);
      if (response.success) {
        setStock(response.data.stock);

        // Handle new parsed stock detail data
        if (response.data.parsedStockDetail) {
          setParsedStockDetail(response.data.parsedStockDetail);

          // Set form data with additionalInfo if available
          const additionalInfo = response.data.parsedStockDetail.additionalInfo || {};
          setFormData({
            symbol,
            dataQuality: response.data.parsedStockDetail.dataQuality || 'PENDING_VERIFICATION',
            description: additionalInfo.description || '',
            website: additionalInfo.website || '',
            sector: additionalInfo.sector || '',
            industry: additionalInfo.industry || '',
            managementTeam: additionalInfo.managementTeam || []
          });

          // Load existing ratios if available
          if (response.data.parsedStockDetail.ratios) {
            setSavedRatios(response.data.parsedStockDetail.ratios);
          }

          setIsEdit(true);
        }
        // Handle old format data if exists
        else if (response.data.actualData) {
          setActualData(response.data.actualData);
          setFormData(response.data.actualData);
          setIsEdit(true);
        } else {
          setFormData(prev => ({ ...prev, symbol }));
        }
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManagementTeamChange = (index: number, value: string) => {
    const newTeam = [...(formData.managementTeam || [])];
    newTeam[index] = value;
    setFormData(prev => ({ ...prev, managementTeam: newTeam }));
  };

  const addManagementTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      managementTeam: [...(prev.managementTeam || []), '']
    }));
  };

  const removeManagementTeamMember = (index: number) => {
    const newTeam = [...(formData.managementTeam || [])];
    newTeam.splice(index, 1);
    setFormData(prev => ({ ...prev, managementTeam: newTeam }));
  };

  // Ratios handling functions
  const handleRatiosJsonChange = (value: string) => {
    setRatiosJson(value);
    setRatiosError('');

    if (value.trim()) {
      try {
        const parsed = JSON.parse(value);
        setParsedRatios(parsed);
        setRatiosError('');
      } catch (error) {
        setParsedRatios(null);
        setRatiosError('Invalid JSON format');
      }
    } else {
      setParsedRatios(null);
    }
  };

  const handleSaveRatios = async () => {
    if (!parsedRatios) {
      setRatiosError('Please provide valid JSON data');
      return;
    }

    setSavingRatios(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/stock-details/${symbol}/ratios`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ratios: parsedRatios })
      });

      const result = await response.json();

      if (result.success) {
        alert('Ratios saved successfully!');
        setSavedRatios(parsedRatios);
        setRatiosJson('');
        setParsedRatios(null);
        setIsEditingRatios(false);
        // Refresh the stock data to show the updated ratios
        await fetchStockData();
      } else {
        setRatiosError(result.error || 'Failed to save ratios');
      }
    } catch (error) {
      console.error('Error saving ratios:', error);
      setRatiosError('Failed to save ratios. Please try again.');
    } finally {
      setSavingRatios(false);
    }
  };

  const handleEditRatios = () => {
    setIsEditingRatios(true);
    setRatiosJson(JSON.stringify(savedRatios, null, 2));
    setParsedRatios(savedRatios);
    setRatiosError('');
  };

  const handleCancelEditRatios = () => {
    setIsEditingRatios(false);
    setRatiosJson('');
    setParsedRatios(null);
    setRatiosError('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const validFiles: UploadedFile[] = [];

    files.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let fileType: 'excel' | 'pdf' | 'csv' | null = null;

      if (extension === 'xlsx' || extension === 'xls') {
        fileType = 'excel';
      } else if (extension === 'pdf') {
        fileType = 'pdf';
      } else if (extension === 'csv') {
        fileType = 'csv';
      }

      if (fileType) {
        const uploadedFile: UploadedFile = {
          file,
          type: fileType
        };

        // Create preview for images or text files
        if (file.type.startsWith('image/')) {
          uploadedFile.preview = URL.createObjectURL(file);
        }

        validFiles.push(uploadedFile);
      }
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'excel':
        return '📊';
      case 'pdf':
        return '📄';
      case 'csv':
        return '📋';
      default:
        return '📎';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving stock data:', formData);
      console.log('Uploaded files:', uploadedFiles);

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add form fields
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('website', formData.website || '');
      formDataToSend.append('sector', formData.sector || '');
      formDataToSend.append('industry', formData.industry || '');
      formDataToSend.append('dataQuality', formData.dataQuality);

      // Add management team
      if (formData.managementTeam) {
        formData.managementTeam.forEach(member => {
          if (member.trim()) {
            formDataToSend.append('managementTeam', member);
          }
        });
      }


      // Add uploaded files
      uploadedFiles.forEach(uploadedFile => {
        formDataToSend.append('files', uploadedFile.file);
      });

      // Make API call
      const response = await fetch(`/api/admin/stock-details/${symbol}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        // Refresh the data without reloading the entire page
        await fetchStockData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('An error occurred while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExcelData = async () => {
    if (!confirm('Are you sure you want to delete all parsed Excel data and uploaded files? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`/api/admin/stock-details/${symbol}/delete-excel-data`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Clear the parsed data and uploaded files from state
          setParsedStockDetail(null);
          setUploadedFiles([]);
          alert('Excel data and files deleted successfully!');
        } else {
          alert(`Failed to delete data: ${result.error}`);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to delete data: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting Excel data:', error);
      alert('Failed to delete Excel data. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!stock) {
    return (
      <AdminDashboardLayout currentPage="stocks">
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Stock Not Found</h2>
            <p className="text-gray-600 mb-8">The stock with symbol "{symbol}" was not found.</p>
            <button
              onClick={() => router.back()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout currentPage="stocks">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEdit ? 'Edit' : 'Add'} Stock Data
              </h1>
              <p className="text-gray-600 mt-2">
                {stock.symbol} - {stock.companyName}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Back to List
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Stock Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Stock Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
                  <input
                    type="text"
                    value={stock.symbol}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={stock.companyName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ISIN Number</label>
                  <input
                    type="text"
                    value={stock.isinNumber}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Face Value</label>
                  <input
                    type="text"
                    value={`₹${stock.faceValue}`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Additional Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                    <input
                      type="text"
                      value={formData.sector || ''}
                      onChange={(e) => handleInputChange('sector', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Technology, Finance, Healthcare"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      value={formData.industry || ''}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Software Services, Banking"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://www.company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brief description of the company and its business..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Management Team</label>
                  <div className="space-y-2">
                    {(formData.managementTeam || []).map((member, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={member}
                          onChange={(e) => handleManagementTeamChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Name - Position"
                        />
                        <button
                          type="button"
                          onClick={() => removeManagementTeamMember(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addManagementTeamMember}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      + Add Management Team Member
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Ratios Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Stock Ratios</h3>

              {/* Display saved ratios when not editing */}
              {savedRatios && !isEditingRatios && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-800 mb-4 border-b border-gray-200 pb-2">Current Ratios</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(savedRatios).map(([key, value]) => (
                      <div key={key} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-600 font-medium">{key}</p>
                        <p className="text-lg font-bold text-indigo-600">
                          {typeof value === 'number' ?
                            (key.includes('(₹)') ? `₹${value}` :
                             key.includes('(%)') ? `${value}%` :
                             key.includes('(Cr)') ? `₹${value} Cr` : value) :
                            String(value)
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleEditRatios}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      ✏️ Edit Ratios
                    </button>
                  </div>
                </div>
              )}

              {/* JSON Input for Ratios - shown when no saved ratios OR when editing */}
              {(!savedRatios || isEditingRatios) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isEditingRatios ? 'Edit Stock Ratios JSON' : 'Paste Stock Ratios JSON'}
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      {isEditingRatios ? 'Modify the JSON data below and save' : 'Paste your JSON data containing stock ratios and financial metrics'}
                    </p>
                    <textarea
                      value={ratiosJson}
                      onChange={(e) => handleRatiosJsonChange(e.target.value)}
                      placeholder={!isEditingRatios ? `Example:
{
  "Market Cap (Cr)": 812,
  "Current Price (₹)": 230,
  "Stock P/E": 13.0,
  "Book Value (₹)": 122,
  "Dividend Yield (%)": 0.53,
  "ROCE (%)": 19.2,
  "ROE (%)": 16.3,
  "Face Value (₹)": 5.0
}` : ''}
                      rows={12}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    />
                    {ratiosError && (
                      <p className="text-sm text-red-600 mt-2">❌ {ratiosError}</p>
                    )}
                  </div>

                  {/* Preview of parsed JSON - only show when there's new parsed data */}
                  {parsedRatios && ratiosJson && (
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-800 mb-2">✅ Preview of Parsed Data</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {Object.entries(parsedRatios).slice(0, 6).map(([key, value]) => (
                          <div key={key} className="text-green-700">
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                        {Object.keys(parsedRatios).length > 6 && (
                          <div className="text-green-600 italic">
                            +{Object.keys(parsedRatios).length - 6} more metrics...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveRatios}
                      disabled={!parsedRatios || savingRatios}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {savingRatios ? 'Saving...' : isEditingRatios ? '💾 Update Ratios' : '💾 Save Ratios'}
                    </button>
                    {isEditingRatios && (
                      <button
                        onClick={handleCancelEditRatios}
                        className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        ❌ Cancel
                      </button>
                    )}
                    {ratiosJson && !isEditingRatios && (
                      <button
                        onClick={() => {
                          setRatiosJson('');
                          setParsedRatios(null);
                          setRatiosError('');
                        }}
                        className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        🔄 Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Parsed Excel Data Display */}
            {parsedStockDetail && (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">📊 Parsed Excel Data</h3>
                    <button
                      onClick={handleDeleteExcelData}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDeleting ? 'Deleting...' : '🗑️ Delete Data & Files'}
                    </button>
                  </div>

                  {/* Meta Information */}
                  {parsedStockDetail.meta && (
                    <div className="mb-8">
                      <h4 className="text-md font-medium text-gray-800 mb-4 border-b border-gray-200 pb-2">📈 Company Overview</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Face Value</p>
                          <p className="text-lg font-semibold text-gray-900">₹{parsedStockDetail.meta.faceValue}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Current Price</p>
                          <p className="text-lg font-semibold text-gray-900">₹{parsedStockDetail.meta.currentPrice}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Market Cap</p>
                          <p className="text-lg font-semibold text-gray-900">₹{parsedStockDetail.meta.marketCapitalization.toLocaleString()} Cr</p>
                        </div>
                        {parsedStockDetail.meta.numberOfShares && (
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Number of Shares</p>
                            <p className="text-lg font-semibold text-gray-900">{parsedStockDetail.meta.numberOfShares.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Profit & Loss Data */}
                  {parsedStockDetail.profitAndLoss && (
                    <div className="mb-8">
                      <h4 className="text-md font-medium text-gray-800 mb-4 border-b border-gray-200 pb-2">💰 Profit & Loss (Latest 5 Years)</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                              {parsedStockDetail.profitAndLoss.sales.slice(-5).map((item: any) => (
                                <th key={item.year} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {item.year}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(parsedStockDetail.profitAndLoss).map(([key, values]: [string, any]) => {
                              if (!Array.isArray(values) || values.length === 0) return null;
                              const displayName = key.replace(/([A-Z])/g, ' $1').trim()
                                .replace('raw material cost', 'Raw Material Cost')
                                .replace('change in inventory', 'Change in Inventory')
                                .replace('power and fuel', 'Power and Fuel')
                                .replace('other mfr exp', 'Other Manufacturing Expenses')
                                .replace('employee cost', 'Employee Cost')
                                .replace('selling and admin', 'Selling & Administration')
                                .replace('other expenses', 'Other Expenses')
                                .replace('other income', 'Other Income')
                                .replace('profit before tax', 'Profit Before Tax')
                                .replace('net profit', 'Net Profit')
                                .replace('dividend amount', 'Dividend Amount');

                              return (
                                <tr key={key} className={key === 'sales' || key === 'netProfit' ? 'bg-blue-50' : ''}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                    {displayName}
                                  </td>
                                  {values.slice(-5).map((item: any) => (
                                    <td key={item.year} className={`px-6 py-4 whitespace-nowrap text-sm ${key === 'netProfit' ? 'text-green-600 font-semibold' : 'text-gray-900'}`}>
                                      {item.value ? `₹${item.value.toLocaleString()} Cr` : '-'}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Balance Sheet Data */}
                  {parsedStockDetail.balanceSheet && (
                    <div className="mb-8">
                      <h4 className="text-md font-medium text-gray-800 mb-4 border-b border-gray-200 pb-2">🏦 Balance Sheet (Latest 5 Years)</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                              {parsedStockDetail.balanceSheet.equityShareCapital.slice(-5).map((item: any) => (
                                <th key={item.year} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {item.year}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(parsedStockDetail.balanceSheet).map(([key, values]: [string, any]) => {
                              if (!Array.isArray(values) || values.length === 0) return null;
                              const displayName = key.replace(/([A-Z])/g, ' $1').trim()
                                .replace('equity share capital', 'Equity Share Capital')
                                .replace('other liabilities', 'Other Liabilities')
                                .replace('net block', 'Net Block')
                                .replace('capital work in progress', 'Capital Work in Progress')
                                .replace('other assets', 'Other Assets')
                                .replace('cash and bank', 'Cash & Bank')
                                .replace('number of equity shares', 'Number of Equity Shares')
                                .replace('new bonus shares', 'New Bonus Shares')
                                .replace('face value', 'Face Value')
                                .replace('adjusted equity shares', 'Adjusted Equity Shares');

                              // Highlight key metrics
                              const isKeyMetric = ['total', 'cashAndBank', 'numberOfEquityShares'].includes(key);

                              return (
                                <tr key={key} className={isKeyMetric ? 'bg-yellow-50' : ''}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                    {displayName}
                                  </td>
                                  {values.slice(-5).map((item: any) => (
                                    <td key={item.year} className={`px-6 py-4 whitespace-nowrap text-sm ${isKeyMetric ? 'text-blue-600 font-semibold' : 'text-gray-900'}`}>
                                      {key === 'numberOfEquityShares' || key === 'newBonusShares' ?
                                        (item.value ? item.value.toLocaleString() : '-') :
                                        (item.value ? `₹${item.value.toLocaleString()} Cr` : '-')
                                      }
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Cash Flow Data */}
                  {parsedStockDetail.cashFlow && (
                    <div className="mb-8">
                      <h4 className="text-md font-medium text-gray-800 mb-4 border-b border-gray-200 pb-2">💸 Cash Flow (Latest 5 Years)</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                              {parsedStockDetail.cashFlow.cashFromOperatingActivity.slice(-5).map((item: any) => (
                                <th key={item.year} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {item.year}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(parsedStockDetail.cashFlow).map(([key, values]: [string, any]) => {
                              if (!Array.isArray(values) || values.length === 0) return null;
                              return (
                                <tr key={key}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </td>
                                  {values.slice(-5).map((item: any) => (
                                    <td key={item.year} className={`px-6 py-4 whitespace-nowrap text-sm ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {item.value ? `₹${item.value.toLocaleString()} Cr` : '-'}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Quarterly Data */}
                  {parsedStockDetail.quarterlyData && parsedStockDetail.quarterlyData.sales?.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-md font-medium text-gray-800 mb-4 border-b border-gray-200 pb-2">📅 Quarterly Performance</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                              {parsedStockDetail.quarterlyData.sales.map((item: any) => (
                                <th key={item.quarter} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {item.quarter}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(parsedStockDetail.quarterlyData).map(([key, values]: [string, any]) => {
                              if (!Array.isArray(values) || values.length === 0) return null;
                              return (
                                <tr key={key}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </td>
                                  {values.map((item: any) => (
                                    <td key={item.quarter} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {item.value ? `₹${item.value.toLocaleString()} Cr` : '-'}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Price Data */}
                  {parsedStockDetail.priceData && parsedStockDetail.priceData.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-md font-medium text-gray-800 mb-4 border-b border-gray-200 pb-2">📈 Historical Prices</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {parsedStockDetail.priceData.slice(-10).map((item: any) => (
                          <div key={item.year} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 font-medium">{item.year}</p>
                            <p className="text-lg font-bold text-indigo-600">₹{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


                  {/* Raw Data Summary */}
                  <div className="mb-8">
                    <h4 className="text-md font-medium text-gray-800 mb-4 border-b border-gray-200 pb-2">📋 Data Summary by Categories</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <h5 className="font-semibold text-blue-800 mb-2">💰 Profit & Loss</h5>
                        <div className="text-sm text-blue-700">
                          {parsedStockDetail.profitAndLoss ? Object.keys(parsedStockDetail.profitAndLoss).filter(key =>
                            parsedStockDetail.profitAndLoss[key]?.length > 0
                          ).length : 0} metrics
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Sales, Expenses, Profit, Tax, etc.
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <h5 className="font-semibold text-green-800 mb-2">🏦 Balance Sheet</h5>
                        <div className="text-sm text-green-700">
                          {parsedStockDetail.balanceSheet ? Object.keys(parsedStockDetail.balanceSheet).filter(key =>
                            parsedStockDetail.balanceSheet[key]?.length > 0
                          ).length : 0} items
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Assets, Liabilities, Equity, etc.
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <h5 className="font-semibold text-purple-800 mb-2">💸 Cash Flow</h5>
                        <div className="text-sm text-purple-700">
                          {parsedStockDetail.cashFlow ? Object.keys(parsedStockDetail.cashFlow).filter(key =>
                            parsedStockDetail.cashFlow[key]?.length > 0
                          ).length : 0} activities
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                          Operating, Investing, Financing
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                        <h5 className="font-semibold text-orange-800 mb-2">📅 Quarterly Data</h5>
                        <div className="text-sm text-orange-700">
                          {parsedStockDetail.quarterlyData?.sales?.length || 0} quarters
                        </div>
                        <div className="text-xs text-orange-600 mt-1">
                          Recent quarterly performance
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Files */}
                  {parsedStockDetail.uploadedFiles && parsedStockDetail.uploadedFiles.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-800 mb-4 border-b border-gray-200 pb-2">📎 Uploaded Files</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parsedStockDetail.uploadedFiles.map((file: any, index: number) => (
                          <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-lg mr-3">
                              {file.fileType === 'excel' ? '📊' : file.fileType === 'pdf' ? '📄' : '📋'}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {(file.fileSize / 1024 / 1024).toFixed(2)} MB • {file.fileType.toUpperCase()} •
                                {new Date(file.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
              <select
                value={formData.dataQuality}
                onChange={(e) => handleInputChange('dataQuality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="VERIFIED">Verified</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
              </select>
            </div>

            {/* File Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h3>
              <p className="text-sm text-gray-600 mb-4">Upload Excel, PDF, or CSV files with stock data</p>

              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-purple-600 hover:text-purple-500">Click to upload</span>
                    {' '}or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">Excel (.xlsx, .xls), PDF (.pdf), or CSV (.csv)</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xlsx,.xls,.pdf,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Uploaded Files</h4>
                  {uploadedFiles.map((uploadedFile, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getFileIcon(uploadedFile.type)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{uploadedFile.file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB • {uploadedFile.type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-medium"
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `${isEdit ? 'Update' : 'Save'} Stock Data`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
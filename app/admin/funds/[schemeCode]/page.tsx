'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function FundDataEntry() {
  const params = useParams();
  const schemeCode = params?.schemeCode as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [schemeCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50/30 flex relative overflow-hidden">
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fund Data Entry</h1>
                <p className="text-sm text-gray-500">Manage mutual fund detailed information</p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <Link href="/admin/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Fund Data Entry</h1>
              <p className="text-gray-600 mt-1">Manage mutual fund detailed information for scheme: {schemeCode}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-gray-600">Fund data entry form will be implemented here for scheme code: <strong>{schemeCode}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
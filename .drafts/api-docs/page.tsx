'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';

interface APIEndpoint {
  method: string;
  endpoint: string;
  description: string;
  authRequired: boolean;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  response?: string;
}

export default function APIDocumentation() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedEndpoint, setExpandedEndpoint] = useState<number | null>(null);

  const categories = [
    { id: 'all', name: 'All Endpoints', icon: '📚' },
    { id: 'stocks', name: 'Stocks', icon: '📈' },
    { id: 'mutual-funds', name: 'Mutual Funds', icon: '💼' },
    { id: 'portfolio', name: 'Portfolio', icon: '📊' },
    { id: 'auth', name: 'Authentication', icon: '🔐' },
  ];

  const endpoints: (APIEndpoint & { category: string })[] = [
    // Authentication Endpoints
    {
      category: 'auth',
      method: 'POST',
      endpoint: '/api/auth/register',
      description: 'Register a new user account',
      authRequired: false,
      parameters: [
        { name: 'email', type: 'string', required: true, description: 'User email address' },
        { name: 'password', type: 'string', required: true, description: 'User password (min 8 characters)' },
        { name: 'name', type: 'string', required: true, description: 'User full name' },
      ],
      response: '{ "success": true, "user": { "id": "...", "email": "...", "name": "..." }, "token": "..." }',
    },
    {
      category: 'auth',
      method: 'POST',
      endpoint: '/api/auth/login',
      description: 'Authenticate user and receive JWT token',
      authRequired: false,
      parameters: [
        { name: 'email', type: 'string', required: true, description: 'User email address' },
        { name: 'password', type: 'string', required: true, description: 'User password' },
      ],
      response: '{ "success": true, "token": "...", "refreshToken": "..." }',
    },
    {
      category: 'auth',
      method: 'POST',
      endpoint: '/api/auth/logout',
      description: 'Logout user and invalidate tokens',
      authRequired: true,
      response: '{ "success": true, "message": "Logged out successfully" }',
    },
    {
      category: 'auth',
      method: 'POST',
      endpoint: '/api/auth/refresh',
      description: 'Refresh JWT token using refresh token',
      authRequired: false,
      parameters: [
        { name: 'refreshToken', type: 'string', required: true, description: 'Valid refresh token' },
      ],
      response: '{ "success": true, "token": "...", "refreshToken": "..." }',
    },

    // Stock Endpoints
    {
      category: 'stocks',
      method: 'GET',
      endpoint: '/api/stocks',
      description: 'Get list of all stocks with pagination and filtering',
      authRequired: false,
      parameters: [
        { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
        { name: 'limit', type: 'number', required: false, description: 'Items per page (default: 20)' },
        { name: 'search', type: 'string', required: false, description: 'Search by name or symbol' },
        { name: 'sector', type: 'string', required: false, description: 'Filter by sector' },
      ],
      response: '{ "stocks": [...], "total": 1234, "page": 1, "totalPages": 62 }',
    },
    {
      category: 'stocks',
      method: 'GET',
      endpoint: '/api/stocks/:symbol',
      description: 'Get detailed information about a specific stock',
      authRequired: false,
      parameters: [
        { name: 'symbol', type: 'string', required: true, description: 'Stock symbol (e.g., RELIANCE, TCS)' },
      ],
      response: '{ "symbol": "RELIANCE", "name": "...", "price": 2450.50, "change": 1.2, ... }',
    },
    {
      category: 'stocks',
      method: 'GET',
      endpoint: '/api/stocks/:symbol/historical',
      description: 'Get historical price data for a stock',
      authRequired: false,
      parameters: [
        { name: 'symbol', type: 'string', required: true, description: 'Stock symbol' },
        { name: 'period', type: 'string', required: false, description: '1d, 1w, 1m, 3m, 6m, 1y, 5y (default: 1m)' },
      ],
      response: '{ "symbol": "RELIANCE", "data": [{ "date": "2024-01-01", "open": 2400, "high": 2450, ... }] }',
    },

    // Mutual Fund Endpoints
    {
      category: 'mutual-funds',
      method: 'GET',
      endpoint: '/api/mutual-funds',
      description: 'Get list of mutual funds with filtering options',
      authRequired: false,
      parameters: [
        { name: 'page', type: 'number', required: false, description: 'Page number' },
        { name: 'limit', type: 'number', required: false, description: 'Items per page' },
        { name: 'category', type: 'string', required: false, description: 'Fund category (equity, debt, hybrid)' },
        { name: 'amc', type: 'string', required: false, description: 'Asset Management Company name' },
      ],
      response: '{ "funds": [...], "total": 5000, "page": 1, "totalPages": 250 }',
    },
    {
      category: 'mutual-funds',
      method: 'GET',
      endpoint: '/api/mutual-funds/:schemeCode',
      description: 'Get detailed information about a specific mutual fund',
      authRequired: false,
      parameters: [
        { name: 'schemeCode', type: 'string', required: true, description: 'Scheme code of the mutual fund' },
      ],
      response: '{ "schemeCode": "...", "name": "...", "nav": 245.50, "returns": { "1y": 12.5, "3y": 15.2 }, ... }',
    },
    {
      category: 'mutual-funds',
      method: 'GET',
      endpoint: '/api/mutual-funds/:schemeCode/nav-history',
      description: 'Get NAV history for a mutual fund',
      authRequired: false,
      parameters: [
        { name: 'schemeCode', type: 'string', required: true, description: 'Scheme code' },
        { name: 'from', type: 'string', required: false, description: 'Start date (YYYY-MM-DD)' },
        { name: 'to', type: 'string', required: false, description: 'End date (YYYY-MM-DD)' },
      ],
      response: '{ "schemeCode": "...", "history": [{ "date": "2024-01-01", "nav": 245.50 }] }',
    },

    // Portfolio Endpoints
    {
      category: 'portfolio',
      method: 'GET',
      endpoint: '/api/portfolio',
      description: 'Get user portfolio with all holdings',
      authRequired: true,
      response: '{ "stocks": [...], "mutualFunds": [...], "totalValue": 500000, "totalInvested": 450000, "gains": 50000 }',
    },
    {
      category: 'portfolio',
      method: 'POST',
      endpoint: '/api/portfolio/stocks',
      description: 'Add a stock to portfolio',
      authRequired: true,
      parameters: [
        { name: 'symbol', type: 'string', required: true, description: 'Stock symbol' },
        { name: 'quantity', type: 'number', required: true, description: 'Number of shares' },
        { name: 'buyPrice', type: 'number', required: true, description: 'Purchase price per share' },
        { name: 'buyDate', type: 'string', required: true, description: 'Purchase date (YYYY-MM-DD)' },
      ],
      response: '{ "success": true, "holding": { "id": "...", "symbol": "...", "quantity": 10, ... } }',
    },
    {
      category: 'portfolio',
      method: 'PUT',
      endpoint: '/api/portfolio/stocks/:id',
      description: 'Update a stock holding in portfolio',
      authRequired: true,
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Holding ID' },
        { name: 'quantity', type: 'number', required: false, description: 'Updated quantity' },
        { name: 'buyPrice', type: 'number', required: false, description: 'Updated buy price' },
      ],
      response: '{ "success": true, "holding": { ... } }',
    },
    {
      category: 'portfolio',
      method: 'DELETE',
      endpoint: '/api/portfolio/stocks/:id',
      description: 'Remove a stock from portfolio',
      authRequired: true,
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Holding ID' },
      ],
      response: '{ "success": true, "message": "Holding removed successfully" }',
    },
  ];

  const filteredEndpoints = selectedCategory === 'all'
    ? endpoints
    : endpoints.filter(e => e.category === selectedCategory);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500';
      case 'POST': return 'bg-blue-500';
      case 'PUT': return 'bg-orange-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pt-20">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">API Documentation</h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Integrate Umbrella Stock data into your applications
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                  <p className="text-3xl font-bold">{endpoints.length}</p>
                  <p className="text-sm text-blue-100">API Endpoints</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                  <p className="text-3xl font-bold">REST</p>
                  <p className="text-sm text-blue-100">Architecture</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                  <p className="text-3xl font-bold">JSON</p>
                  <p className="text-sm text-blue-100">Response Format</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Getting Started */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 mb-8 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Getting Started</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  The Umbrella Stock API is a RESTful API that provides access to real-time stock prices, mutual fund data,
                  portfolio management, and more. All responses are in JSON format.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Base URL</h3>
                    <code className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded">https://api.umbrellastock.com</code>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Authentication</h3>
                    <code className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded">Bearer {'{token}'}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Category</h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-500 text-blue-700 shadow-lg'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* API Endpoints */}
          <div className="space-y-4">
            {filteredEndpoints.map((endpoint, index) => (
              <div
                key={index}
                className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                  expandedEndpoint === index
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => setExpandedEndpoint(expandedEndpoint === index ? null : index)}
                  className="w-full px-6 py-4 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <span className={`${getMethodColor(endpoint.method)} text-white text-xs font-bold px-3 py-1 rounded`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm md:text-base font-mono text-gray-800">{endpoint.endpoint}</code>
                      {endpoint.authRequired && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-300">
                          🔐 Auth Required
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                        expandedEndpoint === index ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <p className="text-left text-sm text-gray-600 mt-2">{endpoint.description}</p>
                </button>

                {expandedEndpoint === index && (
                  <div className="px-6 py-4 bg-gradient-to-br from-gray-50 to-blue-50 border-t-2 border-blue-200">
                    {/* Parameters */}
                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Parameters</h4>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {endpoint.parameters.map((param, idx) => (
                                <tr key={idx}>
                                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{param.name}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{param.type}</span>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {param.required ? (
                                      <span className="text-red-600 font-semibold">Yes</span>
                                    ) : (
                                      <span className="text-gray-500">No</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Response Example */}
                    {endpoint.response && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Example Response</h4>
                        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm text-green-400 font-mono">{endpoint.response}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Additional Resources */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/contact" className="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">Support</h3>
                  <p className="text-sm text-gray-600">Need help? Contact our API support team</p>
                </div>
              </div>
            </a>
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">Rate Limits</h3>
                  <p className="text-sm text-gray-600">100 requests/minute for free tier</p>
                </div>
              </div>
            </div>
            <a href="/terms" className="group bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">Terms of Use</h3>
                  <p className="text-sm text-gray-600">Read our API terms and conditions</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

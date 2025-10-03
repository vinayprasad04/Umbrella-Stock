'use client';

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface SavedScreener {
  _id: string;
  title: string;
  description: string;
  filters: any;
  updatedAt: string;
}

const sharesTradingMenu = [
  { label: 'Home', href: '/' },
  { label: 'Sectors', href: '/sectors' },
  { label: 'Mutual Fund', href: '/mutual-funds' },
  { label: 'Scanner', href: '/scanner' }
];

export default function Header() {
  const [pathname, setPathname] = useState('/');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showScreenersMenu, setShowScreenersMenu] = useState(false);
  const [savedScreeners, setSavedScreeners] = useState<SavedScreener[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Get current pathname from window location
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);

      // Check if user is logged in
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
          // Fetch saved screeners
          fetchSavedScreeners();
        } catch (error) {
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      }

      // Listen for screener-saved event
      const handleScreenerSaved = () => {
        fetchSavedScreeners();
      };
      window.addEventListener('screener-saved', handleScreenerSaved);

      return () => {
        window.removeEventListener('screener-saved', handleScreenerSaved);
      };
    }
  }, []);

  const fetchSavedScreeners = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/user/screeners', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedScreeners(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching saved screeners:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setShowUserMenu(false);
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    return ['ADMIN', 'DATA_ENTRY'].includes(user.role) ? '/admin/dashboard' : '/dashboard';
  };

  // Close menu when clicking outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeMobileMenu();
    }
  };

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Better approach for mobile: prevent scroll without hiding scrollbar
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Cleanup on unmount
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 py-1 md:py-2 shadow-xl border-b border-blue-800/50 fixed top-0 left-0 right-0 z-[1000] backdrop-blur-md">
      <div className="w-full max-w-[1600px] mx-auto px-3 md:px-6 flex justify-between items-center">
        {/* Dual Logo Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Main Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 no-underline group">
            <div className="relative">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#FF6B2C] to-[#FF8A50] rounded-xl shadow-lg flex items-center justify-center group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <Image
                src="/logos/logo.png"
                alt="Umbrella Financial Logo"
                width={20}
                height={18}
                priority
                className="w-5 h-5 md:w-7 md:h-6.5 object-contain filter brightness-0 invert"
              />
              </div>
            </div>

          </Link>

          {/* Trading Logo */}
          <div className="h-6 md:h-8 w-px bg-gray-600"></div>
          <Link href="/" className="flex items-center gap-2 md:gap-3 no-underline group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg shadow-lg flex items-center justify-center group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <span className="text-white text-sm md:text-lg">📈</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base md:text-lg font-bold text-white group-hover:text-green-400 transition-all duration-300">
                Stock Analytics
              </span>
              <span className="text-xs text-gray-300 font-medium -mt-1 hidden sm:block">Trading Platform</span>
            </div>
          </Link>
        </div>

        {/* Search Bar - Center */}
        <div className="hidden lg:block flex-1 max-w-lg mx-4">
          <SearchBar />
        </div>
        
        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center gap-1">
          {sharesTradingMenu.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`no-underline font-medium px-2 lg:px-2 py-1 lg:py-1 rounded-lg transition-all duration-200 flex items-center gap-1 text-sm lg:text-sm ${
                (pathname === item.href || 
                 (item.label === 'Stock' && pathname.startsWith('/stocks')))
                  ? 'text-[#FF6B2C] bg-[#FF6B2C]/10 shadow-sm border border-[#FF6B2C]/20' 
                  : 'text-gray-200 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              {/* <span className="text-xs lg:text-sm">
                {item.label === 'Home' && '🏠'}
                {item.label === 'Stock' && '📊'}
                {item.label === 'Sectors' && '🏢'}
                {item.label === 'Mutual Fund' && '📈'}
                {item.label === 'Scanner' && '🔍'}
              </span> */}
              <span className="hidden lg:inline ml-1">{item.label}</span>
            </Link>
          ))}

          {/* Authentication Section */}
          <div className="ml-2 lg:ml-4 flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 lg:px-2 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs lg:text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>]
                  <span className="text-white text-sm lg:text-sm hidden lg:block">
                    {user.name}
                  </span>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-blue-600 font-medium mt-1">{user.role}</p>
                    </div>
                    
                    <Link
                      href={getDashboardLink()}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2v1H8V5z" />
                      </svg>
                      Dashboard
                    </Link>

                    {/* Saved Screeners Submenu */}
                    <div
                      className="relative"
                      onMouseEnter={() => setShowScreenersMenu(true)}
                      onMouseLeave={() => setShowScreenersMenu(false)}
                    >
                      <button
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          Saved Screeners
                        </div>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Screeners Submenu Dropdown */}
                      {showScreenersMenu && (
                        <div className="absolute left-full top-0 ml-1 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                          {savedScreeners.length > 0 ? (
                            savedScreeners.map((screener) => (
                              <Link
                                key={screener._id}
                                href={`/scanner?screenerId=${screener._id}`}
                                onClick={() => {
                                  setShowUserMenu(false);
                                  setShowScreenersMenu(false);
                                }}
                                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                              >
                                <div className="font-medium text-gray-900 truncate">{screener.title}</div>
                              </Link>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              No saved screeners yet
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {['ADMIN', 'DATA_ENTRY'].includes(user.role) && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 lg:px-4 py-2 text-sm lg:text-sm bg-gradient-to-r from-[#FF6B2C] to-[#FF8A50] text-white rounded-lg hover:shadow-lg transition-all duration-200 "
                >
                  Sign In
                </Link>
                {/* <Link
                  href="/signup"
                  className="px-3 lg:px-4 py-2 text-sm lg:text-base bg-gradient-to-r from-[#FF6B2C] to-[#FF8A50] text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Sign Up
                </Link> */}
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={toggleMobileMenu}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              // Close icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleOverlayClick}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Slide-in Menu Panel */}
        <div className={`absolute right-0 top-0 h-screen w-[70%] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-slate-900 to-blue-900">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B2C] to-[#FF8A50] rounded-lg shadow-lg flex items-center justify-center">
                  <Image
                    src="/logos/logo.png"
                    alt="Logo"
                    width={16}
                    height={14}
                    className="w-4 h-4 object-contain filter brightness-0 invert"
                  />
                </div>
                <span className="text-white font-bold text-lg">Menu</span>
              </div>
              <button 
                onClick={closeMobileMenu}
                className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-6 py-6 bg-gray-50 overflow-y-auto">
              <div className="space-y-2">
                {sharesTradingMenu.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`group flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 font-medium text-lg ${
                      (pathname === item.href || 
                       (item.label === 'Stock' && pathname.startsWith('/stocks')))
                        ? 'text-[#FF6B2C] bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 shadow-lg' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-200 ${
                      (pathname === item.href || 
                       (item.label === 'Stock' && pathname.startsWith('/stocks')))
                        ? 'bg-[#FF6B2C]/20 shadow-md' 
                        : 'bg-gray-200 group-hover:bg-gray-300'
                    }`}>
                      {item.label === 'Home' && '🏠'}
                      {item.label === 'Stock' && '📊'}
                      {item.label === 'Sectors' && '🏢'}
                      {item.label === 'Mutual Fund' && '📈'}
                      {item.label === 'Scanner' && '🔍'}
                    </div>
                    <div className="flex-1">
                      <span className="block font-semibold">{item.label}</span>
                      <span className="text-sm opacity-70">
                        {item.label === 'Home' && 'Dashboard & Overview'}
                        {item.label === 'Sectors' && 'Industry Analysis'}
                        {item.label === 'Mutual Fund' && 'Fund Investment'}
                        {item.label === 'Scanner' && 'Stock Screening'}
                      </span>
                    </div>
                    <svg className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </nav>
            
            {/* Bottom Section */}
            <div className="border-t border-gray-200 p-6 bg-gray-100 flex-shrink-0">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <p className="text-xs text-blue-600 font-medium">{user.role}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      href={getDashboardLink()}
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2v1H8V5z" />
                      </svg>
                      Dashboard
                    </Link>

                    {['ADMIN', 'DATA_ENTRY'].includes(user.role) && (
                      <Link
                        href="/admin/dashboard"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors shadow-sm w-full text-left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-600">Market Status</span>
                    <span className="text-green-600 font-medium">● Live</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#FF6B2C] to-[#FF8A50] rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      
      {/* Mobile Search Bar - Always visible on smaller screens when menu is closed */}
      {!isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900/95 border-t border-blue-800/50 px-3 py-2">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
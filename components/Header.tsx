'use client';

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import SearchBar from './SearchBar';

const sharesTradingMenu = [
  { label: 'Home', href: '/' },
  { label: 'Sectors', href: '/sectors' },
  { label: 'Mutual Fund', href: '/mutual-funds' },
  { label: 'Scanner', href: '/scanner' }
];

export default function Header() {
  const [pathname, setPathname] = useState('/');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Get current pathname from window location
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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
      <div className="w-full max-w-[1400px] mx-auto px-3 md:px-6 flex justify-between items-center">
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
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {sharesTradingMenu.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`no-underline font-medium px-2 lg:px-4 py-1 lg:py-2 rounded-lg transition-all duration-200 flex items-center gap-1 text-sm lg:text-base ${
                (pathname === item.href || 
                 (item.label === 'Stock' && pathname.startsWith('/stocks')))
                  ? 'text-[#FF6B2C] bg-[#FF6B2C]/10 shadow-sm border border-[#FF6B2C]/20' 
                  : 'text-gray-200 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <span className="text-xs lg:text-sm">
                {item.label === 'Home' && '🏠'}
                {item.label === 'Stock' && '📊'}
                {item.label === 'Sectors' && '🏢'}
                {item.label === 'Mutual Fund' && '📈'}
                {item.label === 'Scanner' && '🔍'}
              </span>
              <span className="hidden lg:inline ml-1">{item.label}</span>
            </Link>
          ))}
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Market Status</span>
                <span className="text-green-600 font-medium">● Live</span>
              </div>
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
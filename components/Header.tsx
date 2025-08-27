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

  useEffect(() => {
    // Get current pathname from window location
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);

  return (
    <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 py-2 shadow-xl border-b border-blue-800/50 sticky top-0 z-[1000] backdrop-blur-md">
      <div className="w-full max-w-[1600px] mx-auto px-6 flex justify-between items-center">
        {/* Dual Logo Section */}
        <div className="flex items-center gap-4">
          {/* Main Logo */}
          <Link href="/" className="flex items-center gap-3 no-underline group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B2C] to-[#FF8A50] rounded-xl shadow-lg flex items-center justify-center group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <Image
                src="/logos/logo.png"
                alt="Umbrella Financial Logo"
                width={24}
                height={22}
                priority
                className="w-7 h-6.5 object-contain filter brightness-0 invert"
              />
              </div>
            </div>

          </Link>

          {/* Trading Logo */}
          <div className="h-8 w-px bg-gray-600"></div>
          <Link href="/" className="flex items-center gap-3 no-underline group">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg shadow-lg flex items-center justify-center group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <span className="text-white text-lg">📈</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white group-hover:text-green-400 transition-all duration-300">
                Stock Analytics
              </span>
              <span className="text-xs text-gray-300 font-medium -mt-1">Trading Platform</span>
            </div>
          </Link>
        </div>

        {/* Search Bar - Center */}
        <div className="hidden md:block flex-1 max-w-lg mx-8">
          <SearchBar />
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex items-center gap-2">
          {sharesTradingMenu.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`no-underline font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-1 ${
                (pathname === item.href || 
                 (item.label === 'Stock' && pathname.startsWith('/stocks')))
                  ? 'text-[#FF6B2C] bg-[#FF6B2C]/10 shadow-sm border border-[#FF6B2C]/20' 
                  : 'text-gray-200 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              {item.label === 'Home' && '🏠'}
              {item.label === 'Stock' && '📊'}
              {item.label === 'Sectors' && '🏢'}
              {item.label === 'Mutual Fund' && '📈'}
              {item.label === 'Scanner' && '🔍'}
              <span className="ml-1">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Mobile Search - Only visible on mobile */}
        <div className="md:hidden ml-4">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
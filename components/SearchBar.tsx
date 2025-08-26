'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  matchScore: number;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
      return response.data.data as SearchResult[];
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/stocks/${query.trim().toUpperCase()}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleResultClick = (symbol: string) => {
    router.push(`/stocks/${symbol}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(e.target.value.length >= 2);
            }}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder="Search stocks (e.g., AAPL, Apple)"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </form>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-700">
              Searching...
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((result) => (
              <button
                key={result.symbol}
                onClick={() => handleResultClick(result.symbol)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="flex justify-between">
                  <div>
                    <span className="font-medium">{result.symbol}</span>
                    <span className="ml-2 text-gray-500">{result.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{result.region}</span>
                </div>
              </button>
            ))
          ) : query.length >= 2 ? (
            <div className="px-4 py-2 text-sm text-gray-700">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { ClientAuth, AuthUtils } from '@/lib/auth';

interface TokenInfo {
  accessToken: string | null;
  refreshToken: string | null;
  accessExpiry: number | null;
  refreshExpiry: number | null;
  isAccessExpired: boolean;
  isRefreshExpired: boolean;
  timeUntilExpiry: number;
}

export default function TokenStatus() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateTokenInfo = () => {
      const accessToken = ClientAuth.getAccessToken();
      const refreshToken = ClientAuth.getRefreshToken();
      
      if (!accessToken || !refreshToken) {
        setTokenInfo(null);
        return;
      }

      const accessExpiry = AuthUtils.getTokenExpiration(accessToken);
      const refreshExpiry = localStorage.getItem('refreshExpiry');
      const isAccessExpired = ClientAuth.isAccessTokenExpired();
      const isRefreshExpired = ClientAuth.isRefreshTokenExpired();
      
      const timeUntilExpiry = accessExpiry ? Math.max(0, accessExpiry - Date.now()) : 0;

      setTokenInfo({
        accessToken,
        refreshToken,
        accessExpiry,
        refreshExpiry: refreshExpiry ? parseInt(refreshExpiry) : null,
        isAccessExpired,
        isRefreshExpired,
        timeUntilExpiry,
      });
    };

    updateTokenInfo();
    const interval = setInterval(updateTokenInfo, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!tokenInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`mb-2 px-3 py-2 text-xs font-medium rounded-full shadow-lg transition-all duration-200 ${
          tokenInfo.isAccessExpired
            ? 'bg-red-500 text-white'
            : tokenInfo.timeUntilExpiry < 300000 // 5 minutes
            ? 'bg-yellow-500 text-white'
            : 'bg-green-500 text-white'
        }`}
      >
        🔐 Token Status
      </button>

      {/* Token Info Panel */}
      {isVisible && (
        <div className="bg-white rounded-lg shadow-xl border p-4 min-w-80 text-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Authentication Status</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Access Token */}
            <div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Access Token:</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    tokenInfo.isAccessExpired
                      ? 'bg-red-100 text-red-700'
                      : tokenInfo.timeUntilExpiry < 300000
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {tokenInfo.isAccessExpired ? 'Expired' : 'Valid'}
                </span>
              </div>
              {!tokenInfo.isAccessExpired && (
                <div className="text-gray-600 mt-1">
                  Expires in: <strong>{formatTime(tokenInfo.timeUntilExpiry)}</strong>
                </div>
              )}
              {tokenInfo.accessExpiry && (
                <div className="text-gray-500 text-xs mt-1">
                  Expires at: {formatDate(tokenInfo.accessExpiry)}
                </div>
              )}
            </div>

            {/* Refresh Token */}
            <div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Refresh Token:</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    tokenInfo.isRefreshExpired
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {tokenInfo.isRefreshExpired ? 'Expired' : 'Valid'}
                </span>
              </div>
              {tokenInfo.refreshExpiry && (
                <div className="text-gray-500 text-xs mt-1">
                  Expires at: {formatDate(tokenInfo.refreshExpiry)}
                </div>
              )}
            </div>

            {/* Token Actions */}
            <div className="pt-2 border-t">
              <div className="text-gray-600 text-xs mb-2">
                ℹ️ Tokens auto-refresh 1 minute before expiry
              </div>
              <div className="text-gray-600 text-xs">
                🔄 Auto-logout when refresh token expires
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
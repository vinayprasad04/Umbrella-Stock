import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export class AuthUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly REFRESH_SECRET = process.env.REFRESH_JWT_SECRET || 'your-refresh-secret-key';
  
  // Access token expires in 15 minutes (more secure)
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  // Refresh token expires in 7 days
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  /**
   * Generate access and refresh tokens
   */
  static generateTokens(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): AuthTokens {
    const accessTokenPayload = { ...payload, type: 'access' };
    const refreshTokenPayload = { ...payload, type: 'refresh' };

    const accessToken = jwt.sign(accessTokenPayload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(refreshTokenPayload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 * 1000, // 15 minutes in milliseconds
      refreshExpiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.REFRESH_SECRET) as TokenPayload;
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired or about to expire (within 1 minute)
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      const expireBuffer = 60; // 1 minute buffer
      
      return decoded.exp <= (currentTime + expireBuffer);
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded.exp ? decoded.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  /**
   * Decode token without verification (for client-side use)
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }
}

// Client-side token management
export class ClientAuth {
  private static readonly ACCESS_TOKEN_KEY = 'authToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly TOKEN_EXPIRY_KEY = 'tokenExpiry';
  private static readonly REFRESH_EXPIRY_KEY = 'refreshExpiry';

  /**
   * Store tokens in localStorage
   */
  static setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, (Date.now() + tokens.expiresIn).toString());
    localStorage.setItem(this.REFRESH_EXPIRY_KEY, (Date.now() + tokens.refreshExpiresIn).toString());
  }

  /**
   * Get access token from localStorage
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token from localStorage
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if access token is expired or about to expire
   */
  static isAccessTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryStr) return true;
    
    const expiry = parseInt(expiryStr);
    const buffer = 60 * 1000; // 1 minute buffer
    
    return Date.now() >= (expiry - buffer);
  }

  /**
   * Check if refresh token is expired
   */
  static isRefreshTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    const expiryStr = localStorage.getItem(this.REFRESH_EXPIRY_KEY);
    if (!expiryStr) return true;
    
    const expiry = parseInt(expiryStr);
    return Date.now() >= expiry;
  }

  /**
   * Clear all tokens
   */
  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.REFRESH_EXPIRY_KEY);
    localStorage.removeItem('user');
  }

  /**
   * Get current user from localStorage
   */
  static getCurrentUser(): any {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Logout user by clearing tokens and redirecting
   */
  static logout(): void {
    this.clearTokens();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    if (!accessToken || !refreshToken) return false;
    
    // If both tokens are expired, user is not authenticated
    if (this.isAccessTokenExpired() && this.isRefreshTokenExpired()) {
      return false;
    }
    
    return true;
  }
}

// Token refresh utility
export class TokenRefreshService {
  private static isRefreshing = false;
  private static refreshPromise: Promise<string> | null = null;

  /**
   * Refresh the access token using refresh token
   */
  static async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    
    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        const refreshToken = ClientAuth.getRefreshToken();
        
        if (!refreshToken || ClientAuth.isRefreshTokenExpired()) {
          throw new Error('Refresh token expired');
        }

        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Token refresh failed');
        }

        // Store new tokens
        ClientAuth.setTokens(data.data);
        
        this.isRefreshing = false;
        this.refreshPromise = null;
        
        resolve(data.data.accessToken);
      } catch (error) {
        this.isRefreshing = false;
        this.refreshPromise = null;
        
        // If refresh fails, logout user
        ClientAuth.logout();
        reject(error);
      }
    });

    return this.refreshPromise;
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  static async getValidAccessToken(): Promise<string> {
    const accessToken = ClientAuth.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token found');
    }

    // If token is not expired, return it
    if (!ClientAuth.isAccessTokenExpired()) {
      return accessToken;
    }

    // Token is expired, try to refresh
    return this.refreshAccessToken();
  }
}
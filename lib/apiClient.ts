import { ClientAuth, TokenRefreshService } from './auth';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private static baseURL = '/api';

  /**
   * Make authenticated API request with automatic token refresh
   */
  static async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Get a valid access token (will refresh if needed)
      const token = await TokenRefreshService.getValidAccessToken();
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Make the request
      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      // Check if token is invalid/expired
      if (response.status === 401 && data.error?.toLowerCase().includes('token')) {
        // Try to refresh token and retry once
        try {
          const newToken = await TokenRefreshService.refreshAccessToken();
          
          // Retry the request with new token
          const retryHeaders = {
            ...headers,
            'Authorization': `Bearer ${newToken}`,
          };

          const retryResponse = await fetch(`${this.baseURL}${url}`, {
            ...options,
            headers: retryHeaders,
          });

          return retryResponse.json();
        } catch (refreshError) {
          // Refresh failed, logout user
          ClientAuth.logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      return data;
    } catch (error: any) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  static async get<T = any>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  static async post<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  static async put<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  static async delete<T = any>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * PATCH request
   */
  static async patch<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

// Legacy fetch wrapper for backward compatibility
export const apiRequest = ApiClient.request;
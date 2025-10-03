// Client-side authentication utilities

const AUTH_STORAGE_KEY = 'auth_token';
const LOGIN_EVENT = 'user_logged_in';
const LOGOUT_EVENT = 'user_logged_out';

export const authUtils = {
  // Check if user is logged in
  isLoggedIn: (): boolean => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    return !!token;
  },

  // Get auth token
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_STORAGE_KEY);
  },

  // Set auth token
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_STORAGE_KEY, token);
    // Broadcast login event to other tabs
    window.dispatchEvent(new CustomEvent(LOGIN_EVENT, { detail: { token } }));
  },

  // Remove auth token
  removeToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Broadcast logout event to other tabs
    window.dispatchEvent(new CustomEvent(LOGOUT_EVENT));
  },

  // Listen for login events across tabs
  onLogin: (callback: () => void): (() => void) => {
    if (typeof window === 'undefined') return () => {};

    const handler = () => callback();
    window.addEventListener(LOGIN_EVENT, handler);

    // Also listen for storage changes (cross-tab)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY && e.newValue) {
        callback();
      }
    };
    window.addEventListener('storage', storageHandler);

    // Return cleanup function
    return () => {
      window.removeEventListener(LOGIN_EVENT, handler);
      window.removeEventListener('storage', storageHandler);
    };
  },

  // Listen for logout events across tabs
  onLogout: (callback: () => void): (() => void) => {
    if (typeof window === 'undefined') return () => {};

    const handler = () => callback();
    window.addEventListener(LOGOUT_EVENT, handler);

    // Also listen for storage changes (cross-tab)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY && !e.newValue) {
        callback();
      }
    };
    window.addEventListener('storage', storageHandler);

    // Return cleanup function
    return () => {
      window.removeEventListener(LOGOUT_EVENT, handler);
      window.removeEventListener('storage', storageHandler);
    };
  },
};

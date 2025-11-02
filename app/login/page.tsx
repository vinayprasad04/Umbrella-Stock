'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import ReCaptchaProvider from '@/components/ReCaptchaProvider';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

interface LoginForm {
  email: string;
  password: string;
}

function LoginForm() {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const {
    loading: oauthLoading,
    error: oauthError,
    signInWithGoogleProvider,
    signInWithMicrosoftProvider
  } = useFirebaseAuth();

  // Check if Firebase is configured
  const isFirebaseConfigured = () => {
    return (
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here' &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'your_project_id'
    );
  };

  // Redirect if already authenticated
  useEffect(() => {
    // Only redirect if we have valid authentication
    if (!isLoading && isAuthenticated && user) {
      // Double-check we have a valid token before redirecting
      const token = localStorage.getItem('authToken');
      if (token) {
        // Redirect based on user role
        if (['ADMIN', 'DATA_ENTRY'].includes(user.role)) {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Execute ReCaptcha
    if (!executeRecaptcha) {
      setError('ReCaptcha not loaded. Please refresh the page.');
      setLoading(false);
      return;
    }

    try {
      const recaptchaToken = await executeRecaptcha('login');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store tokens and user info using ClientAuth
        const { user, accessToken, refreshToken, expiresIn, refreshExpiresIn } = data.data;

        // Use ClientAuth to store tokens properly
        const tokens = { accessToken, refreshToken, expiresIn, refreshExpiresIn };

        // Store tokens with ClientAuth utility
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('tokenExpiry', (Date.now() + expiresIn).toString());
        localStorage.setItem('refreshExpiry', (Date.now() + refreshExpiresIn).toString());
        localStorage.setItem('user', JSON.stringify(user));

        // Update AuthContext immediately
        login(tokens, user);

        // Small delay to ensure AuthContext is updated before navigation
        setTimeout(() => {
          // Redirect based on user role
          if (['ADMIN', 'DATA_ENTRY'].includes(data.data.user.role)) {
            router.push('/admin/dashboard');
          } else {
            router.push('/dashboard');
          }
        }, 100);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (result: any) => {
    if (!result) return;

    try {
      const { user: firebaseUser } = result;

      // Send OAuth data to backend
      const response = await fetch('/api/auth/oauth-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email,
          provider: firebaseUser.providerData[0]?.providerId.includes('google') ? 'google' : 'microsoft',
          providerId: firebaseUser.uid,
          photoUrl: firebaseUser.photoURL,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const { user, accessToken, refreshToken, expiresIn, refreshExpiresIn } = data.data;
        const tokens = { accessToken, refreshToken, expiresIn, refreshExpiresIn };

        // Store tokens
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('tokenExpiry', (Date.now() + expiresIn).toString());
        localStorage.setItem('refreshExpiry', (Date.now() + refreshExpiresIn).toString());
        localStorage.setItem('user', JSON.stringify(user));

        // Update AuthContext
        login(tokens, user);

        // Redirect
        setTimeout(() => {
          if (['ADMIN', 'DATA_ENTRY'].includes(user.role)) {
            router.push('/admin/dashboard');
          } else {
            router.push('/dashboard');
          }
        }, 100);
      } else {
        setError(data.error || 'OAuth login failed');
      }
    } catch (error) {
      setError('OAuth login failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const result = await signInWithGoogleProvider();
    await handleOAuthLogin(result);
  };

  const handleMicrosoftLogin = async () => {
    setError('');
    const result = await signInWithMicrosoftProvider();
    await handleOAuthLogin(result);
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

      
      <div className="relative w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-50 animate-pulse"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Logo & Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B2C] to-[#FF8A50] rounded-xl shadow-lg flex items-center justify-center">
                  <Image
                    src="/logos/logo.png"
                    alt="Logo"
                    width={24}
                    height={22}
                    className="w-6 h-6 object-contain filter brightness-0 invert"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
                  <p className="text-blue-200 text-sm">Sign in to your account</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {(error || oauthError) && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-100 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{error || oauthError}</span>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                      placeholder="Enter your email address"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-blue-300 hover:text-blue-200 transition-colors font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </div>
                )}
              </button>
            </form>

            {/* OAuth Login Buttons - Only show if Firebase is configured */}
            {isFirebaseConfigured() && (
              <>
                {/* Divider */}
                <div className="my-6 flex items-center">
                  <div className="flex-1 border-t border-white/20"></div>
                  <span className="px-4 text-sm text-gray-300">Or continue with</span>
                  <div className="flex-1 border-t border-white/20"></div>
                </div>

                {/* OAuth Login Buttons */}
                <div className="space-y-3">
                  {/* Google Login */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading || oauthLoading}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                  >
                    {oauthLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>

                  {/* Microsoft Login */}
                  {/* <button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    disabled={loading || oauthLoading}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                  >
                    {oauthLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <path d="M11.4 11.4H2V2h9.4v9.4z" fill="#F25022"/>
                          <path d="M22 11.4h-9.4V2H22v9.4z" fill="#7FBA00"/>
                          <path d="M11.4 22H2v-9.4h9.4V22z" fill="#00A4EF"/>
                          <path d="M22 22h-9.4v-9.4H22V22z" fill="#FFB900"/>
                        </svg>
                        <span>Continue with Microsoft</span>
                      </>
                    )}
                  </button> */}
                </div>
              </>
            )}

            {/* Demo Credentials */}
           

            {/* Navigation Links */}
            <div className="mt-8 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-gray-300 text-sm">Don't have an account?</span>
                <Link 
                  href="/signup" 
                  className="text-blue-300 hover:text-blue-200 text-sm font-semibold transition-colors"
                >
                  Create Account
                </Link>
              </div>
              
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm transition-colors group"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <ReCaptchaProvider>
      <LoginForm />
    </ReCaptchaProvider>
  );
}
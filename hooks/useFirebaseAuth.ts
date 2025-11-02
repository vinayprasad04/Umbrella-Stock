import { useState } from 'react';
import { signInWithGoogle, signInWithMicrosoft } from '@/lib/firebase';
import { UserCredential } from 'firebase/auth';

interface FirebaseAuthError {
  code: string;
  message: string;
}

interface UseFirebaseAuthReturn {
  loading: boolean;
  error: string | null;
  signInWithGoogleProvider: () => Promise<UserCredential | null>;
  signInWithMicrosoftProvider: () => Promise<UserCredential | null>;
}

export const useFirebaseAuth = (): UseFirebaseAuthReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (error: FirebaseAuthError): string => {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        return 'Sign-in cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'Popup was blocked. Please allow popups for this site.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in cancelled. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email but different sign-in method.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return error.message || 'Authentication failed. Please try again.';
    }
  };

  const signInWithGoogleProvider = async (): Promise<UserCredential | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogle();
      return result;
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('Google Sign-In Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signInWithMicrosoftProvider = async (): Promise<UserCredential | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithMicrosoft();
      return result;
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('Microsoft Sign-In Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    signInWithGoogleProvider,
    signInWithMicrosoftProvider,
  };
};

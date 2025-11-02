import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase credentials are properly configured
const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'your_api_key_here' &&
    firebaseConfig.authDomain &&
    firebaseConfig.authDomain !== 'your_project.firebaseapp.com' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'your_project_id'
  );
};

// Initialize Firebase (only once)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  // Client-side initialization only if credentials are configured
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    console.warn('Firebase OAuth is not configured. Please add Firebase credentials to .env.local file.');
  }
}

// Google Provider (only initialize on client)
let googleProvider: GoogleAuthProvider | undefined;
let microsoftProvider: OAuthProvider | undefined;

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('profile');
  googleProvider.addScope('email');

  // Microsoft Provider (Outlook)
  microsoftProvider = new OAuthProvider('microsoft.com');
  microsoftProvider.addScope('email');
  microsoftProvider.addScope('profile');
  microsoftProvider.addScope('openid');
}

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase OAuth is not configured. Please add Firebase credentials to your .env.local file. See OAUTH_QUICK_START.md for setup instructions.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

// Sign in with Microsoft
export const signInWithMicrosoft = async (): Promise<UserCredential> => {
  if (!auth || !microsoftProvider) {
    throw new Error('Firebase OAuth is not configured. Please add Firebase credentials to your .env.local file. See OAUTH_QUICK_START.md for setup instructions.');
  }
  try {
    const result = await signInWithPopup(auth, microsoftProvider);
    return result;
  } catch (error: any) {
    console.error('Microsoft Sign-In Error:', error);
    throw error;
  }
};

// Handle redirect result (useful for mobile or popup blockers)
export const handleRedirectResult = async (): Promise<UserCredential | null> => {
  if (!auth) {
    throw new Error('Firebase not initialized. This function can only be called on the client side.');
  }
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error: any) {
    console.error('Redirect Result Error:', error);
    throw error;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase not initialized. This function can only be called on the client side.');
  }
  try {
    await auth.signOut();
  } catch (error: any) {
    console.error('Sign Out Error:', error);
    throw error;
  }
};

export { auth, googleProvider, microsoftProvider };
export default app;

/**
 * Firebase Configuration
 * Safely maps environment variables. 
 * Ensure these are set in Vercel/Local .env with NEXT_PUBLIC_ prefix.
 */

const getSafeEnv = (key: string): string => {
  const value = process.env[key];
  if (!value || value === 'undefined' || value === 'null' || value.includes('YOUR_')) {
    return '';
  }
  return value;
};

export const firebaseConfig = {
  apiKey: getSafeEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getSafeEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getSafeEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getSafeEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getSafeEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getSafeEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

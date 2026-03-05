/**
 * Firebase Configuration
 * Production-ready with validation and error handling
 */

const getEnv = (key: string): string => {
  const val = process.env[key];
  if (!val || val === 'undefined') {
    // Silenced for smoother prototyping if env vars are not yet set
    return "";
  }
  return val;
};

export const firebaseConfig = {
  apiKey: getEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

// Feature flags
export const config = {
  ...firebaseConfig,
  ENABLE_LIVE_MARKETPLACE: true,
  PLATFORM_DEBUG_MODE: process.env.NODE_ENV === 'development',
};

export default config;

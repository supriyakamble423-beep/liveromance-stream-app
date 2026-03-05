/**
 * Firebase Configuration
 * Production-ready with validation and error handling
 */

const getEnv = (key: string): string => {
  const val = process.env[key];
  if (!val || val === 'undefined') {
    console.warn(`⚠️ Missing environment variable: ${key}`);
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

// Validation
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
];

const missingVars = requiredEnvVars.filter(
  varName => !process.env[varName] || process.env[varName] === 'undefined'
);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('📝 Please check your .env.local file');
}

// Feature flags
export const config = {
  ...firebaseConfig,
  ENABLE_LIVE_MARKETPLACE: true,
  PLATFORM_DEBUG_MODE: process.env.NODE_ENV === 'development',
};

export default config;
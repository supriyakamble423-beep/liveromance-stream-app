/**
 * Firebase Configuration
 * Directly using environment variables with validation to prevent "invalid-api-key" errors.
 */

const getEnv = (key: string) => {
  const val = process.env[key];
  // Check for literal "undefined" string which sometimes happens in some build environments
  if (val === 'undefined' || !val) return "";
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

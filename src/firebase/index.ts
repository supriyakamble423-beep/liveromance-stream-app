'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export interface FirebaseSdks {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

/**
 * initializeFirebase
 * Robust initialization that checks for valid config before starting.
 * This prevents 'invalid-api-key' errors during SSR or when env vars are missing.
 */
export function initializeFirebase(): FirebaseSdks {
  // Ensure we are on the client
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null, storage: null };
  }

  // 1. Check if already initialized
  if (getApps().length > 0) {
    const app = getApp();
    return getSdks(app);
  }

  // 2. Validate Config
  const isConfigValid = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey.length > 10 &&
    firebaseConfig.projectId;

  if (!isConfigValid) {
    console.warn('⚠️ FIREBASE WARNING: Keys are missing or invalid. App will run in limited mode.');
    return { firebaseApp: null, auth: null, firestore: null, storage: null };
  }

  // 3. Initialize App
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  } catch (e) {
    console.error('Firebase initialization failed:', e);
    return { firebaseApp: null, auth: null, firestore: null, storage: null };
  }
}

/**
 * getSdks
 * Safely attempts to get Auth and Firestore services.
 */
export function getSdks(firebaseApp: FirebaseApp | null): FirebaseSdks {
  if (!firebaseApp) {
    return { firebaseApp: null, auth: null, firestore: null, storage: null };
  }

  try {
    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: getFirestore(firebaseApp),
      storage: getStorage(firebaseApp)
    };
  } catch (e) {
    console.error('Error retrieving Firebase services:', e);
    return {
      firebaseApp,
      auth: null,
      firestore: null,
      storage: null
    };
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

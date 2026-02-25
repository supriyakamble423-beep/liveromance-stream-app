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
 * Robust initialization logic to be used exclusively on the client.
 * Isolated to prevent circular dependencies.
 */
export function initializeFirebase(): FirebaseSdks {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null, storage: null };
  }

  let app: FirebaseApp | null = null;
  
  try {
    if (getApps().length > 0) {
      app = getApp();
    } else if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10) {
      app = initializeApp(firebaseConfig);
    }
  } catch (e) {
    console.error('Firebase initialization failed:', e);
  }

  if (!app) {
    return { firebaseApp: null, auth: null, firestore: null, storage: null };
  }

  try {
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
      storage: getStorage(app)
    };
  } catch (e) {
    console.error('Error retrieving Firebase services:', e);
    return {
      firebaseApp: app,
      auth: null,
      firestore: null,
      storage: null
    };
  }
}

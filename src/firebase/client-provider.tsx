'use client';

import React, { useState, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, type FirebaseSdks } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * FirebaseClientProvider
 * Initializes Firebase eagerly on the client to avoid hydration-related null states.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Initialize services immediately if on client, otherwise null
  const [services] = useState<FirebaseSdks>(() => {
    if (typeof window !== 'undefined') {
      return initializeFirebase();
    }
    return { firebaseApp: null, auth: null, firestore: null, storage: null };
  });

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
      storage={services.storage}
    >
      {children}
    </FirebaseProvider>
  );
}

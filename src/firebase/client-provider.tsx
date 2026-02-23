'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, type FirebaseSdks } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Use state to defer initialization until after mount to avoid hydration mismatches
  const [services, setServices] = useState<FirebaseSdks>({
    firebaseApp: null,
    auth: null,
    firestore: null,
    storage: null
  });

  useEffect(() => {
    const initialized = initializeFirebase();
    setServices(initialized);
  }, []);

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

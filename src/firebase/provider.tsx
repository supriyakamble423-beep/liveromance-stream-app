'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────
interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage?: FirebaseStorage | null;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  // Helper functions
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage = null
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null
  });

  // ─────────────────────────────────────────────────────────
  // Create/Update User Document with Welcome Bonus
  // ─────────────────────────────────────────────────────────
  const createOrUpdateUserDoc = useCallback(async (firebaseUser: User) => {
    if (!firestore) return;
    
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    
    try {
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // 🎁 NEW USER: Welcome Bonus - 50 Diamonds
        await setDoc(userRef, {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          username: firebaseUser.displayName || `User_${firebaseUser.uid.slice(0, 5)}`,
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          diamonds: 50, // ✨ Welcome Bonus
          referralCode: `REF_${firebaseUser.uid.slice(0, 6).toUpperCase()}`,
          referredBy: null,
          apkDownloaded: false,
          isHost: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        }, { merge: true });
        console.log('✅ New user created with 50 Diamonds welcome bonus');
      } else {
        // Existing user: Just update lastLogin
        await setDoc(userRef, { 
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('⚠️ Profile sync failed (non-blocking):', e);
    }
  }, [firestore]);

  // ─────────────────────────────────────────────────────────
  // Auth State Listener
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    // If auth is not ready, mark loading as done
    if (!auth) {
      setUserAuthState(prev => ({ ...prev, isUserLoading: false }));
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!firebaseUser) {
          // No user → Try anonymous sign-in for guest access
          try {
            await signInAnonymously(auth);
          } catch (e) {
            console.error('❌ Auto anonymous auth failed:', e);
          }
          setUserAuthState({ user: null, isUserLoading: false, userError: null });
          return;
        }

        // User exists → Sync with Firestore
        await createOrUpdateUserDoc(firebaseUser);
        
        setUserAuthState({ 
          user: firebaseUser, 
          isUserLoading: false, 
          userError: null 
        });
      },
      (error) => {
        console.error('❌ Auth state change error:', error);
        setUserAuthState({ 
          user: null, 
          isUserLoading: false, 
          userError: error instanceof Error ? error : new Error('Auth error') 
        });
      }
    );
    
    return () => unsubscribe();
  }, [auth, firestore, createOrUpdateUserDoc]);

  // ─────────────────────────────────────────────────────────
  // Helper: Sign Out
  // ─────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      setUserAuthState({ user: null, isUserLoading: false, userError: null });
    } catch (e) {
      console.error('Sign out error:', e);
    }
  }, [auth]);

  // ─────────────────────────────────────────────────────────
  // Helper: Refresh User Data
  // ─────────────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    if (!auth?.currentUser || !firestore) return;
    await createOrUpdateUserDoc(auth.currentUser);
  }, [auth, firestore, createOrUpdateUserDoc]);

  // ─────────────────────────────────────────────────────────
  // Context Value (Memoized)
  // ─────────────────────────────────────────────────────────
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp,
      firestore,
      auth,
      storage: storage || null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      signOut,
      refreshUser,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState, signOut, refreshUser]);

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// Custom Hooks
// ─────────────────────────────────────────────────────────────
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useFirebaseApp = () => useFirebase().firebaseApp;
export const useStorage = () => useFirebase().storage;

export const useUser = () => {
  const { user, isUserLoading, userError, signOut, refreshUser } = useFirebase();
  return { user, isUserLoading, userError, signOut, refreshUser };
};

export const useAreServicesAvailable = () => useFirebase().areServicesAvailable;

// ─────────────────────────────────────────────────────────────
// useMemoFirebase: Safe memoization for Firestore references
// ─────────────────────────────────────────────────────────────
type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(factory, deps);
}

// ─────────────────────────────────────────────────────────────
// Utility: Safe Firestore Document Reference
// ─────────────────────────────────────────────────────────────
export const useSafeDocRef = (collectionName: string, docId: string | null) => {
  const { firestore, areServicesAvailable } = useFirebase();
  
  return useMemo(() => {
    if (!areServicesAvailable || !firestore || !docId) return null;
    return doc(firestore, collectionName, docId);
  }, [firestore, collectionName, docId, areServicesAvailable]);
};
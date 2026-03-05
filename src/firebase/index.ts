'use client';

// Core exports
export * from './init';
export * from './provider';
export * from './client-provider';

// Firestore hooks
export * from './firestore/use-collection';
export * from './firestore/use-doc';

// Utility functions
export * from './non-blocking-updates';
export * from './non-blocking-login';

// Error handling
export * from './errors';
export * from './error-emitter';

// Re-export common Firebase functions for convenience
export { doc, collection, getDoc, setDoc, updateDoc, deleteDoc, 
         addDoc, onSnapshot, query, orderBy, limit, where, 
         serverTimestamp, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
export { signInWithPopup, signInWithEmailAndPassword, 
         createUserWithEmailAndPassword, signOut, 
         GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * FirebaseErrorListener
 * Ek invisible component jo globally 'permission-error' events ko sunta hai.
 * Jab bhi Firestore permission deny karta hai, ye component error throw karta hai
 * taaki Next.js ka Error Boundary (global-error.tsx) usey handle kar sake.
 */
export function FirebaseErrorListener() {
  // FirestorePermissionError ko state mein save karne ke liye
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    // Ye function tab chalega jab errorEmitter koi error bhejega
    const handleError = (error: FirestorePermissionError) => {
      console.error("FirebaseErrorListener caught an error:", error.message);
      // State update hote hi component re-render hoga aur niche error throw hoga
      setError(error);
    };

    // Event listener ko subscribe karein
    errorEmitter.on('permission-error', handleError);

    // Cleanup: Jab component unmount ho, toh listener hata dein
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // Agar state mein error hai, toh Next.js ko batao (Error Boundary trigger karo)
  if (error) {
    throw error;
  }

  // Ye component UI mein kuch nahi dikhata
  return null;
}

'use client';

import { Firestore, doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export type PaymentType = 'zap' | 'tip' | 'referral';

/**
 * processPayment
 * Handles coin deduction from user, 80% to host, 1% to referrer.
 */
export async function processPayment(
  db: Firestore,
  type: PaymentType,
  amount: number,
  userId: string,
  hostId: string,
  referrerId?: string
) {
  // 1. Cut Calculations
  const hostCut = amount * 0.80; // 80% to Host
  const referralCut = amount * 0.01; // 1% Lifetime to Referrer (A -> B)

  try {
    // 2. User Wallet (Coins minus) - In a real app, this should be a Transaction or Cloud Function
    const userRef = doc(db, 'users', userId);
    updateDoc(userRef, {
      coins: increment(-amount),
      updatedAt: serverTimestamp()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: { coins: -amount }
      }));
    });

    // 3. Host Wallet (80% plus)
    const hostRef = doc(db, 'hosts', hostId);
    updateDoc(hostRef, {
      earnings: increment(hostCut),
      updatedAt: serverTimestamp()
    }).catch(e => {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: hostRef.path,
        operation: 'update',
        requestResourceData: { earnings: hostCut }
      }));
    });

    // 4. Referral Logic (A -> B)
    if (referrerId) {
      const referrerRef = doc(db, 'users', referrerId);
      updateDoc(referrerRef, {
        referralEarnings: increment(referralCut),
        coins: increment(referralCut),
        updatedAt: serverTimestamp()
      }).catch(e => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: referrerRef.path,
          operation: 'update',
          requestResourceData: { coins: referralCut }
        }));
      });
    }

    // 5. Log Transaction
    const transRef = collection(db, 'transactions');
    const transData = {
      from: userId,
      to: hostId,
      amount,
      type,
      timestamp: serverTimestamp()
    };
    
    addDoc(transRef, transData).catch(e => {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'transactions',
        operation: 'create',
        requestResourceData: transData
      }));
    });

    return { success: true };
  } catch (error) {
    console.error("Payment logic initiation failed", error);
    return { success: false };
  }
}

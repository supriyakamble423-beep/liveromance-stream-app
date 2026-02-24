
'use client';

import { Firestore, doc, updateDoc, increment, addDoc, collection, serverTimestamp, setDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export type PaymentType = 'zap' | 'tip' | 'referral' | 'private_session';

/**
 * processPayment
 * Handles coin deduction from user, 80% to host, 1% to referrer.
 * Also handles Private Session activation if type is 'private_session'.
 */
export async function processPayment(
  db: Firestore,
  type: PaymentType,
  amount: number,
  userId: string,
  hostId: string,
  referrerId?: string
) {
  const hostCut = amount * 0.80; 
  const referralCut = amount * 0.01; 

  try {
    // 1. User Wallet (Coins minus)
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

    // 2. Host Wallet (80% plus)
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

    // 3. Referral Logic (A -> B)
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

    // 4. Private Session Activation (Smart Reconnect Logic)
    if (type === 'private_session') {
      const sessionId = `${userId}_${hostId}`;
      const sessionRef = doc(db, 'streamSessions', sessionId);
      
      // Session valid for 30 minutes
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      setDoc(sessionRef, {
        userId,
        hostId,
        expiresAt,
        lastPaidAt: serverTimestamp(),
        status: 'active'
      }, { merge: true }).catch(e => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: sessionRef.path,
          operation: 'write',
          requestResourceData: { status: 'active' }
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

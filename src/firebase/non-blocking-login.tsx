'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/** Helper to ensure user doc exists with welcome bonus */
async function ensureUserDoc(credential: UserCredential) {
  // Use try-catch to avoid crashing auth flow if Firestore fails
  try {
    const db = getFirestore();
    const user = credential.user;
    const userRef = doc(db, 'users', user.uid);
    
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        uid: user.uid,
        username: user.displayName || `User_${user.uid.slice(0,5)}`,
        email: user.email || '',
        diamonds: 30, // 🎁 Welcome Bonus finalized at 30
        photoURL: user.photoURL || '',
        referralCode: `REF_${user.uid.slice(0, 6).toUpperCase()}`,
        apkDownloaded: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      }, { merge: true });
    } else {
      // For existing users, update metadata but keep their earnings
      await setDoc(userRef, { 
        lastLogin: serverTimestamp(),
        photoURL: user.photoURL || snap.data()?.photoURL || '',
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (e) {
    console.warn("User doc sync failed:", e);
  }
}

/** Initiate anonymous sign-in (returns Promise). */
export async function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  const cred = await signInAnonymously(authInstance);
  await ensureUserDoc(cred);
  return cred;
}

/** Initiate email/password sign-up (returns Promise). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  const cred = await createUserWithEmailAndPassword(authInstance, email, password);
  await ensureUserDoc(cred);
  return cred;
}

/** Initiate email/password sign-in (returns Promise). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  const cred = await signInWithEmailAndPassword(authInstance, email, password);
  await ensureUserDoc(cred);
  return cred;
}

/** Initiate Google sign-in with popup (returns Promise). */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  // Ensure popup is triggered by user gesture (this function should be called in onClick)
  const cred = await signInWithPopup(authInstance, provider);
  await ensureUserDoc(cred);
  return cred;
}

/** Initiate Facebook sign-in with popup (returns Promise). */
export async function initiateFacebookSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new FacebookAuthProvider();
  const cred = await signInWithPopup(authInstance, provider);
  await ensureUserDoc(cred);
  return cred;
}

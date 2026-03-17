'use client';
import { Auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';

export const initiateGoogleSignIn = async (auth: Auth): Promise<void> => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  
  try {
    // Pehle popup try karo
    await signInWithPopup(auth, provider);
  } catch (popupError: any) {
    console.warn('Popup failed, trying redirect:', popupError.code);
    
    // Popup block hone par redirect use karo (mobile ke liye)
    if (
      popupError.code === 'auth/popup-blocked' ||
      popupError.code === 'auth/popup-closed-by-user' ||
      popupError.code === 'auth/cancelled-popup-request'
    ) {
      await signInWithRedirect(auth, provider);
    } else {
      throw popupError;
    }
  }
};

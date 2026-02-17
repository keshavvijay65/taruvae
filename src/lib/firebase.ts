/**
 * Firebase Service Aggregator (Professional Architecture)
 * ========================================================
 * This file serves as a backward-compatible entry point that 
 * aggregates the modularized Firebase services.
 */

import { firebaseApp, firebaseAuth, firebaseDb, firebaseStorage } from './firebase/config';
import { RecaptchaVerifier as FBRecaptchaVerifier, GoogleAuthProvider } from 'firebase/auth';

// Export everything from the core config
export * from './firebase/config';

// Getter functions for safe access (kept for backward compatibility)
export const getFirebaseApp = () => firebaseApp;
export const getFirebaseAuth = () => firebaseAuth;
export const getFirebaseDatabase = () => firebaseDb;
// export const getFirebaseFirestore = () => firebaseFirestore; // REMOVED
export const getGoogleAuthProvider = () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
};

// Simplified Singleton Exports
export const auth = firebaseAuth;
export const database = firebaseDb;
export const storage = firebaseStorage;
export const RecaptchaVerifier = FBRecaptchaVerifier;

// Helper to check ready state (kept for safety)
export const isFirebaseReady = () => !!firebaseApp;

export default firebaseApp;

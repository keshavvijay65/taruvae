/*
// LEGACY AUTH FILE - DEPRECATED
// This file depends on Firestore which has been removed from the project.
// Authentication logic has been moved to src/lib/authHelpers.ts using Realtime Database.
// Keeping this file commented out for reference if needed, but it should not be imported.

import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { firebaseAuth } from './config';
// import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; // REMOVED
// import { firebaseFirestore } from './config'; // REMOVED
import { User } from '@/types';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ... (Rest of the file commented out)
*/

export const legacy_auth_disabled = true;

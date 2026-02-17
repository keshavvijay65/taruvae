/**
 * Auth Helper Functions
 * ======================
 * Centralized authentication logic for:
 * - Google Sign-in
 * - Phone verification
 * - Realtime Database user management (Migrated from Firestore)
 */

import {
    signInWithPopup,
    signInWithPhoneNumber,
    PhoneAuthProvider,
    ConfirmationResult,
    UserCredential,
    RecaptchaVerifier,
} from 'firebase/auth';
import {
    ref,
    set,
    update,
    get,
    child
} from 'firebase/database';
import {
    firebaseAuth,
    firebaseDb as firebaseDatabase
} from './firebase/config';
import { getGoogleAuthProvider } from './firebase';

const auth = firebaseAuth;
const db = firebaseDatabase;
const googleProvider = typeof window !== 'undefined' ? getGoogleAuthProvider() : null;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DbUser {
    uid: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    photoURL: string | null;
    phone: string | null;
    phoneVerified: boolean;
    provider: 'google' | 'password';
    createdAt: string | null;
    lastLoginAt: string | null;
    cannotUseCOD?: boolean;
}

export interface GoogleLoginResult {
    success: boolean;
    isNewUser: boolean;
    needsPhoneVerification: boolean;
    user: DbUser | null;
    error?: string;
}

export interface PhoneVerificationResult {
    success: boolean;
    confirmationResult?: ConfirmationResult;
    error?: string;
}

export interface OTPVerificationResult {
    success: boolean;
    error?: string;
}

// ============================================================================
// REALTIME DATABASE USER FUNCTIONS
// ============================================================================

/**
 * Check if a user exists in Realtime Database
 */
export async function checkUserExists(uid: string): Promise<boolean> {
    try {
        if (!firebaseDatabase) {
            // Fallback to localStorage
            const users = JSON.parse(localStorage.getItem('taruvae-users-data') || '{}');
            return !!users[uid];
        }

        const dbRef = ref(firebaseDatabase);
        const snapshot = await get(child(dbRef, `users/${uid}`));
        return snapshot.exists();
    } catch (error: any) {
        console.warn('RTDB checkUserExists failed:', error);
        return false;
    }
}

/**
 * Get user data from Realtime Database
 */
export async function getUserProfile(uid: string): Promise<DbUser | null> {
    try {
        if (!firebaseDatabase) {
            const users = JSON.parse(localStorage.getItem('taruvae-users-data') || '{}');
            return users[uid] || null;
        }

        const dbRef = ref(firebaseDatabase);
        const snapshot = await get(child(dbRef, `users/${uid}`));
        if (snapshot.exists()) {
            return snapshot.val() as DbUser;
        }
        return null;
    } catch (error: any) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

/**
 * Create a new user in Realtime Database
 */
export async function createUserProfile(userData: Partial<DbUser>): Promise<boolean> {
    try {
        if (!userData.uid) return false;

        const newUser: DbUser = {
            uid: userData.uid,
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role || 'user',
            photoURL: userData.photoURL || null,
            phone: userData.phone || null,
            phoneVerified: userData.phoneVerified || false,
            provider: userData.provider || 'password',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            cannotUseCOD: userData.cannotUseCOD || false,
        };

        if (!firebaseDatabase) {
            // Fallback
            const users = JSON.parse(localStorage.getItem('taruvae-users-data') || '{}');
            users[userData.uid] = newUser;
            localStorage.setItem('taruvae-users-data', JSON.stringify(users));
            return true;
        }

        await set(ref(firebaseDatabase, `users/${userData.uid}`), newUser);
        return true;
    } catch (error: any) {
        console.error('Error creating user profile:', error);
        return false;
    }
}

/**
 * Update user in Realtime Database
 */
export async function updateUserProfile(uid: string, updates: Partial<DbUser>): Promise<boolean> {
    try {
        if (!firebaseDatabase) {
            const users = JSON.parse(localStorage.getItem('taruvae-users-data') || '{}');
            if (users[uid]) {
                users[uid] = { ...users[uid], ...updates, lastLoginAt: new Date().toISOString() };
                localStorage.setItem('taruvae-users-data', JSON.stringify(users));
            }
            return true;
        }

        await update(ref(firebaseDatabase, `users/${uid}`), {
            ...updates,
            lastLoginAt: new Date().toISOString()
        });
        return true;
    } catch (error: any) {
        console.error('Error updating user profile:', error);
        return false;
    }
}

// ============================================================================
// GOOGLE SIGN-IN FUNCTIONS
// ============================================================================

export async function signInWithGoogle(): Promise<GoogleLoginResult> {
    if (typeof window === 'undefined') {
        return { success: false, isNewUser: false, needsPhoneVerification: false, user: null, error: 'Client side only' };
    }

    try {
        const authInstance = firebaseAuth;
        let finalProvider = googleProvider;

        if (!finalProvider && authInstance) {
            try {
                const { getGoogleAuthProvider } = await import('./firebase');
                finalProvider = getGoogleAuthProvider();
            } catch (e) { }
        }

        if (!authInstance || !finalProvider) {
            console.error('[AuthHelpers] Missing required arguments:', {
                hasAuth: !!authInstance,
                hasProvider: !!finalProvider
            });
            return { success: false, isNewUser: false, needsPhoneVerification: false, user: null, error: 'Authentication service not fully ready. Please try again or refresh the page.' };
        }

        console.log('[AuthHelpers] Initiating Google Sign-In', {
            authApp: authInstance.app?.name,
            providerId: finalProvider.providerId
        });

        const result: UserCredential = await signInWithPopup(authInstance, finalProvider);
        const firebaseUser = result.user;

        if (!firebaseUser) return { success: false, isNewUser: false, needsPhoneVerification: false, user: null, error: 'No user info' };

        // Check if user exists in RTDB
        const existingUser = await getUserProfile(firebaseUser.uid);

        if (existingUser) {
            await updateUserProfile(firebaseUser.uid, {
                lastLoginAt: new Date().toISOString(),
                ...(firebaseUser.photoURL && firebaseUser.photoURL !== existingUser.photoURL && { photoURL: firebaseUser.photoURL }),
            });

            return {
                success: true,
                isNewUser: false,
                needsPhoneVerification: !existingUser.phone,
                user: { ...existingUser, role: existingUser.role || 'user' }
            };
        }

        // New User
        const newUser: DbUser = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            role: 'user',
            photoURL: firebaseUser.photoURL,
            phone: null,
            phoneVerified: false,
            provider: 'google',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
        };

        await createUserProfile(newUser);

        return {
            success: true,
            isNewUser: true,
            needsPhoneVerification: true,
            user: newUser
        };

    } catch (error: any) {
        console.error('Google sign in error', error);
        return { success: false, isNewUser: false, needsPhoneVerification: false, user: null, error: error.message };
    }
}

// ============================================================================
// PHONE VERIFICATION FUNCTIONS
// ============================================================================

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

export function initRecaptcha(buttonId: string): RecaptchaVerifier | null {
    try {
        if (!firebaseAuth) return null;
        if (recaptchaVerifier) recaptchaVerifier.clear();

        recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, buttonId, {
            size: 'invisible',
            callback: () => { },
            'expired-callback': () => { recaptchaVerifier = null; },
        });
        return recaptchaVerifier;
    } catch (error) {
        console.error('Recaptcha init error', error);
        return null;
    }
}

export async function sendPhoneOTP(phoneNumber: string): Promise<PhoneVerificationResult> {
    if (typeof window === 'undefined' || !firebaseAuth) return { success: false, error: 'Auth not ready' };

    try {
        const formattedPhone = phoneNumber.startsWith('+91')
            ? phoneNumber
            : `+91${phoneNumber.replace(/^0+/, '')}`;

        if (!recaptchaVerifier) return { success: false, error: 'Recaptcha missing' };

        confirmationResult = await signInWithPhoneNumber(firebaseAuth, formattedPhone, recaptchaVerifier);
        return { success: true, confirmationResult };
    } catch (error: any) {
        console.error('OTP Send Error', error);
        return { success: false, error: error.message || 'Failed to send OTP' };
    }
}

export async function verifyPhoneOTP(otp: string, uid: string): Promise<OTPVerificationResult> {
    try {
        if (!confirmationResult) return { success: false, error: 'No OTP request found' };

        const result = await confirmationResult.confirm(otp);
        const phoneNumber = result.user?.phoneNumber;

        if (!phoneNumber) return { success: false, error: 'Phone verification failed' };

        await updateUserProfile(uid, {
            phone: phoneNumber,
            phoneVerified: true
        });

        confirmationResult = null;
        return { success: true };
    } catch (error: any) {
        console.error('OTP Verify Error', error);
        return { success: false, error: error.message || 'Invalid OTP' };
    }
}

export async function linkPhoneToUser(uid: string, phoneNumber: string): Promise<OTPVerificationResult> {
    try {
        const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
        await updateUserProfile(uid, {
            phone: formattedPhone,
            phoneVerified: false
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export function clearRecaptcha() {
    if (recaptchaVerifier) {
        try { recaptchaVerifier.clear(); } catch (e) { }
        recaptchaVerifier = null;
    }
    confirmationResult = null;
}

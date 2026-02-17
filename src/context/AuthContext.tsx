'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/config';
// Get auth instance safely (only on client)
const auth = firebaseAuth;
import {
    signInWithGoogle as googleSignIn,
    getUserProfile,
    createUserProfile,
    updateUserProfile,
    GoogleLoginResult,
    DbUser as FirestoreUser
} from '@/lib/authHelpers';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

import { User } from '@/types';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
    register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; message: string }>;
    loginWithGoogle: () => Promise<GoogleLoginResult>;
    logout: () => Promise<void>;
    updateUserPhone: (phone: string, verified: boolean) => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    loading: boolean;
    needsPhoneVerification: boolean;
    setNeedsPhoneVerification: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// AUTH PROVIDER COMPONENT
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);

    // ========================================================================
    // FIREBASE AUTH STATE LISTENER - PERSISTENT AUTH
    // ========================================================================
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Get auth instance (will initialize Firebase if needed)
                const authInstance = firebaseAuth;

                if (!authInstance || !authInstance.app) {
                    // Fallback to localStorage-based auth
                    const savedUser = localStorage.getItem('taruvae-user');
                    const rememberMe = localStorage.getItem('taruvae-remember-me') === 'true';

                    if (savedUser && rememberMe && mounted) {
                        try {
                            const userData = JSON.parse(savedUser);
                            setUser(userData);
                        } catch (error) {
                            // Silently handle error
                        }
                    } else if (savedUser && !rememberMe) {
                        localStorage.removeItem('taruvae-user');
                    }
                    if (mounted) setLoading(false);
                    return;
                }

                // Listen to Firebase auth state changes - PERSISTENT until explicit logout
                unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser: FirebaseUser | null) => {
                    if (!mounted) return;

                    if (firebaseUser) {
                        // User is authenticated - restore session
                        try {
                            // Check Realtime Database for complete user data
                            let firestoreData = await getUserProfile(firebaseUser.uid);

                            // Build user object
                            const userData: User = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                name: firestoreData?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                                role: (firebaseUser.email === 'keshavvijay1723@gmail.com' || firestoreData?.role === 'admin') ? 'admin' : 'user',
                                phone: firestoreData?.phone || firebaseUser.phoneNumber || null,
                                phoneVerified: firestoreData?.phoneVerified || !!firebaseUser.phoneNumber,
                                createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                                lastLoginAt: new Date().toISOString(),
                                photoURL: firebaseUser.photoURL || firestoreData?.photoURL || null,
                                provider: (firestoreData?.provider as 'google' | 'password') || (firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'password'),
                            };

                            // For email users, also check localStorage for phone
                            if (userData.provider === 'password' && !userData.phone) {
                                const emailUsers = JSON.parse(localStorage.getItem('taruvae-email-users') || '[]');
                                const emailUserData = emailUsers.find((u: any) => u.uid === firebaseUser.uid);
                                if (emailUserData?.phone) {
                                    userData.phone = emailUserData.phone;
                                }
                                if (emailUserData?.name) {
                                    userData.name = emailUserData.name;
                                }
                            }

                            // [ADD-ON] If phone is still missing, try to get it from their last order
                            if (!userData.phone) {
                                try {
                                    const { getAllOrdersFromFirebase } = await import('@/lib/firebaseOrders');
                                    const orders = await getAllOrdersFromFirebase(firebaseUser.uid);
                                    if (orders && orders.length > 0) {
                                        const sortedOrders = orders.sort((a, b) =>
                                            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
                                        );
                                        const lastPhone = sortedOrders[0]?.customer?.phone;
                                        if (lastPhone) {
                                            userData.phone = lastPhone;
                                            // Update DB permanently
                                            await updateUserProfile(firebaseUser.uid, { phone: lastPhone });
                                        }
                                    }
                                } catch (err) {
                                    console.warn('Silent sync from orders failed', err);
                                }
                            }

                            if (mounted) {
                                setUser(userData);
                                // Save to localStorage for persistence
                                localStorage.setItem('taruvae-user', JSON.stringify(userData));
                                localStorage.setItem('taruvae-remember-me', 'true');

                                // Check if phone number is missing
                                if (!userData.phone || userData.phone.trim() === '') {
                                    setNeedsPhoneVerification(true);
                                }
                            }
                        } catch (error) {
                            console.error('Error loading user data:', error);
                        }
                    } else {
                        setUser(null);
                        setNeedsPhoneVerification(false);
                    }

                    if (mounted) setLoading(false);
                });
            } catch (error) {
                // Fallback to localStorage
                if (mounted) {
                    const rememberMe = localStorage.getItem('taruvae-remember-me') === 'true';
                    const savedUser = rememberMe
                        ? localStorage.getItem('taruvae-user')
                        : sessionStorage.getItem('taruvae-user') || localStorage.getItem('taruvae-user');

                    if (savedUser) {
                        try {
                            setUser(JSON.parse(savedUser));
                        } catch (error) {
                            // Silently handle error
                        }
                    }
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        return () => {
            mounted = false;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // ========================================================================
    // GOOGLE SIGN-IN
    // ========================================================================
    const loginWithGoogle = useCallback(async (): Promise<GoogleLoginResult> => {
        try {
            const result = await googleSignIn();

            if (result.success && result.user) {
                // Update local user state
                const userData: User = {
                    uid: result.user.uid,
                    email: result.user.email,
                    name: result.user.name,
                    role: result.user.role || 'user',
                    phone: result.user.phone,
                    phoneVerified: result.user.phoneVerified,
                    createdAt: new Date().toISOString(),
                    lastLoginAt: new Date().toISOString(),
                    photoURL: result.user.photoURL,
                    provider: 'google',
                };

                setUser(userData);
                localStorage.setItem('taruvae-user', JSON.stringify(userData));
                localStorage.setItem('taruvae-remember-me', 'true');

                // Check if phone number is missing
                if (result.needsPhoneVerification || !result.user?.phone || result.user.phone.trim() === '') {
                    setNeedsPhoneVerification(true);
                }
            }

            return result;
        } catch (error: any) {
            console.error('Google login error:', error);
            return {
                success: false,
                isNewUser: false,
                needsPhoneVerification: false,
                user: null,
                error: error.message || 'Failed to sign in with Google',
            };
        }
    }, []);

    // ========================================================================
    // EMAIL REGISTRATION
    // ========================================================================
    const register = useCallback(async (
        name: string,
        email: string,
        phone: string,
        password: string
    ): Promise<{ success: boolean; message: string }> => {
        try {
            if (password.length < 6) {
                return { success: false, message: 'Password should be at least 6 characters' };
            }

            // Check localStorage first
            const usersList = JSON.parse(localStorage.getItem('taruvae-users') || '[]');
            const existingUser = usersList.find((u: any) => u.email === email);

            if (existingUser) {
                return { success: false, message: 'Email already registered. Please login instead.' };
            }

            // Try Firebase registration
            const authInstance = firebaseAuth;
            if (authInstance && authInstance.app) {
                try {
                    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);

                    if (userCredential.user) {
                        // Create RTDB user document
                        await createUserProfile({
                            uid: userCredential.user.uid,
                            email: userCredential.user.email || email,
                            name: name,
                            role: 'user',
                            phone: phone.startsWith('+91') ? phone : `+91${phone}`,
                            phoneVerified: true,
                            provider: 'password',
                        });

                        // Store in localStorage
                        const emailUsers = JSON.parse(localStorage.getItem('taruvae-email-users') || '[]');
                        emailUsers.push({ uid: userCredential.user.uid, phone, name });
                        localStorage.setItem('taruvae-email-users', JSON.stringify(emailUsers));
                    }

                    return { success: true, message: 'Registration successful!' };
                } catch (firebaseError: any) {
                    if (firebaseError.code === 'auth/email-already-in-use') {
                        return { success: false, message: 'Email already registered. Please login instead.' };
                    }
                }
            }

            // Fallback to localStorage
            const newUser: User = {
                uid: `user-${Date.now()}`,
                email,
                name,
                role: 'user',
                phone: phone.startsWith('+91') ? phone : `+91${phone}`,
                phoneVerified: true,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                provider: 'password',
            };

            const { createdAt: _, lastLoginAt: __, ...userForFirestore } = newUser;
            await createUserProfile(userForFirestore as any);

            const userData = { ...newUser, password };
            usersList.push(userData);
            localStorage.setItem('taruvae-users', JSON.stringify(usersList));

            localStorage.setItem('taruvae-user', JSON.stringify(newUser));
            localStorage.setItem('taruvae-remember-me', 'true');
            setUser(newUser);

            return { success: true, message: 'Registration successful!' };
        } catch (error: any) {
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    }, []);

    // ========================================================================
    // EMAIL LOGIN
    // ========================================================================
    const login = useCallback(async (
        email: string,
        password: string,
        rememberMe: boolean = true
    ): Promise<{ success: boolean; message: string }> => {
        try {
            // Try Firebase login first
            const authInstance = firebaseAuth;
            if (authInstance && authInstance.app) {
                try {
                    await signInWithEmailAndPassword(authInstance, email, password);
                    return { success: true, message: 'Login successful!' };
                } catch (firebaseError: any) {
                    // Fallback check
                }
            }

            // Fallback to localStorage
            const usersList = JSON.parse(localStorage.getItem('taruvae-users') || '[]');
            const userData = usersList.find((u: any) => u.email === email && u.password === password);

            if (!userData) {
                return { success: false, message: 'Invalid email or password' };
            }

            const { password: _, ...userWithoutPassword } = userData;

            if (rememberMe) {
                localStorage.setItem('taruvae-user', JSON.stringify(userWithoutPassword));
                localStorage.setItem('taruvae-remember-me', 'true');
            } else {
                sessionStorage.setItem('taruvae-user', JSON.stringify(userWithoutPassword));
                localStorage.setItem('taruvae-remember-me', 'false');
            }

            setUser(userWithoutPassword);

            await updateUserProfile(userWithoutPassword.uid, {
                lastLoginAt: new Date().toISOString(),
            });

            return { success: true, message: 'Login successful!' };
        } catch (error: any) {
            return { success: false, message: 'Invalid email or password' };
        }
    }, []);

    // ========================================================================
    // UPDATE USER PHONE
    // ========================================================================
    const updateUserPhone = useCallback(async (phone: string, verified: boolean) => {
        if (!user) return;

        const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

        await updateUserProfile(user.uid, {
            phone: formattedPhone,
            phoneVerified: false,
        });

        const updatedUser: User = {
            ...user,
            phone: formattedPhone,
            phoneVerified: false,
        };

        setUser(updatedUser);
        localStorage.setItem('taruvae-user', JSON.stringify(updatedUser));
        setNeedsPhoneVerification(false);
    }, [user]);

    // ========================================================================
    // LOGOUT
    // ========================================================================
    const logout = useCallback(async () => {
        try {
            sessionStorage.setItem('explicit-logout', 'true');
            setUser(null);
            setNeedsPhoneVerification(false);
            localStorage.removeItem('taruvae-user');
            localStorage.removeItem('taruvae-remember-me');
            sessionStorage.removeItem('taruvae-user');

            const authInstance = firebaseAuth;
            if (authInstance && authInstance.app) {
                await firebaseSignOut(authInstance);
            }
        } catch (error) {
            setUser(null);
            setNeedsPhoneVerification(false);
            localStorage.removeItem('taruvae-user');
            localStorage.removeItem('taruvae-remember-me');
            sessionStorage.removeItem('taruvae-user');
            sessionStorage.setItem('explicit-logout', 'true');
        }
    }, []);

    const isAdmin = user?.role === 'admin';

    // ========================================================================
    // PROVIDER
    // ========================================================================
    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                loginWithGoogle,
                logout,
                updateUserPhone,
                isAuthenticated: !!user,
                isAdmin,
                loading,
                needsPhoneVerification,
                setNeedsPhoneVerification,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

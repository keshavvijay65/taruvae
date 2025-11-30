'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    createdAt: string;
    photoURL?: string;
    provider?: 'email' | 'google';
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
    register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if auth is properly initialized and Firebase functions are available
        try {
            if (!auth || typeof auth === 'object' && Object.keys(auth).length === 0 || !auth.app || !onAuthStateChanged) {
                // Fallback to localStorage-based auth - Auto-login if user data exists
                const savedUser = localStorage.getItem('taruvae-user');
                const rememberMe = localStorage.getItem('taruvae-remember-me') === 'true';
                
                if (savedUser && rememberMe) {
                    try {
                        const userData = JSON.parse(savedUser);
                        setUser(userData);
                        // User is automatically logged in
                    } catch (error) {
                        // Silently handle error
                    }
                } else if (savedUser && !rememberMe) {
                    // If remember me was not checked, clear saved user
                    localStorage.removeItem('taruvae-user');
                }
                setLoading(false);
                return;
            }

            // Listen to Firebase auth state changes
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
            if (firebaseUser) {
                // User is signed in with Firebase
                const userData: User = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    phone: firebaseUser.phoneNumber || undefined,
                    createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                    photoURL: firebaseUser.photoURL || undefined,
                    provider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
                };
                
                // Also check localStorage for additional data (like phone for email users)
                if (userData.provider === 'email') {
                    const emailUsers = JSON.parse(localStorage.getItem('taruvae-email-users') || '[]');
                    const emailUserData = emailUsers.find((u: any) => u.uid === firebaseUser.uid);
                    if (emailUserData && emailUserData.phone) {
                        userData.phone = emailUserData.phone;
                    }
                    if (emailUserData && emailUserData.name) {
                        userData.name = emailUserData.name;
                    }
                }
                
                setUser(userData);
                // Always save to localStorage for Firebase users (they're already authenticated)
                localStorage.setItem('taruvae-user', JSON.stringify(userData));
                localStorage.setItem('taruvae-remember-me', 'true');
            } else {
                // User is signed out - clear all user data
                localStorage.removeItem('taruvae-user');
                sessionStorage.removeItem('taruvae-user');
                localStorage.removeItem('taruvae-remember-me');
                setUser(null);
            }
            setLoading(false);
        });

            return () => unsubscribe();
        } catch (error) {
            // If Firebase auth fails, use localStorage fallback
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
    }, []);

    const register = async (name: string, email: string, phone: string, password: string): Promise<{ success: boolean; message: string }> => {
        try {
            if (password.length < 6) {
                return { success: false, message: 'Password should be at least 6 characters' };
            }
            
            // Check localStorage first to avoid duplicate registration
            const users = JSON.parse(localStorage.getItem('taruvae-users') || '[]');
            const existingUser = users.find((u: any) => u.email === email);
            
            if (existingUser) {
                return { success: false, message: 'Email already registered. Please login instead.' };
            }
            
            // Try Firebase registration first if available
            if (auth && auth.app && createUserWithEmailAndPassword) {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    
                    if (userCredential.user) {
                        const userData: User = {
                            id: userCredential.user.uid,
                            email: userCredential.user.email || email,
                            name: name,
                            phone: phone,
                            createdAt: userCredential.user.metadata.creationTime || new Date().toISOString(),
                            provider: 'email',
                        };
                        
                        // Save user profile to Firebase
                        try {
                            const { saveUserProfileToFirebase } = await import('@/lib/firebaseOrders');
                            await saveUserProfileToFirebase({
                                id: userData.id,
                                email: userData.email,
                                name: userData.name,
                                phone: userData.phone,
                                createdAt: userData.createdAt,
                                provider: userData.provider,
                            });
                        } catch (error) {
                            console.log('Could not save user profile to Firebase:', error);
                        }
                        
                        // Store phone in localStorage for email users
                        const emailUsers = JSON.parse(localStorage.getItem('taruvae-email-users') || '[]');
                        const existingIndex = emailUsers.findIndex((u: any) => u.uid === userCredential.user.uid);
                        if (existingIndex >= 0) {
                            emailUsers[existingIndex] = { uid: userCredential.user.uid, phone, name };
                        } else {
                            emailUsers.push({ uid: userCredential.user.uid, phone, name });
                        }
                        localStorage.setItem('taruvae-email-users', JSON.stringify(emailUsers));
                    }
                    
                    return { success: true, message: 'Registration successful!' };
                } catch (firebaseError: any) {
                    // If Firebase API key is invalid, silently fallback to localStorage
                    if (firebaseError.code === 'auth/api-key-not-valid' || 
                        firebaseError.code === 'auth/invalid-api-key' ||
                        firebaseError.message?.includes('api-key')) {
                        // Silently fallback to localStorage
                    } else if (firebaseError.code === 'auth/email-already-in-use') {
                        // Check localStorage too
                        if (existingUser) {
                            return { success: false, message: 'Email already registered. Please login instead.' };
                        }
                        // Fallback to localStorage
                    } else if (firebaseError.code === 'auth/weak-password') {
                        return { success: false, message: 'Password should be at least 6 characters' };
                    } else {
                        // For other errors, fallback to localStorage
                    }
                }
            }
            
            // Fallback to localStorage
            const newUser: User = {
                id: `user-${Date.now()}`,
                email,
                name,
                phone,
                createdAt: new Date().toISOString(),
                provider: 'email',
            };
            
            // Try to save user profile to Firebase even if using localStorage fallback
            try {
                const { saveUserProfileToFirebase } = await import('@/lib/firebaseOrders');
                await saveUserProfileToFirebase({
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    phone: newUser.phone,
                    createdAt: newUser.createdAt,
                    provider: newUser.provider,
                });
            } catch (error) {
                console.log('Could not save user profile to Firebase:', error);
            }
            
            const userData = {
                ...newUser,
                password,
            };
            
            users.push(userData);
            localStorage.setItem('taruvae-users', JSON.stringify(users));
            
            // Auto-login after registration with remember me
            localStorage.setItem('taruvae-user', JSON.stringify(newUser));
            localStorage.setItem('taruvae-remember-me', 'true');
            setUser(newUser);
            
            return { success: true, message: 'Registration successful!' };
        } catch (error: any) {
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    };

    const login = async (email: string, password: string, rememberMe: boolean = true): Promise<{ success: boolean; message: string }> => {
        try {
            // Try Firebase login first if available
            if (auth && auth.app && signInWithEmailAndPassword) {
                try {
                    await signInWithEmailAndPassword(auth, email, password);
                    return { success: true, message: 'Login successful!' };
                } catch (firebaseError: any) {
                    // If Firebase API key is invalid or Firebase is not configured, silently fallback to localStorage
                    if (firebaseError.code === 'auth/api-key-not-valid' || 
                        firebaseError.code === 'auth/invalid-api-key' ||
                        firebaseError.message?.includes('api-key')) {
                        // Silently fallback to localStorage - don't show Firebase error
                    } else {
                        // Other Firebase errors - check if user exists in localStorage first
                        // If not found, show Firebase error
                        const users = JSON.parse(localStorage.getItem('taruvae-users') || '[]');
                        const userData = users.find((u: any) => u.email === email && u.password === password);
                        
                        if (userData) {
                            // User exists in localStorage, use that instead
                        } else {
                            // User doesn't exist in localStorage, show Firebase error
                            if (firebaseError.code === 'auth/user-not-found') {
                                return { success: false, message: 'No account found with this email' };
                            }
                            if (firebaseError.code === 'auth/wrong-password') {
                                return { success: false, message: 'Incorrect password' };
                            }
                            if (firebaseError.code === 'auth/invalid-email') {
                                return { success: false, message: 'Invalid email format' };
                            }
                            // For other Firebase errors, fallback to localStorage
                        }
                    }
                }
            }
            
            // Fallback to localStorage
            const users = JSON.parse(localStorage.getItem('taruvae-users') || '[]');
            const userData = users.find((u: any) => u.email === email && u.password === password);
            
            if (!userData) {
                return { success: false, message: 'Invalid email or password' };
            }
            
            const { password: _, ...userWithoutPassword } = userData;
            
            // Save user data and remember me preference
            if (rememberMe) {
                localStorage.setItem('taruvae-user', JSON.stringify(userWithoutPassword));
                localStorage.setItem('taruvae-remember-me', 'true');
            } else {
                // For session-only login, use sessionStorage
                sessionStorage.setItem('taruvae-user', JSON.stringify(userWithoutPassword));
                localStorage.setItem('taruvae-remember-me', 'false');
            }
            
            setUser(userWithoutPassword);
            
            // Save user profile to Firebase on login
            try {
                const { saveUserProfileToFirebase } = await import('@/lib/firebaseOrders');
                await saveUserProfileToFirebase({
                    id: userWithoutPassword.id,
                    email: userWithoutPassword.email,
                    name: userWithoutPassword.name,
                    phone: userWithoutPassword.phone,
                    createdAt: userWithoutPassword.createdAt,
                    provider: userWithoutPassword.provider,
                    photoURL: userWithoutPassword.photoURL,
                    lastLogin: new Date().toISOString(),
                });
            } catch (error) {
                console.log('Could not save user profile to Firebase:', error);
            }
            
            return { success: true, message: 'Login successful!' };
        } catch (error: any) {
            // Don't expose Firebase errors to users
            return { success: false, message: 'Invalid email or password' };
        }
    };

    const logout = async () => {
        try {
            // Clear user state first to prevent re-authentication
            setUser(null);
            
            // Clear all storage
            localStorage.removeItem('taruvae-user');
            localStorage.removeItem('taruvae-remember-me');
            sessionStorage.removeItem('taruvae-user');
            
            // Try Firebase logout if available
            if (auth && auth.app && firebaseSignOut) {
                try {
                    await firebaseSignOut(auth);
                } catch (error) {
                    // Ignore Firebase errors if Firebase is not configured
                    console.log('Firebase logout skipped');
                }
            }
        } catch (error) {
            // Ensure cleanup even if there's an error
            setUser(null);
            localStorage.removeItem('taruvae-user');
            localStorage.removeItem('taruvae-remember-me');
            sessionStorage.removeItem('taruvae-user');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                isAuthenticated: !!user,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}


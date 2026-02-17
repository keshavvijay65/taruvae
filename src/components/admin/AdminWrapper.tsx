'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminWrapper({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    // Add state to track if we've checked local auth to prevent hydration mismatch
    const [isLocalAuthChecked, setIsLocalAuthChecked] = useState(false);

    useEffect(() => {
        // Check for local admin authentication (Simple ID/Pass)
        const localAuth = localStorage.getItem('admin-authenticated');
        if (localAuth === 'true') {
            setIsAuthorized(true);
            setIsLocalAuthChecked(true); // Mark as checked
            return;
        }
        setIsLocalAuthChecked(true); // Mark as checked even if failed

        // Fallback to Firebase Auth (if user still wants to use Google login method later)
        // Did auth finish loading?
        if (!loading) {

            // Case 1: No user at all -> Redirect
            if (!user) {
                // console.log('[AdminWrapper] No user found. Redirecting.');
                // router.replace('/');
                return;
            }

            // Case 2: User exists, but not admin -> Redirect
            if (!isAdmin) {
                // console.log('[AdminWrapper] User role is', user.role, 'expected admin. Redirecting.');
                // router.replace('/');
                return;
            }

            // Case 3: Admin -> Allow
            setIsAuthorized(true);
        }
    }, [user, isAdmin, loading, router]);

    // Show loading spinner if:
    // 1. We haven't checked local auth yet (prevent hydration mismatch)
    // 2. OR AuthContext is loading AND we are not authorized yet
    if (!isLocalAuthChecked || (loading && !isAuthorized)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                </div>
            </div>
        );
    }

    // 2. Auth done, but no user or not admin
    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-8">
                        {!user ? 'You must be logged in to access this area.' : `Current user (${user.email}) does not have admin privileges.`}
                    </p>

                    <div className="flex flex-col gap-3">
                        {!user ? (
                            <button
                                onClick={() => router.push('/login?redirect=/admin')}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Login as Admin
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    // Optional: Add a logout handler if available in context, or just redirect home
                                    router.push('/');
                                }}
                                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors"
                            >
                                Return Home
                            </button>
                        )}
                        <button
                            onClick={() => router.push('/')}
                            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Go back to store
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

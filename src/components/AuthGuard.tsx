'use client';

/**
 * AuthGuard Component
 * ===================
 * Protects routes from unauthenticated access.
 * 
 * Usage:
 * <AuthGuard requirePhoneVerification>
 *   <ProtectedContent />
 * </AuthGuard>
 */

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
    children: ReactNode;
    /** If true, also requires phone verification (for Google users) */
    requirePhoneVerification?: boolean;
    /** Custom redirect URL (default: /login) */
    redirectTo?: string;
    /** Loading component to show while checking auth */
    loadingComponent?: ReactNode;
}

export default function AuthGuard({
    children,
    requirePhoneVerification = false,
    redirectTo = '/login',
    loadingComponent,
}: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, loading, user, needsPhoneVerification } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                // Redirect to login with return URL
                router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
            } else if (requirePhoneVerification && needsPhoneVerification) {
                // Redirect to phone verification
                router.push(`/verify-phone?redirect=${encodeURIComponent(pathname)}`);
            }
        }
    }, [isAuthenticated, loading, requirePhoneVerification, needsPhoneVerification, router, pathname, redirectTo]);

    // Show loading state
    if (loading) {
        return loadingComponent || (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-soft to-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show nothing (redirect will happen)
    if (!isAuthenticated) {
        return loadingComponent || (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-soft to-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    // Needs phone verification
    if (requirePhoneVerification && needsPhoneVerification) {
        return loadingComponent || (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-soft to-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying account...</p>
                </div>
            </div>
        );
    }

    // Authenticated (and phone verified if required) - render children
    return <>{children}</>;
}

/**
 * Hook to check if current user can access protected features
 */
export function useAuthGuard(requirePhoneVerification = false) {
    const { isAuthenticated, loading, needsPhoneVerification } = useAuth();

    const canAccess = isAuthenticated && (!requirePhoneVerification || !needsPhoneVerification);

    return {
        canAccess,
        loading,
        isAuthenticated,
        needsPhoneVerification,
    };
}

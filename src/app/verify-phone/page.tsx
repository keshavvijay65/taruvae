'use client';

/**
 * Phone Number Entry Page
 * =======================
 * Required for users without phone number.
 * Simple phone input - NO OTP verification.
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { linkPhoneToUser } from '@/lib/authHelpers';

// ============================================================================
// PHONE ENTRY CONTENT
// ============================================================================
function VerifyPhoneContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, loading: authLoading, updateUserPhone } = useAuth();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get redirect URL
    const redirectTo = searchParams.get('redirect') || '/account';

    // ========================================================================
    // EFFECTS
    // ========================================================================

    // Redirect if not authenticated or already has phone
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push('/login');
                return;
            }

            // If user already has phone number, redirect
            if (user?.phone) {
                router.push(redirectTo);
            }
        }
    }, [authLoading, isAuthenticated, user, router, redirectTo]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleSavePhone = async () => {
        // Validate phone number format
        const cleanedPhone = phoneNumber.replace(/\D/g, '');

        if (cleanedPhone.length !== 10) {
            setError('Phone number is required');
            return;
        }

        if (!user) {
            setError('User session expired. Please login again.');
            router.push('/login');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Format phone number with country code
            const formattedPhone = `+91${cleanedPhone}`;

            // Save phone number to user profile
            await linkPhoneToUser(user.id, formattedPhone);
            await updateUserPhone(formattedPhone, false);

            // Redirect to intended destination
            router.push(redirectTo);
        } catch (err: any) {
            setError(err.message || 'Failed to save phone number');
        } finally {
            setLoading(false);
        }
    };

    // ========================================================================
    // LOADING STATE
    // ========================================================================
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-[calc(var(--header-height,80px)+2rem)]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#2D5016] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER
    // ========================================================================
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-[calc(var(--header-height,80px)+2rem)] pb-12 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 w-full max-w-md border-2 border-gray-100">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#2D5016] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-[#2D5016] mb-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        Enter Your Phone Number
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Please enter your phone number to complete registration
                    </p>
                </div>

                {/* User Info */}
                {user && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center gap-3">
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.name}
                                className="w-10 h-10 rounded-full"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-[#2D5016] rounded-full flex items-center justify-center text-white font-bold">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                    </div>
                )}

                {/* Phone Input */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex">
                            <span className="inline-flex items-center px-4 border-2 border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-gray-600 font-medium">
                                +91
                            </span>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setPhoneNumber(value);
                                    setError('');
                                }}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-[#2D5016] text-lg tracking-wide"
                                placeholder="Enter 10-digit number"
                                maxLength={10}
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                        )}
                    </div>

                    <button
                        onClick={handleSavePhone}
                        disabled={loading || phoneNumber.replace(/\D/g, '').length !== 10}
                        className="w-full bg-[#2D5016] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#4A7C2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </span>
                        ) : (
                            'Continue'
                        )}
                    </button>
                </div>

                {/* Info */}
                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 text-center">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Your phone number will be securely linked to your account for order updates.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function VerifyPhonePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-[#FDF8F1] to-white">

            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                    <div className="w-16 h-16 border-4 border-[#2D5016] border-t-transparent rounded-full animate-spin"></div>
                </div>
            }>
                <VerifyPhoneContent />
            </Suspense>

        </div>
    );
}

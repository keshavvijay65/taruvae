'use client';

/**
 * Login Page
 * ==========
 * Supports:
 * - Email/Password login & registration
 * - Google Sign-in
 * - Remember me functionality
 * - Redirect to phone verification for new Google users
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// ============================================================================
// LOGIN CONTENT COMPONENT (Uses useSearchParams)
// ============================================================================
function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        login,
        register,
        loginWithGoogle,
        isAuthenticated,
        loading: authLoading,
        needsPhoneVerification
    } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    // Get redirect URL from query params
    const redirectTo = searchParams.get('redirect') || '/account';

    // ========================================================================
    // REDIRECT LOGIC
    // ========================================================================
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            if (needsPhoneVerification) {
                // Redirect to phone verification with return URL
                router.push(`/verify-phone?redirect=${encodeURIComponent(redirectTo)}`);
            } else {
                router.push(redirectTo);
            }
        }
    }, [isAuthenticated, authLoading, needsPhoneVerification, router, redirectTo]);

    // ========================================================================
    // HANDLERS
    // ========================================================================
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const result = await login(formData.email, formData.password, rememberMe);
                if (result.success) {
                    router.push(redirectTo);
                } else {
                    setError(result.message);
                }
            } else {
                // Registration validation
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                if (formData.password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }
                if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
                    setError('Please enter a valid 10-digit phone number');
                    setLoading(false);
                    return;
                }

                const result = await register(
                    formData.name,
                    formData.email,
                    formData.phone,
                    formData.password
                );
                if (result.success) {
                    router.push(redirectTo);
                } else {
                    setError(result.message);
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setGoogleLoading(true);

        try {
            const result = await loginWithGoogle();

            if (result.success) {
                if (result.needsPhoneVerification) {
                    // Redirect to phone verification
                    router.push(`/verify-phone?redirect=${encodeURIComponent(redirectTo)}`);
                } else {
                    router.push(redirectTo);
                }
            } else {
                setError(result.error || 'Failed to sign in with Google');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during Google sign-in');
        } finally {
            setGoogleLoading(false);
        }
    };

    // ========================================================================
    // LOADING STATE
    // ========================================================================
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-[calc(var(--header-height,80px)+2rem)]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-dark border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
                    <div className="w-16 h-16 bg-brand-dark rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-brand-dark mb-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-gray-600">
                        {isLogin ? 'Sign in to track your orders' : 'Join us for a natural experience'}
                    </p>
                </div>

                {/* Google Sign-in Button */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                >
                    {googleLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <>
                            {/* Google Icon */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span>Continue with Google</span>
                        </>
                    )}
                </button>

                {/* Divider */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">or continue with email</span>
                    </div>
                </div>

                {/* Login/Register Toggle */}
                <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => {
                            setIsLogin(true);
                            setError('');
                        }}
                        className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${isLogin
                            ? 'bg-brand-dark text-white'
                            : 'text-gray-600 hover:text-brand-dark'
                            }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => {
                            setIsLogin(false);
                            setError('');
                        }}
                        className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${!isLogin
                            ? 'bg-brand-dark text-white'
                            : 'text-gray-600 hover:text-brand-dark'
                            }`}
                    >
                        Register
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-brand-dark"
                                    placeholder="Enter your name"
                                    required={!isLogin}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 border-2 border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-gray-600 text-sm">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setFormData(prev => ({ ...prev, phone: value }));
                                            setError('');
                                        }}
                                        maxLength={10}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-[#2D5016]"
                                        placeholder="10-digit number"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-[#2D5016]"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-[#2D5016]"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-[#2D5016]"
                                placeholder="Confirm password"
                                required
                            />
                        </div>
                    )}

                    {isLogin && (
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-brand-dark border-gray-300 rounded focus:ring-brand-dark"
                            />
                            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 cursor-pointer">
                                Remember me (Stay logged in)
                            </label>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="w-full bg-brand-dark text-white py-3 rounded-lg font-bold text-lg hover:bg-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
                    </button>
                </form>

                {/* Footer Links */}
                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-sm text-brand-dark hover:text-gold transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>

                {/* First-time Google users info */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 text-center">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        First-time Google users will need to verify their phone number once.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-[#FDF8F1] to-white">

            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-[calc(var(--header-height,80px)+2rem)]">
                    <div className="w-16 h-16 border-4 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
                </div>
            }>
                <LoginContent />
            </Suspense>

        </div>
    );
}

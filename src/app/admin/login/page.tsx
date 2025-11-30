'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AdminLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    // Simple password protection - you can change this password
    const ADMIN_PASSWORD = 'taruvae2024';

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            localStorage.setItem('admin-authenticated', 'true');
            router.push('/admin/dashboard');
        } else {
            setError('Incorrect password. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-[#FDF8F1] to-white">
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-8 sm:py-12 px-4">
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 w-full max-w-md border-2 border-gray-100">
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#2D5016] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#2D5016] mb-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Admin Login
                        </h1>
                        <p className="text-gray-600 text-sm sm:text-base">Enter password to access admin panel</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-[#2D5016] text-sm sm:text-base"
                                placeholder="Enter admin password"
                                required
                            />
                            {error && (
                                <p className="text-red-500 text-xs sm:text-sm mt-2">{error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#2D5016] text-white py-2.5 sm:py-3 rounded-lg font-bold text-base sm:text-lg hover:bg-[#4A7C2A] transition-colors"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
        </div>
    );
}



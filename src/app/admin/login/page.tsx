'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    // Simple credentials - as requested
    const ADMIN_ID = 'prishti';
    const ADMIN_PASSWORD = 'taruvae2024';

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (adminId === ADMIN_ID && password === ADMIN_PASSWORD) {
            localStorage.setItem('admin-authenticated', 'true');
            // Store timestamp to expire session eventually if needed
            localStorage.setItem('admin-auth-time', Date.now().toString());
            router.push('/admin/dashboard');
        } else {
            setError('Invalid Admin ID or Password.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#FFF9F0] to-[#FDFBF7] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-brand-beige/20 transform transition-all duration-300 hover:shadow-2xl">
                    <div className="bg-brand-dark/5 p-8 sm:p-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>

                        <div className="flex justify-center mb-8">
                            <img
                                src="/images/Logo%20%26%20favicon/Taruvae%CC%81%20Logo%20Transparent%20Rectangle.svg"
                                alt="Taruvae"
                                className="h-16 w-auto object-contain"
                            />
                        </div>

                        <h1 className="text-3xl font-bold text-brand-dark mb-2 tracking-tight" style={{ fontFamily: 'var(--font-fraunces), serif' }}>
                            Admin Access
                        </h1>
                        <p className="text-brand-brown/70 text-sm font-sans">
                            Enter your credentials to manage store
                        </p>
                    </div>

                    <div className="p-8 sm:p-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-brand-dark/80 mb-2 font-sans">
                                    Admin ID
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={adminId}
                                        onChange={(e) => {
                                            setAdminId(e.target.value);
                                            setError('');
                                        }}
                                        className="w-full px-4 py-3.5 bg-brand-light/30 border border-brand-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold text-brand-dark placeholder-brand-brown/40 transition-all duration-300 font-sans"
                                        placeholder="Enter ID"
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-brown/40">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-brand-dark/80 mb-2 font-sans">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError('');
                                        }}
                                        className="w-full px-4 py-3.5 bg-brand-light/30 border border-brand-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold text-brand-dark placeholder-brand-brown/40 transition-all duration-300 font-sans"
                                        placeholder="Enter secure password"
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand-brown/40">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                    </div>
                                </div>
                                {error && (
                                    <div className="flex items-center gap-2 mt-3 text-red-500 text-sm animate-shake">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-forest transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-brand-dark/20 flex items-center justify-center gap-2 group"
                            >
                                <span>Sign In</span>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center mt-8 text-brand-brown/40 text-sm">
                    &copy; {new Date().getFullYear()} Taruvae Admin Portal
                </p>
            </div>
        </div>
    );
}



'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Skip static generation (uses Header with useSearchParams)
export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = localStorage.getItem('admin-authenticated');
        if (auth === 'true') {
            setIsAuthenticated(true);
        } else {
            router.push('/admin/login');
        }
        setLoading(false);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('admin-authenticated');
        router.push('/admin/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Header />
            </Suspense>
                <div className="container mx-auto px-6 py-20">
                    <div className="text-center">
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
                <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Footer />
            </Suspense>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Header />
            </Suspense>
            <div className="pt-20 sm:pt-24 pb-8 md:pb-12">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Admin Dashboard
                        </h1>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                        >
                            Logout
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Products Management */}
                        <Link
                            href="/admin/products"
                            className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-[#D4AF37] transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-[#2D5016] rounded-lg flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-black group-hover:text-[#D4AF37] transition-colors">
                                    Products
                                </h2>
                            </div>
                            <p className="text-gray-600 text-sm">
                                Add, edit, or delete products. Manage categories, prices, and images.
                            </p>
                        </Link>

                        {/* Blog Management */}
                        <Link
                            href="/admin/blogs"
                            className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-[#D4AF37] transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-[#2D5016] rounded-lg flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-black group-hover:text-[#D4AF37] transition-colors">
                                    Blog
                                </h2>
                            </div>
                            <p className="text-gray-600 text-sm">
                                Create and manage blog posts. Write articles, recipes, and health tips.
                            </p>
                        </Link>

                        {/* Orders Management */}
                        <Link
                            href="/admin/orders"
                            className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-[#D4AF37] transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-[#2D5016] rounded-lg flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-black group-hover:text-[#D4AF37] transition-colors">
                                    Orders
                                </h2>
                            </div>
                            <p className="text-gray-600 text-sm">
                                View all orders, track status, and manage customer orders. Real-time updates from Firebase.
                            </p>
                        </Link>

                        {/* Customers Management */}
                        <Link
                            href="/admin/customers"
                            className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-[#D4AF37] transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-[#2D5016] rounded-lg flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-black group-hover:text-[#D4AF37] transition-colors">
                                    Customers
                                </h2>
                            </div>
                            <p className="text-gray-600 text-sm">
                                View all customers, their order history, and spending statistics.
                            </p>
                        </Link>

                        {/* Analytics */}
                        <Link
                            href="/admin/analytics"
                            className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-[#D4AF37] transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-[#2D5016] rounded-lg flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-black group-hover:text-[#D4AF37] transition-colors">
                                    Analytics
                                </h2>
                            </div>
                            <p className="text-gray-600 text-sm">
                                View sales statistics and performance metrics.
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
            <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Footer />
            </Suspense>
        </div>
    );
}


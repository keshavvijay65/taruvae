'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminWrapper from '@/components/admin/AdminWrapper';
import AdminHeader from '@/components/admin/AdminHeader';

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
            <AdminWrapper>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mb-4"></div>
                    <p className="text-brand-dark text-lg font-medium">Loading dashboard...</p>
                </div>
            </AdminWrapper>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const adminLinks = [
        {
            href: '/admin/products',
            title: 'Products',
            description: 'Add, edit, or delete products. Manage categories, prices, and images.',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            )
        },
        {
            href: '/admin/coupons',
            title: 'Coupons',
            description: 'Create and manage discount coupons. Set validity, usage limits, and discount amounts.',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
            )
        },
        {
            href: '/admin/blogs',
            title: 'Blog',
            description: 'Create and manage blog posts. Write articles, recipes, and health tips.',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            )
        },
        {
            href: '/admin/orders',
            title: 'Orders',
            description: 'View all orders, track status, and manage customer orders. Real-time updates.',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            )
        },
        {
            href: '/admin/customers',
            title: 'Customers',
            description: 'View all customers, their order history, and spending statistics.',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            href: '/admin/analytics',
            title: 'Analytics',
            description: 'View sales statistics and performance metrics.',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        }
    ];

    return (
        <AdminWrapper>
            <AdminHeader
                title="Admin Dashboard"
                subtitle="Welcome back. Manage your store's products, orders, and content."
            >
                <button
                    onClick={handleLogout}
                    className="bg-red-50 text-red-600 border border-red-200 px-6 py-2.5 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </AdminHeader>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="bg-white border border-brand-beige/30 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-light/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500"></div>

                            <div className="flex items-start gap-5 relative z-10">
                                <div className="w-14 h-14 bg-brand-dark rounded-xl flex items-center justify-center shadow-lg group-hover:bg-brand-forest transition-colors duration-300 shrink-0">
                                    {link.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-brand-dark group-hover:text-brand-forest transition-colors mb-2 tracking-tight" style={{ fontFamily: 'var(--font-fraunces), serif' }}>
                                        {link.title}
                                    </h2>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {link.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </AdminWrapper>
    );
}


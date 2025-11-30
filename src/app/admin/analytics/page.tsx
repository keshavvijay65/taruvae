'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Skip static generation for this page (uses Header with useSearchParams)
export const dynamic = 'force-dynamic';

interface Order {
    orderId: string;
    total: number;
    orderDate: string;
    status?: string;
    items: Array<{ quantity: number; price: number }>;
}

export default function AdminAnalyticsPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

    useEffect(() => {
        const auth = localStorage.getItem('admin-authenticated');
        if (auth === 'true') {
            setIsAuthenticated(true);
            loadOrders();
        } else {
            router.push('/admin/login');
        }
        setLoading(false);
    }, [router]);

    const loadOrders = () => {
        const localOrders: Order[] = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
        setOrders(localOrders);
    };

    const getFilteredOrders = () => {
        const now = new Date();
        return orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            switch (dateRange) {
                case 'today':
                    return orderDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return orderDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return orderDate >= monthAgo;
                default:
                    return true;
            }
        });
    };

    const filteredOrders = getFilteredOrders();

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalItemsSold = filteredOrders.reduce((sum, order) => 
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    const statusCounts = filteredOrders.reduce((acc, order) => {
        const status = order.status || 'confirmed';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

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
            <div className="py-8 md:py-12">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Link
                                href="/admin/dashboard"
                                className="inline-flex items-center gap-2 text-[#2D5016] hover:text-[#D4AF37] mb-4 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                Analytics Dashboard
                            </h1>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as any)}
                                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                            </select>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-green-700 mb-2">Total Revenue</h3>
                            <p className="text-3xl font-bold text-green-800">₹{totalRevenue.toLocaleString()}</p>
                            <p className="text-xs text-green-600 mt-1">{totalOrders} orders</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-blue-700 mb-2">Total Orders</h3>
                            <p className="text-3xl font-bold text-blue-800">{totalOrders}</p>
                            <p className="text-xs text-blue-600 mt-1">All time</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-purple-700 mb-2">Avg Order Value</h3>
                            <p className="text-3xl font-bold text-purple-800">₹{Math.round(averageOrderValue)}</p>
                            <p className="text-xs text-purple-600 mt-1">Per order</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-orange-700 mb-2">Items Sold</h3>
                            <p className="text-3xl font-bold text-orange-800">{totalItemsSold}</p>
                            <p className="text-xs text-orange-600 mt-1">Total units</p>
                        </div>
                    </div>

                    {/* Order Status Breakdown */}
                    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 mb-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Order Status Breakdown
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {Object.entries(statusCounts).map(([status, count]) => (
                                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-[#2D5016]">{count}</p>
                                    <p className="text-sm text-gray-600 capitalize mt-1">{status.replace('_', ' ')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                        <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            Recent Orders
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.slice(0, 10).map((order) => (
                                        <tr key={order.orderId} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 font-semibold text-black">{order.orderId}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {new Date(order.orderDate).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold capitalize">
                                                    {order.status || 'confirmed'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                                            </td>
                                            <td className="py-3 px-4 font-bold text-[#2D5016]">₹{order.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <Suspense fallback={<div className="h-20 bg-white"></div>}>
                <Footer />
            </Suspense>
        </div>
    );
}


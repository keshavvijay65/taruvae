'use client';

import { useState, useEffect, Suspense } from 'react';

// Skip static generation (uses Header with useSearchParams)
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCustomersFromFirebase } from '@/lib/firebaseOrders';

interface Customer {
    email: string;
    name: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
    isRegisteredOnly?: boolean; // true if user is registered but hasn't placed any orders
}

export default function AdminCustomersPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const auth = localStorage.getItem('admin-authenticated');
        if (auth === 'true') {
            setIsAuthenticated(true);
            loadCustomers();
        } else {
            router.push('/admin/login');
        }
        setLoading(false);
    }, [router]);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            console.log('Loading customers...');
            const customersData = await getCustomersFromFirebase();
            console.log('Customers loaded:', customersData.length);
            customersData.sort((a, b) => b.totalSpent - a.totalSpent);
            setCustomers(customersData);
        } catch (error) {
            console.error('Error loading customers:', error);
            // Fallback: try loading from localStorage directly
            try {
                const localOrders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
                console.log('Fallback: Loading from localStorage, found', localOrders.length, 'orders');
                
                const customerMap = new Map<string, {
                    email: string;
                    name: string;
                    phone: string;
                    orders: any[];
                }>();

                localOrders.forEach((order: any) => {
                    if (!order.customer || !order.customer.email) {
                        console.warn('Order missing customer data:', order.orderId);
                        return;
                    }
                    const email = order.customer.email.toLowerCase().trim();
                    if (!email) {
                        console.warn('Order missing email:', order.orderId);
                        return;
                    }
                    const customerName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Guest Customer';
                    
                    if (!customerMap.has(email)) {
                        customerMap.set(email, {
                            email: order.customer.email,
                            name: customerName,
                            phone: order.customer.phone || 'N/A',
                            orders: [],
                        });
                    }
                    customerMap.get(email)!.orders.push(order);
                });

                const customersData = Array.from(customerMap.values()).map(customer => ({
                    email: customer.email,
                    name: customer.name,
                    phone: customer.phone,
                    totalOrders: customer.orders.length,
                    totalSpent: customer.orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
                    lastOrderDate: customer.orders.sort((a: any, b: any) => 
                        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
                    )[0].orderDate,
                }));

                customersData.sort((a, b) => b.totalSpent - a.totalSpent);
                console.log('Fallback: Found', customersData.length, 'customers');
                setCustomers(customersData);
            } catch (fallbackError) {
                console.error('Error in fallback:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );

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
                                Customers Management
                            </h1>
                        </div>
                        <button
                            onClick={loadCustomers}
                            disabled={loading}
                            className="inline-flex items-center gap-2 bg-[#2D5016] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-96 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-[#2D5016]"
                        />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-blue-700 mb-2">Total Customers</h3>
                            <p className="text-3xl font-bold text-blue-800">{customers.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-green-700 mb-2">With Orders</h3>
                            <p className="text-3xl font-bold text-green-800">
                                {customers.filter(c => c.totalOrders > 0).length}
                            </p>
                            <p className="text-xs text-green-600 mt-1">Active Customers</p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-yellow-700 mb-2">Registered Only</h3>
                            <p className="text-3xl font-bold text-yellow-800">
                                {customers.filter(c => c.totalOrders === 0 || c.isRegisteredOnly).length}
                            </p>
                            <p className="text-xs text-yellow-600 mt-1">No Orders Yet</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-purple-700 mb-2">Total Revenue</h3>
                            <p className="text-3xl font-bold text-purple-800">
                                ₹{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Customers Table */}
                    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                        <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                            All Customers ({filteredCustomers.length})
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Orders</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Spent</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Order</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-gray-500">
                                                No customers found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCustomers.map((customer, index) => (
                                            <tr key={customer.email} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    {customer.isRegisteredOnly || customer.totalOrders === 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            Registered
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Customer
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="font-semibold text-black">{customer.name}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-gray-700">{customer.email}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-gray-700">{customer.phone}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                        customer.totalOrders === 0 
                                                            ? 'bg-gray-100 text-gray-600' 
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {customer.totalOrders}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className={`font-bold ${
                                                        customer.totalSpent === 0 
                                                            ? 'text-gray-500' 
                                                            : 'text-[#2D5016]'
                                                    }`}>
                                                        ₹{customer.totalSpent.toLocaleString()}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {customer.totalOrders === 0 ? (
                                                        <p className="text-sm text-gray-400 italic">No orders yet</p>
                                                    ) : (
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(customer.lastOrderDate).toLocaleDateString('en-IN', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
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


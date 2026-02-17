'use client';

import React, { useState, useEffect, Suspense } from 'react';

// Skip static generation (uses Header with useSearchParams)
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCustomersFromFirebase, getAllOrdersFromFirebase } from '@/lib/firebaseOrders';
import { getAllUsersFromFirebase, UserDetails } from '@/lib/firebaseUsers';
import { Order } from '@/types';

interface Customer {
    uid?: string;
    email: string;
    name: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
    isRegisteredOnly?: boolean;
    // Login details
    createdAt?: string | null;
    lastLoginAt?: string | null;
    provider?: 'google' | 'password';
    photoURL?: string;
    // Enhanced details
    averageOrderValue?: number;
    firstOrderDate?: string;
    orderFrequency?: number; // days between orders
    orders?: any[]; // full order details
    location?: string; // city, state
    paymentMethods?: string[];
    favoriteProducts?: string[];
}

export default function AdminCustomersPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

    useEffect(() => {
        const initializePage = async () => {
            try {
                const auth = localStorage.getItem('admin-authenticated');
                if (auth === 'true') {
                    setIsAuthenticated(true);

                    // STEP 1: Load cached data IMMEDIATELY
                    const loadCachedData = () => {
                        try {
                            // Load cached users
                            const cachedUsers = localStorage.getItem('taruvae-all-users');
                            const cachedOrders = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');

                            let users: UserDetails[] = [];
                            if (cachedUsers) {
                                users = JSON.parse(cachedUsers);
                            } else {
                                // Fallback: get from firestore-users
                                const firestoreUsers = JSON.parse(localStorage.getItem('taruvae-firestore-users') || '{}');
                                users = Object.keys(firestoreUsers).map(uid => ({
                                    uid,
                                    ...firestoreUsers[uid],
                                }));
                            }

                            // Merge with order data
                            const orderMap = new Map<string, any>();
                            cachedOrders.forEach((order: any) => {
                                if (order.customer?.email) {
                                    const email = order.customer.email.toLowerCase().trim();
                                    if (!orderMap.has(email)) {
                                        orderMap.set(email, {
                                            orders: [],
                                            totalSpent: 0,
                                        });
                                    }
                                    orderMap.get(email)!.orders.push(order);
                                    orderMap.get(email)!.totalSpent += (order.total || 0);
                                }
                            });

                            // Combine users with order data
                            const customers: Customer[] = users.map(user => {
                                const orderData = orderMap.get(user.email.toLowerCase().trim());
                                const orders = orderData?.orders || [];
                                const sortedOrders = orders.sort((a: any, b: any) =>
                                    new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
                                );

                                // Calculate enhanced metrics
                                const averageOrderValue = orders.length > 0 ? orderData.totalSpent / orders.length : 0;
                                const firstOrderDate = sortedOrders.length > 0 ? sortedOrders[sortedOrders.length - 1]?.orderDate : null;

                                // Calculate order frequency (average days between orders)
                                let orderFrequency = 0;
                                if (orders.length > 1) {
                                    const orderDates = orders.map((o: any) => new Date(o.orderDate).getTime()).sort((a: number, b: number) => a - b);
                                    const intervals: number[] = [];
                                    for (let i = 1; i < orderDates.length; i++) {
                                        intervals.push((orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24));
                                    }
                                    orderFrequency = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                                }

                                // Get location from most recent order
                                const location = sortedOrders[0]?.shippingAddress
                                    ? `${sortedOrders[0].shippingAddress.city}, ${sortedOrders[0].shippingAddress.state}`
                                    : undefined;

                                // Get payment methods used
                                const paymentMethods = [...new Set(orders.map((o: any) =>
                                    (o.paymentMethod?.toLowerCase() === 'cod') ? 'COD' : 'Online'
                                ))];

                                // Get favorite products (most ordered)
                                const productCounts = new Map<string, number>();
                                orders.forEach((o: any) => {
                                    o.items?.forEach((item: any) => {
                                        const count = productCounts.get(item.name) || 0;
                                        productCounts.set(item.name, count + item.quantity);
                                    });
                                });
                                const favoriteProducts = Array.from(productCounts.entries())
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 3)
                                    .map(([name]) => name);

                                return {
                                    uid: user.uid,
                                    email: user.email,
                                    name: user.name,
                                    phone: user.phone || 'N/A',
                                    totalOrders: orders.length,
                                    totalSpent: orderData?.totalSpent || 0,
                                    lastOrderDate: sortedOrders[0]?.orderDate || '',
                                    firstOrderDate: firstOrderDate || undefined,
                                    averageOrderValue,
                                    orderFrequency: orderFrequency > 0 ? Math.round(orderFrequency) : undefined,
                                    isRegisteredOnly: !orderData || orders.length === 0,
                                    createdAt: user.createdAt,
                                    lastLoginAt: user.lastLoginAt,
                                    provider: user.provider,
                                    photoURL: user.photoURL,
                                    orders: sortedOrders,
                                    location,
                                    paymentMethods: (paymentMethods.length > 0 ? paymentMethods : undefined) as string[] | undefined,
                                    favoriteProducts: (favoriteProducts.length > 0 ? favoriteProducts : undefined) as string[] | undefined,
                                };
                            });

                            // Add customers from orders who aren't in users list
                            orderMap.forEach((orderData, email) => {
                                if (!customers.find(c => c.email.toLowerCase() === email)) {
                                    const sortedOrders = orderData.orders.sort((a: any, b: any) =>
                                        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
                                    );
                                    const firstOrder = sortedOrders[sortedOrders.length - 1];

                                    // Calculate enhanced metrics
                                    const averageOrderValue = orderData.orders.length > 0 ? orderData.totalSpent / orderData.orders.length : 0;

                                    // Calculate order frequency
                                    let orderFrequency = 0;
                                    if (orderData.orders.length > 1) {
                                        const orderDates = orderData.orders.map((o: any) => new Date(o.orderDate).getTime()).sort((a: number, b: number) => a - b);
                                        const intervals: number[] = [];
                                        for (let i = 1; i < orderDates.length; i++) {
                                            intervals.push((orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24));
                                        }
                                        orderFrequency = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                                    }

                                    const location = sortedOrders[0]?.shippingAddress
                                        ? `${sortedOrders[0].shippingAddress.city}, ${sortedOrders[0].shippingAddress.state}`
                                        : undefined;

                                    const paymentMethods = [...new Set(orderData.orders.map((o: any) =>
                                        (o.paymentMethod?.toLowerCase() === 'cod') ? 'COD' : 'Online'
                                    ))];

                                    const productCounts = new Map<string, number>();
                                    orderData.orders.forEach((o: any) => {
                                        o.items?.forEach((item: any) => {
                                            const count = productCounts.get(item.name) || 0;
                                            productCounts.set(item.name, count + item.quantity);
                                        });
                                    });
                                    const favoriteProducts = Array.from(productCounts.entries())
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 3)
                                        .map(([name]) => name);

                                    customers.push({
                                        email: firstOrder.customer.email,
                                        name: `${firstOrder.customer.firstName || ''} ${firstOrder.customer.lastName || ''}`.trim() || 'Guest Customer',
                                        phone: firstOrder.customer.phone || 'N/A',
                                        totalOrders: orderData.orders.length,
                                        totalSpent: orderData.totalSpent,
                                        lastOrderDate: sortedOrders[0]?.orderDate || '',
                                        firstOrderDate: firstOrder?.orderDate,
                                        averageOrderValue,
                                        orderFrequency: orderFrequency > 0 ? Math.round(orderFrequency) : undefined,
                                        isRegisteredOnly: false,
                                        orders: sortedOrders,
                                        location,
                                        paymentMethods: (paymentMethods.length > 0 ? paymentMethods : undefined) as string[] | undefined,
                                        favoriteProducts: (favoriteProducts.length > 0 ? favoriteProducts : undefined) as string[] | undefined,
                                    });
                                }
                            });

                            customers.sort((a, b) => {
                                // Sort by lastLoginAt first (most recent), then by totalSpent
                                if (a.lastLoginAt && b.lastLoginAt) {
                                    return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
                                }
                                if (a.lastLoginAt) return -1;
                                if (b.lastLoginAt) return 1;
                                return b.totalSpent - a.totalSpent;
                            });

                            setCustomers(customers);
                            setLoading(false); // Show UI immediately
                        } catch (cacheError) {
                            console.warn('Error loading cached data:', cacheError);
                        }
                    };

                    loadCachedData();

                    // STEP 2: Fetch fresh data in background
                    const fetchFreshData = async () => {
                        try {
                            // Fetch users, customer stats, and ALL orders in parallel
                            const [usersData, ordersData, freshOrders] = await Promise.all([
                                Promise.race([
                                    getAllUsersFromFirebase(),
                                    new Promise<UserDetails[]>((_, reject) =>
                                        setTimeout(() => reject(new Error('Users load timeout')), 2000)
                                    )
                                ]).catch(() => null),
                                Promise.race([
                                    getCustomersFromFirebase(),
                                    new Promise<Customer[]>((_, reject) =>
                                        setTimeout(() => reject(new Error('Orders load timeout')), 2000)
                                    )
                                ]).catch(() => null),
                                Promise.race([
                                    getAllOrdersFromFirebase(),
                                    new Promise<Order[]>((_, reject) =>
                                        setTimeout(() => reject(new Error('All orders load timeout')), 3000)
                                    )
                                ]).catch(() => null),
                            ]);

                            if (usersData && ordersData) {
                                // Get full orders from fresh data (fallback to localStorage if fetch failed)
                                const allOrdersToUse = freshOrders || JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
                                const fullOrderMap = new Map<string, any[]>();
                                allOrdersToUse.forEach((order: any) => {
                                    if (order.customer?.email) {
                                        const email = order.customer.email.toLowerCase().trim();
                                        if (!fullOrderMap.has(email)) {
                                            fullOrderMap.set(email, []);
                                        }
                                        fullOrderMap.get(email)!.push(order);
                                    }
                                });

                                // Merge users with order data
                                const orderMap = new Map<string, Customer>();
                                ordersData.forEach(order => {
                                    const email = order.email.toLowerCase().trim();
                                    if (!orderMap.has(email)) {
                                        orderMap.set(email, order);
                                    }
                                });

                                const mergedCustomers: Customer[] = usersData.map(user => {
                                    const orderData = orderMap.get(user.email.toLowerCase().trim());
                                    const fullOrders = fullOrderMap.get(user.email.toLowerCase().trim()) || [];
                                    const sortedOrders = fullOrders.sort((a: any, b: any) =>
                                        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
                                    );

                                    // Calculate enhanced metrics
                                    const averageOrderValue = fullOrders.length > 0 ? (orderData?.totalSpent || 0) / fullOrders.length : 0;
                                    const firstOrderDate = sortedOrders.length > 0 ? sortedOrders[sortedOrders.length - 1]?.orderDate : null;

                                    let orderFrequency = 0;
                                    if (fullOrders.length > 1) {
                                        const orderDates = fullOrders.map((o: any) => new Date(o.orderDate).getTime()).sort((a: number, b: number) => a - b);
                                        const intervals: number[] = [];
                                        for (let i = 1; i < orderDates.length; i++) {
                                            intervals.push((orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24));
                                        }
                                        orderFrequency = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                                    }

                                    const location = sortedOrders[0]?.shippingAddress
                                        ? `${sortedOrders[0].shippingAddress.city}, ${sortedOrders[0].shippingAddress.state}`
                                        : undefined;

                                    const paymentMethods = [...new Set(fullOrders.map((o: any) =>
                                        (o.paymentMethod?.toLowerCase() === 'cod') ? 'COD' : 'Online'
                                    ))];

                                    const productCounts = new Map<string, number>();
                                    fullOrders.forEach((o: any) => {
                                        o.items?.forEach((item: any) => {
                                            const count = productCounts.get(item.name) || 0;
                                            productCounts.set(item.name, count + item.quantity);
                                        });
                                    });
                                    const favoriteProducts = Array.from(productCounts.entries())
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 3)
                                        .map(([name]) => name);

                                    return {
                                        uid: user.uid,
                                        email: user.email,
                                        name: user.name,
                                        phone: user.phone || 'N/A',
                                        totalOrders: orderData?.totalOrders || 0,
                                        totalSpent: orderData?.totalSpent || 0,
                                        lastOrderDate: orderData?.lastOrderDate || '',
                                        firstOrderDate: firstOrderDate || undefined,
                                        averageOrderValue,
                                        orderFrequency: orderFrequency > 0 ? Math.round(orderFrequency) : undefined,
                                        isRegisteredOnly: !orderData || orderData.totalOrders === 0,
                                        createdAt: user.createdAt,
                                        lastLoginAt: user.lastLoginAt,
                                        provider: user.provider,
                                        photoURL: user.photoURL,
                                        orders: sortedOrders,
                                        location,
                                        paymentMethods: paymentMethods.length > 0 ? paymentMethods : undefined,
                                        favoriteProducts: favoriteProducts.length > 0 ? favoriteProducts : undefined,
                                    };
                                });

                                // Add customers from orders who aren't in users list
                                ordersData.forEach(order => {
                                    if (!mergedCustomers.find(c => c.email.toLowerCase() === order.email.toLowerCase())) {
                                        const fullOrders = fullOrderMap.get(order.email.toLowerCase()) || [];
                                        const sortedOrders = fullOrders.sort((a: any, b: any) =>
                                            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
                                        );

                                        const averageOrderValue = fullOrders.length > 0 ? (order.totalSpent || 0) / fullOrders.length : 0;
                                        const firstOrderDate = sortedOrders.length > 0 ? sortedOrders[sortedOrders.length - 1]?.orderDate : null;

                                        let orderFrequency = 0;
                                        if (fullOrders.length > 1) {
                                            const orderDates = fullOrders.map((o: any) => new Date(o.orderDate).getTime()).sort((a: number, b: number) => a - b);
                                            const intervals: number[] = [];
                                            for (let i = 1; i < orderDates.length; i++) {
                                                intervals.push((orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24));
                                            }
                                            orderFrequency = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                                        }

                                        const location = sortedOrders[0]?.shippingAddress
                                            ? `${sortedOrders[0].shippingAddress.city}, ${sortedOrders[0].shippingAddress.state}`
                                            : undefined;

                                        const paymentMethods = [...new Set(fullOrders.map((o: any) => o.paymentMethod))];

                                        const productCounts = new Map<string, number>();
                                        fullOrders.forEach((o: any) => {
                                            o.items?.forEach((item: any) => {
                                                const count = productCounts.get(item.name) || 0;
                                                productCounts.set(item.name, count + item.quantity);
                                            });
                                        });
                                        const favoriteProducts = Array.from(productCounts.entries())
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 3)
                                            .map(([name]) => name);

                                        mergedCustomers.push({
                                            ...order,
                                            firstOrderDate: firstOrderDate || undefined,
                                            averageOrderValue,
                                            orderFrequency: orderFrequency > 0 ? Math.round(orderFrequency) : undefined,
                                            isRegisteredOnly: false,
                                            orders: sortedOrders,
                                            location,
                                            paymentMethods: paymentMethods.length > 0 ? paymentMethods : undefined,
                                            favoriteProducts: favoriteProducts.length > 0 ? favoriteProducts : undefined,
                                        });
                                    }
                                });

                                mergedCustomers.sort((a, b) => {
                                    if (a.lastLoginAt && b.lastLoginAt) {
                                        return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
                                    }
                                    if (a.lastLoginAt) return -1;
                                    if (b.lastLoginAt) return 1;
                                    return b.totalSpent - a.totalSpent;
                                });

                                setCustomers(mergedCustomers);
                            }
                        } catch (error) {
                            console.error('Error fetching fresh data:', error);
                            // Keep cached data
                        }
                    };

                    fetchFreshData();
                } else {
                    router.push('/admin/login');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error initializing customers page:', error);
                setLoading(false);
            }
        };
        initializePage();
    }, [router]);

    const loadCustomers = async () => {
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
                setCustomers(customersData as any);
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
                setCustomers([]);
                console.error('Error in fallback:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        (customer.uid && customer.uid.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.provider && customer.provider.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.location && customer.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.favoriteProducts && customer.favoriteProducts.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())))
    );



    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">

            <div className="pt-[calc(var(--header-height,80px)+2rem)] pb-8 md:pb-12">
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Link
                                href="/admin/dashboard"
                                className="inline-flex items-center gap-2 text-brand-dark hover:text-gold mb-4 transition-colors"
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
                            className="inline-flex items-center gap-2 bg-brand text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {/* Enhanced Search Bar */}
                    <div className="mb-8">
                        <div className="relative max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name, email, phone, or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm hover:shadow-md bg-white text-text-primary placeholder-text-secondary"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                >
                                    <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {searchTerm && (
                            <p className="mt-2 text-sm text-gray-600">
                                Found <span className="font-semibold text-brand-dark">{filteredCustomers.length}</span> customer{filteredCustomers.length !== 1 ? 's' : ''} matching "{searchTerm}"
                            </p>
                        )}
                    </div>

                    {/* Enhanced Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-sm font-semibold text-blue-100 mb-2 uppercase tracking-wide">Total Customers</h3>
                                <p className="text-4xl font-bold text-white mb-1">{customers.length}</p>
                                <p className="text-xs text-blue-200">All registered users</p>
                            </div>
                        </div>

                        <div className="group relative bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-sm font-semibold text-green-100 mb-2 uppercase tracking-wide">Active Customers</h3>
                                <p className="text-4xl font-bold text-white mb-1">
                                    {customers.filter(c => c.totalOrders > 0).length}
                                </p>
                                <p className="text-xs text-green-200">With orders placed</p>
                            </div>
                        </div>

                        <div className="group relative bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-sm font-semibold text-amber-100 mb-2 uppercase tracking-wide">Registered Only</h3>
                                <p className="text-4xl font-bold text-white mb-1">
                                    {customers.filter(c => c.totalOrders === 0 || c.isRegisteredOnly).length}
                                </p>
                                <p className="text-xs text-amber-200">No orders yet</p>
                            </div>
                        </div>

                        <div className="group relative bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-sm font-semibold text-purple-100 mb-2 uppercase tracking-wide">Total Revenue</h3>
                                <p className="text-4xl font-bold text-white mb-1">
                                    ₹{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-purple-200">All-time sales</p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Stats Row */}
                    {customers.filter(c => c.totalOrders > 0).length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Average Order Value</h4>
                                        <p className="text-2xl font-bold text-indigo-900">
                                            ₹{Math.round(customers.filter(c => c.totalOrders > 0).reduce((sum, c) => sum + (c.averageOrderValue || 0), 0) / customers.filter(c => c.totalOrders > 0).length).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Customer Lifetime Value</h4>
                                        <p className="text-2xl font-bold text-teal-900">
                                            ₹{Math.round(customers.filter(c => c.totalOrders > 0).reduce((sum, c) => sum + c.totalSpent, 0) / customers.filter(c => c.totalOrders > 0).length).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Avg Order Frequency</h4>
                                        <p className="text-2xl font-bold text-rose-900">
                                            {customers.filter(c => c.orderFrequency).length > 0
                                                ? Math.round(customers.filter(c => c.orderFrequency).reduce((sum, c) => sum + (c.orderFrequency || 0), 0) / customers.filter(c => c.orderFrequency).length)
                                                : 0
                                            } days
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Enhanced Customers Table */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                All Customers ({filteredCustomers.length})
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span>Click row to view details</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                                        <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Status</th>
                                        <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Customer</th>
                                        <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Contact</th>
                                        <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Login</th>
                                        <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Activity</th>
                                        <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Orders</th>
                                        <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Revenue</th>
                                        <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Last Order</th>
                                        <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <p className="text-gray-500 text-lg font-medium">No customers found</p>
                                                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCustomers.map((customer, index) => {
                                            const isExpanded = expandedCustomer === (customer.email || customer.uid || index.toString());
                                            const customerKey = customer.email || customer.uid || index.toString();

                                            return (
                                                <React.Fragment key={customerKey}>
                                                    <tr
                                                        onClick={() => setExpandedCustomer(isExpanded ? null : customerKey)}
                                                        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white cursor-pointer transition-all duration-200 group"
                                                    >
                                                        <td className="py-4 px-4">
                                                            {customer.isRegisteredOnly || customer.totalOrders === 0 ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 rounded-full text-xs font-bold shadow-sm border border-amber-200">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                    </svg>
                                                                    Registered
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-50 text-green-800 rounded-full text-xs font-bold shadow-sm border border-green-200">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    Active
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                {customer.photoURL ? (
                                                                    <img src={customer.photoURL} alt={customer.name} className="w-10 h-10 rounded-full ring-2 ring-gray-200" />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm ring-2 ring-gray-200">
                                                                        {customer.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="font-bold text-gray-900">{customer.name}</p>
                                                                    {customer.uid && (
                                                                        <p className="text-xs text-gray-400 mt-0.5">ID: {customer.uid.substring(0, 8)}...</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-700">{customer.email}</p>
                                                                <p className="text-xs text-gray-500 mt-0.5">{customer.phone}</p>
                                                                {customer.location && (
                                                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        </svg>
                                                                        {customer.location}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${customer.provider === 'google'
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                                                                }`}>
                                                                {customer.provider === 'google' ? (
                                                                    <>
                                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                                        </svg>
                                                                        Google
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                        </svg>
                                                                        Email
                                                                    </>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="space-y-1">
                                                                {customer.createdAt ? (
                                                                    <p className="text-xs text-gray-600">
                                                                        <span className="font-semibold">Joined:</span> {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                        })}
                                                                    </p>
                                                                ) : null}
                                                                {customer.lastLoginAt ? (
                                                                    <p className="text-xs text-gray-600">
                                                                        <span className="font-semibold">Last:</span> {new Date(customer.lastLoginAt).toLocaleDateString('en-IN', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                        })}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-xs text-gray-400 italic">Never logged in</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`inline-flex items-center justify-center w-fit px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${customer.totalOrders === 0
                                                                    ? 'bg-gray-100 text-gray-600'
                                                                    : 'bg-blue-100 text-blue-800'
                                                                    }`}>
                                                                    {customer.totalOrders}
                                                                </span>
                                                                {customer.averageOrderValue && customer.averageOrderValue > 0 && (
                                                                    <p className="text-xs text-gray-500">AOV: ₹{Math.round(customer.averageOrderValue).toLocaleString()}</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div>
                                                                <p className={`text-lg font-bold ${customer.totalSpent === 0
                                                                    ? 'text-gray-400'
                                                                    : 'text-brand-dark'
                                                                    }`}>
                                                                    ₹{customer.totalSpent.toLocaleString()}
                                                                </p>
                                                                {customer.orderFrequency && (
                                                                    <p className="text-xs text-gray-500 mt-0.5">Every {customer.orderFrequency} days</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {customer.totalOrders === 0 ? (
                                                                <p className="text-sm text-gray-400 italic">No orders</p>
                                                            ) : (
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-700">
                                                                        {new Date(customer.lastOrderDate).toLocaleDateString('en-IN', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                        })}
                                                                    </p>
                                                                    {customer.firstOrderDate && customer.firstOrderDate !== customer.lastOrderDate && (
                                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                                            First: {new Date(customer.firstOrderDate).toLocaleDateString('en-IN', {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                            })}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && customer.orders && customer.orders.length > 0 && (
                                                        <tr className="bg-gray-50">
                                                            <td colSpan={9} className="px-6 py-6">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                                                    {customer.averageOrderValue && customer.averageOrderValue > 0 && (
                                                                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Average Order Value</p>
                                                                            <p className="text-2xl font-bold text-indigo-600">₹{Math.round(customer.averageOrderValue).toLocaleString()}</p>
                                                                        </div>
                                                                    )}
                                                                    {customer.orderFrequency && (
                                                                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Order Frequency</p>
                                                                            <p className="text-2xl font-bold text-teal-600">{customer.orderFrequency} days</p>
                                                                        </div>
                                                                    )}
                                                                    {customer.paymentMethods && customer.paymentMethods.length > 0 && (
                                                                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment Methods</p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {customer.paymentMethods.map((method, idx) => (
                                                                                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                                                                        {method === 'Online' ? '💳 Online' : '💵 COD'}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {customer.favoriteProducts && customer.favoriteProducts.length > 0 && (
                                                                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm md:col-span-2 lg:col-span-3">
                                                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Favorite Products</p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {customer.favoriteProducts.map((product, idx) => (
                                                                                    <span key={idx} className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold">
                                                                                        {product}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="mt-4">
                                                                    <p className="text-sm font-bold text-gray-700 mb-3">Recent Orders ({customer.orders.length})</p>
                                                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                                                        {customer.orders.slice(0, 5).map((order: any, idx: number) => (
                                                                            <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                                                                                <div className="flex-1">
                                                                                    <p className="text-sm font-semibold text-gray-900">Order #{order.orderId?.substring(0, 8) || 'N/A'}</p>
                                                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                                                        {new Date(order.orderDate).toLocaleDateString('en-IN', {
                                                                                            year: 'numeric',
                                                                                            month: 'long',
                                                                                            day: 'numeric',
                                                                                        })}
                                                                                    </p>
                                                                                    {order.items && order.items.length > 0 && (
                                                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                                                            {order.items.map((item: any, itemIdx: number) => (
                                                                                                <span key={itemIdx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                                                                    {item.name} (x{item.quantity})
                                                                                                </span>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <p className="text-lg font-bold text-brand">₹{order.total?.toLocaleString() || 0}</p>
                                                                                    {order.status && (
                                                                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                                                order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                                                                    'bg-gray-100 text-gray-700'
                                                                                            }`}>
                                                                                            {order.status}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}


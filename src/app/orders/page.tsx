'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

interface StatusHistory {
    status: OrderStatus;
    date: string;
    message: string;
}

interface Order {
    orderId: string;
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    shippingAddress: {
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: Array<{
        id: number;
        name: string;
        price: number;
        quantity: number;
        total: number;
    }>;
    paymentMethod: string;
    subtotal: number;
    shipping: number;
    total: number;
    orderDate: string;
    status?: OrderStatus;
    trackingNumber?: string;
    statusHistory?: StatusHistory[];
}

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case 'confirmed':
            return 'bg-blue-100 text-blue-800';
        case 'processing':
            return 'bg-yellow-100 text-yellow-800';
        case 'shipped':
            return 'bg-purple-100 text-purple-800';
        case 'out_for_delivery':
            return 'bg-orange-100 text-orange-800';
        case 'delivered':
            return 'bg-green-100 text-green-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
        case 'confirmed':
            return 'Confirmed';
        case 'processing':
            return 'Processing';
        case 'shipped':
            return 'Shipped';
        case 'out_for_delivery':
            return 'Out for Delivery';
        case 'delivered':
            return 'Delivered';
        case 'cancelled':
            return 'Cancelled';
        default:
            return 'Confirmed';
    }
};

const getStatusProgress = (status: OrderStatus) => {
    const statuses: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = statuses.indexOf(status);
    return currentIndex >= 0 ? currentIndex + 1 : 0;
};

export default function OrdersPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) {
            return;
        }

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (!user) {
            setLoading(false);
            return;
        }

        loadOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, authLoading, user?.id, user?.email]);

    const loadOrders = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.warn('Order loading timeout, using localStorage only');
            setLoading(false);
        }, 10000); // 10 second timeout

        try {
            let allOrders: Order[] = [];

            // Try to get from Firebase first (with timeout)
            try {
                const { getAllOrdersFromFirebase } = await import('@/lib/firebaseOrders');
                const firebasePromise = getAllOrdersFromFirebase();
                const timeoutPromise = new Promise<Order[]>((_, reject) => 
                    setTimeout(() => reject(new Error('Firebase timeout')), 5000)
                );
                
                const firebaseOrders = await Promise.race([firebasePromise, timeoutPromise]);
                if (firebaseOrders && firebaseOrders.length > 0) {
                    // Cast to local Order type with proper status
                    allOrders = firebaseOrders.map(order => ({
                        ...order,
                        status: (order.status as OrderStatus) || 'confirmed'
                    })) as Order[];
                    console.log(`Loaded ${firebaseOrders.length} orders from Firebase`);
                }
            } catch (error) {
                console.log('Firebase not available or timeout, using localStorage:', error);
            }

            // Always merge with localStorage orders
            const localOrders: Order[] = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
            console.log(`Found ${localOrders.length} orders in localStorage`);

            // Merge orders, avoiding duplicates by orderId
            const orderMap = new Map<string, Order>();
            
            // Add Firebase orders first
            allOrders.forEach(order => {
                if (order.orderId) {
                    orderMap.set(order.orderId, order);
                }
            });
            
            // Add localStorage orders (will overwrite if same orderId, but that's fine)
            localOrders.forEach(order => {
                if (order.orderId) {
                    orderMap.set(order.orderId, order);
                }
            });
            
            // Convert back to array
            allOrders = Array.from(orderMap.values());
            console.log(`Total orders found: ${allOrders.length}`);

            // Filter orders by current user - Only show orders belonging to this user
            const userOrders = allOrders.filter(order => {
                if (!order.customer || !order.customer.email) {
                    return false;
                }
                
                const orderUserId = (order as any).userId;
                const orderUserEmail = order.customer?.email?.toLowerCase().trim();
                const currentUserEmail = user?.email?.toLowerCase().trim();
                const currentUserId = user?.id;

                // Match by userId or email
                const matches = orderUserId === currentUserId || 
                       orderUserId === currentUserEmail ||
                       orderUserEmail === currentUserEmail;
                
                if (!matches) {
                    console.log('Order filtered out:', {
                        orderId: order.orderId,
                        orderEmail: orderUserEmail,
                        currentEmail: currentUserEmail,
                        orderUserId,
                        currentUserId
                    });
                }
                
                return matches;
            });

            console.log(`Filtered to ${userOrders.length} user orders`);

            // Add default status to orders
            const ordersWithStatus = userOrders.map(order => ({
                ...order,
                status: order.status || 'confirmed',
                trackingNumber: order.trackingNumber || `TRK${order.orderId.replace('ORD-', '')}`,
                statusHistory: order.statusHistory || [
                    {
                        status: 'confirmed' as OrderStatus,
                        date: order.orderDate,
                        message: 'Order confirmed and payment received',
                    },
                ],
            }));

            // Remove duplicates
            const uniqueOrders = ordersWithStatus.filter((order, index, self) =>
                index === self.findIndex((o) => o.orderId === order.orderId)
            );

            // Sort by date (newest first)
            uniqueOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

            console.log(`Final orders count: ${uniqueOrders.length}`);
            clearTimeout(timeoutId);
            setOrders(uniqueOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
            clearTimeout(timeoutId);
            // Fallback to localStorage only
            try {
                const localOrders: Order[] = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
                console.log(`Fallback: Found ${localOrders.length} orders in localStorage`);
                
                const userOrders = localOrders.filter(order => {
                    if (!order.customer || !order.customer.email) return false;
                    const orderUserId = (order as any).userId;
                    const orderUserEmail = order.customer?.email?.toLowerCase().trim();
                    const currentUserEmail = user?.email?.toLowerCase().trim();
                    const currentUserId = user?.id;
                    return orderUserId === currentUserId || 
                           orderUserId === currentUserEmail ||
                           orderUserEmail === currentUserEmail;
                });
                
                console.log(`Fallback: Filtered to ${userOrders.length} user orders`);
                
                const ordersWithStatus = userOrders.map(order => ({
                    ...order,
                    status: order.status || 'confirmed',
                    trackingNumber: order.trackingNumber || `TRK${order.orderId.replace('ORD-', '')}`,
                    statusHistory: order.statusHistory || [
                        {
                            status: 'confirmed' as OrderStatus,
                            date: order.orderDate,
                            message: 'Order confirmed and payment received',
                        },
                    ],
                }));
                
                ordersWithStatus.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
                setOrders(ordersWithStatus);
            } catch (fallbackError) {
                console.error('Error in fallback:', fallbackError);
                setOrders([]);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl py-20">
                    <div className="text-center">
                        <p className="text-gray-600">Loading orders...</p>
                    </div>
                </div>
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
            <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl py-8 md:py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        My Orders
                    </h1>
                    <Link
                        href="/"
                        className="bg-[#2D5016] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="mb-8">
                            <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-black mb-4">No Orders Yet</h2>
                        <p className="text-gray-600 mb-8">You haven't placed any orders yet.</p>
                        <Link
                            href="/"
                            className="inline-block bg-[#2D5016] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const status = order.status || 'confirmed';
                            const progress = getStatusProgress(status);

                            return (
                                <div
                                    key={order.orderId}
                                    className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-4 border-b border-gray-200">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-black">Order ID: {order.orderId}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                                                    {getStatusLabel(status)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Placed on {new Date(order.orderDate).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                            {order.trackingNumber && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Tracking: <span className="font-semibold text-[#2D5016]">{order.trackingNumber}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2 md:mt-0">
                                            <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-sm">
                                                Total: ₹{order.total}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Progress Timeline */}
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-black mb-4">Order Status</h4>
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-2">
                                                {['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, index) => {
                                                    const stepStatus: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
                                                    const isActive = progress > index;
                                                    const isCurrent = progress === index + 1;

                                                    return (
                                                        <div key={step} className="flex flex-col items-center flex-1">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                                                isActive
                                                                    ? 'bg-[#2D5016] border-[#2D5016] text-white'
                                                                    : 'bg-white border-gray-300 text-gray-400'
                                                            } ${isCurrent ? 'ring-4 ring-[#2D5016]/20' : ''}`}>
                                                                {isActive ? (
                                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : (
                                                                    <span className="text-xs font-bold">{index + 1}</span>
                                                                )}
                                                            </div>
                                                            <span className={`text-xs mt-2 text-center ${isActive ? 'text-[#2D5016] font-semibold' : 'text-gray-400'}`}>
                                                                {step}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="relative h-1 bg-gray-200 rounded-full -mt-8 mb-8">
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-[#2D5016] rounded-full transition-all duration-500"
                                                    style={{ width: `${((progress - 1) / 4) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items Summary */}
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-black mb-3">Order Items ({order.items.length})</h4>
                                        <div className="space-y-2">
                                            {order.items.slice(0, 3).map((item) => (
                                                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                                                    <div>
                                                        <p className="font-medium text-black">{item.name}</p>
                                                        <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.price}</p>
                                                    </div>
                                                    <p className="font-semibold text-[#D4AF37]">₹{item.total}</p>
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <p className="text-sm text-gray-500 text-center pt-2">
                                                    +{order.items.length - 3} more item(s)
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => setSelectedOrder(selectedOrder?.orderId === order.orderId ? null : order)}
                                            className="px-4 py-2 bg-[#2D5016] text-white rounded-lg text-sm font-semibold hover:bg-[#4A7C2A] transition-colors"
                                        >
                                            {selectedOrder?.orderId === order.orderId ? 'Hide Details' : 'View Details'}
                                        </button>
                                        <Link
                                            href={`/orders/track?id=${order.orderId}`}
                                            className="px-4 py-2 bg-white border-2 border-[#2D5016] text-[#2D5016] rounded-lg text-sm font-semibold hover:bg-[#F5F1EB] transition-colors"
                                        >
                                            Track Order
                                        </Link>
                                    </div>

                                    {/* Expanded Details */}
                                    {selectedOrder?.orderId === order.orderId && (
                                        <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="font-semibold text-black mb-2">Customer Details</h4>
                                                    <p className="text-sm text-gray-600">
                                                        {order.customer.firstName} {order.customer.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-600">{order.customer.email}</p>
                                                    <p className="text-sm text-gray-600">{order.customer.phone}</p>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-black mb-2">Shipping Address</h4>
                                                    <p className="text-sm text-gray-600">{order.shippingAddress.address}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold text-black mb-3">All Order Items</h4>
                                                <div className="space-y-2">
                                                    {order.items.map((item) => (
                                                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                                                            <div>
                                                                <p className="font-medium text-black">{item.name}</p>
                                                                <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.price}</p>
                                                            </div>
                                                            <p className="font-semibold text-[#D4AF37]">₹{item.total}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold text-black mb-3">Status History</h4>
                                                <div className="space-y-3">
                                                    {order.statusHistory?.map((history, index) => (
                                                        <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                                            <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(history.status).split(' ')[0]}`} />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-black">{getStatusLabel(history.status)}</p>
                                                                <p className="text-sm text-gray-600">{history.message}</p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {new Date(history.date).toLocaleString('en-IN', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                                    <span>Subtotal</span>
                                                    <span className="font-semibold">₹{order.subtotal}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                                    <span>Shipping</span>
                                                    <span className="font-semibold">{order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</span>
                                                </div>
                                                <div className="flex justify-between text-lg font-bold text-black pt-2 border-t border-gray-200">
                                                    <span>Total</span>
                                                    <span>₹{order.total}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2">
                                                    Payment Method: <span className="font-semibold">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
        </div>
    );
}


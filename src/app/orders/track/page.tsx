'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';

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

const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
        case 'confirmed':
            return '✓';
        case 'processing':
            return '⚙️';
        case 'shipped':
            return '📦';
        case 'out_for_delivery':
            return '🚚';
        case 'delivered':
            return '✅';
        case 'cancelled':
            return '❌';
        default:
            return '✓';
    }
};

function OrderTrackingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id') || '';
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        if (!orderId) {
            router.push('/orders');
            return;
        }
        loadOrder();
    }, [orderId, router]);

    useEffect(() => {
        if (order) {
            const orderStatus = (order.status || 'confirmed').toLowerCase();
            if (orderStatus === 'delivered') {
                setShowCelebration(true);
                // Hide celebration after 8 seconds
                const timer = setTimeout(() => {
                    setShowCelebration(false);
                }, 8000);
                return () => clearTimeout(timer);
            }
        }
    }, [order]);

    const loadOrder = () => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        // Try Firebase first
        try {
            const { getAllOrdersFromFirebase } = require('@/lib/firebaseOrders');
            getAllOrdersFromFirebase().then((firebaseOrders: Order[]) => {
                const foundOrder = firebaseOrders.find(o => o.orderId === orderId);
                if (foundOrder) {
                    setOrderWithDefaults(foundOrder);
                } else {
                    loadFromLocalStorage();
                }
            }).catch(() => {
                loadFromLocalStorage();
            });
        } catch {
            loadFromLocalStorage();
        }
    };

    const loadFromLocalStorage = () => {
        const localOrders: Order[] = JSON.parse(localStorage.getItem('taruvae-orders') || '[]');
        const foundOrder = localOrders.find(o => o.orderId === orderId);

        if (foundOrder) {
            setOrderWithDefaults(foundOrder);
        } else {
            setLoading(false);
        }
    };

    const setOrderWithDefaults = (foundOrder: Order) => {
        const orderWithDefaults: Order = {
            ...foundOrder,
            status: (foundOrder.status as OrderStatus) || 'confirmed',
            trackingNumber: foundOrder.trackingNumber || `TRK${foundOrder.orderId.replace('ORD-', '')}`,
            statusHistory: foundOrder.statusHistory || [
                {
                    status: 'confirmed' as OrderStatus,
                    date: foundOrder.orderDate,
                    message: 'Order confirmed and payment received',
                },
            ],
        };
        setOrder(orderWithDefaults);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl py-20">
                    <div className="text-center">
                        <p className="text-gray-600">Loading order details...</p>
                    </div>
                </div>
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-white">
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
                <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl py-20">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-black mb-4">Order Not Found</h2>
                        <p className="text-gray-600 mb-8">The order you're looking for doesn't exist.</p>
                        <Link
                            href="/orders"
                            className="inline-block bg-[#2D5016] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#4A7C2A] transition-colors"
                        >
                            View All Orders
                        </Link>
                    </div>
                </div>
                <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
            </div>
        );
    }

    const status = (order.status || 'confirmed').toLowerCase() as OrderStatus;
    const statuses: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = statuses.indexOf(status);
    const isDelivered = status === 'delivered';

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Header /></Suspense>
            
            {/* Celebration Animation */}
            {showCelebration && isDelivered && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-2xl transform animate-scaleIn max-w-md mx-4">
                        <div className="text-6xl md:text-8xl mb-4 animate-bounce">🎉</div>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#2D5016] mb-2">Order Delivered!</h2>
                        <p className="text-gray-600 text-lg">Thank you for shopping with us!</p>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-6 md:px-8 lg:px-10 max-w-7xl pt-20 sm:pt-24 pb-8 md:pb-12">
                {/* Back Button */}
                <Link
                    href="/orders"
                    className="inline-flex items-center gap-2 text-[#2D5016] hover:text-[#D4AF37] mb-6 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Orders
                </Link>

                {/* Order Header */}
                <div className="bg-white border-2 border-gray-100 rounded-xl p-6 md:p-8 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-black mb-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                Order Tracking
                            </h1>
                            <p className="text-gray-600">Order ID: <span className="font-semibold text-[#2D5016]">{order.orderId}</span></p>
                            {order.trackingNumber && (
                                <p className="text-gray-600">Tracking: <span className="font-semibold text-[#2D5016]">{order.trackingNumber}</span></p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
                                {getStatusIcon(status)} {getStatusLabel(status)}
                            </span>
                        </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-black mb-4">Order Status</h3>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                                {statuses.map((s, index) => {
                                    const isActive = currentIndex >= index;
                                    const isCurrent = currentIndex === index;

                                    return (
                                        <div key={s} className="flex flex-col items-center flex-1">
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
                                                {getStatusLabel(s)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="relative h-1 bg-gray-200 rounded-full -mt-8 mb-8">
                                <div
                                    className="absolute top-0 left-0 h-full bg-[#2D5016] rounded-full transition-all duration-500"
                                    style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status History */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-black mb-3">Status History</h3>
                            <div className="space-y-3">
                                {order.statusHistory.map((history, index) => (
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
                    )}
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Order Items */}
                    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-black mb-4">Order Items</h3>
                        <div className="space-y-3">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                                    <div>
                                        <p className="font-medium text-black">{item.name}</p>
                                        <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                                    </div>
                                    <p className="font-semibold text-[#D4AF37]">₹{item.total.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Customer & Shipping Info */}
                    <div className="space-y-6">
                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                            <h3 className="font-semibold text-black mb-4">Customer Details</h3>
                            <p className="text-gray-700">{order.customer.firstName} {order.customer.lastName}</p>
                            <p className="text-gray-700">{order.customer.email}</p>
                            <p className="text-gray-700">{order.customer.phone}</p>
                        </div>

                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                            <h3 className="font-semibold text-black mb-4">Shipping Address</h3>
                            <p className="text-gray-700">{order.shippingAddress.address}</p>
                            <p className="text-gray-700">
                                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-black mb-4">Order Summary</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-semibold">₹{order.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Shipping</span>
                            <span className="font-semibold">{order.shipping === 0 ? 'Free' : `₹${order.shipping.toLocaleString()}`}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-black pt-3 border-t border-gray-200">
                            <span>Total</span>
                            <span className="text-[#2D5016]">₹{order.total.toLocaleString()}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200 mt-3">
                            <p className="text-sm text-gray-600">
                                Payment Method: <span className="font-semibold">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Order Date: <span className="font-semibold">
                                    {new Date(order.orderDate).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Suspense fallback={<div className="h-20 bg-white"></div>}><Footer /></Suspense>
        </div>
    );
}

export default function OrderTrackingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white"><div className="container mx-auto px-6 py-20"><div className="text-center"><p className="text-gray-600">Loading...</p></div></div></div>}>
            <OrderTrackingContent />
        </Suspense>
    );
}


